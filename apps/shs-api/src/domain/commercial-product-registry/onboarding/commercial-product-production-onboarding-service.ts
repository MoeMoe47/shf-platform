import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { withTransaction } from "../../../db/transaction.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import {
  GOVERNANCE_CAPABILITIES,
  REVIEW_GATE_TYPES,
  type ProductLifecycleState,
  type ReadinessState,
  type ReviewGateStatus,
  type SellabilityStatus,
} from "../model/commercial-product-registry-contract.js";
import { PostgresCommercialProductRegistryRepo } from "../repo/postgres-commercial-product-registry-repo.js";
import type { ProductRegistryExecutor } from "../repo/commercial-product-registry-repository.js";
import { PostgresCommercialProductReviewRepo } from "../review/postgres-commercial-product-review-repo.js";
import { reassessReviewPacket, type ReviewPacket } from "../review/review-contract.js";
import { buildReviewPackets } from "../review/review-packet-generator.js";
import { validateOnboardingCandidate } from "./commercial-product-onboarding.js";

export const PRODUCTION_ONBOARD_CAPABILITY = "commercial_product.production_onboard" as const;
const CONFIRMATION_PHRASE = "ONBOARD_CANDIDATE";
const REGULATED_FAMILIES = new Set(["HEALTHCARE_WORKFORCE", "FIRE_PUBLIC_SAFETY", "AVIATION", "APPRENTICESHIP_WBL"]);
const BLOCKING_DECISION_STATUSES = new Set(["BLOCKED", "STALE", "UNKNOWN", "PENDING"]);
const PROTECTED_EXECUTION_FIELDS = [
  "lifecycle", "lifecycle_state", "lifecycleState", "readiness", "sellability", "sellabilityStatus",
  "canonicalProductId", "commercialProductId", "commercial_product_id", "sourceAuthorities", "source_authorities",
  "reviewDecisions", "review_decisions", "operatorUserId", "operator_user_id", "pricing", "margin", "commission",
  "priceAmount", "marginAmount", "commissionAmount", "customerEligibility", "grantAward", "fundingGuarantee",
] as const;

type Actor = {
  user_id?: string;
  id?: string;
  active_organization_id?: string;
  organization_id?: string;
  actor_system_id?: string;
  tenant_id?: string;
  capabilities?: readonly string[];
  permissions?: readonly string[];
};

type Scope = {
  actorId: string;
  organizationId: string;
  correlationId: string;
};

export class CommercialProductProductionOnboardingError extends Error {
  constructor(public readonly code: string, message = code, public readonly statusCode = 400) {
    super(message);
    this.name = "CommercialProductProductionOnboardingError";
  }
}

function parseArray(value: any) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function scope(actor: Actor, input?: any): Scope {
  const actorId = String(actor?.user_id || actor?.id || "").trim();
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  if (!actorId || actor?.actor_system_id) throw new CommercialProductProductionOnboardingError("PRODUCTION_ONBOARD_HUMAN_OPERATOR_REQUIRED", "A human operator identity is required.", 403);
  if (!organizationId) throw new CommercialProductProductionOnboardingError("PRODUCTION_ONBOARD_ORG_REQUIRED", "Organization context is required.", 403);
  return { actorId, organizationId, correlationId: String(input?.correlationId || input?.correlation_id || `cpr_4i_${randomUUID()}`) };
}

function requireCapability(actor: Actor) {
  const permissions = actor?.capabilities || actor?.permissions || [];
  if (!Array.isArray(permissions) || !permissions.includes(PRODUCTION_ONBOARD_CAPABILITY)) {
    throw new CommercialProductProductionOnboardingError("PRODUCTION_ONBOARD_CAPABILITY_REQUIRED", `${PRODUCTION_ONBOARD_CAPABILITY} is required.`, 403);
  }
}

function rejectProtected(input: any) {
  const keys = Object.keys(input || {});
  const forbidden = keys.filter((key) => (PROTECTED_EXECUTION_FIELDS as readonly string[]).includes(key));
  if (forbidden.length) throw new CommercialProductProductionOnboardingError("PROTECTED_FIELD_INJECTION_REJECTED", `Protected onboarding fields are server controlled: ${forbidden.join(", ")}.`);
}

function latestByGate(decisions: readonly any[]) {
  const latest = new Map<string, any>();
  for (const decision of decisions) {
    const current = latest.get(decision.gate_type);
    if (!current || Number(decision.version) > Number(current.version)) latest.set(decision.gate_type, decision);
  }
  return latest;
}

function nonStaleDecisionStatus(decision: any, asOf: string) {
  if (!decision) return "UNKNOWN";
  const asOfTime = Date.parse(asOf);
  if ([decision.expires_at, decision.stale_at].some((date) => date && Date.parse(date) <= asOfTime)) return "STALE";
  return decision.decision_status;
}

function candidateSource(candidate: any) {
  return (candidate.source_authorities || []).map((source: any) => ({
    sourceAuthorityType: source.source_authority_type,
    sourceAuthorityId: source.source_authority_id || undefined,
    sourceDomain: source.source_domain || undefined,
    sourceRecordId: source.source_record_id,
    sourceVersion: source.source_version || undefined,
    sourceStatus: source.source_status,
    sourceLastVerifiedAt: source.source_last_verified_at || undefined,
    sourceProvenance: source.source_provenance || [],
  }));
}

function sourceRecord(productId: string, source: any) {
  return {
    source_reference_id: `cpr_src_${randomUUID()}`,
    commercial_product_id: productId,
    source_authority_type: source.source_authority_type,
    source_authority_id: source.source_authority_id || null,
    source_domain: source.source_domain || null,
    source_record_id: source.source_record_id,
    source_version: source.source_version || null,
    source_status: source.source_status,
    source_last_verified_at: source.source_last_verified_at || null,
    source_provenance: source.source_provenance || [],
  };
}

export class CommercialProductProductionOnboardingService {
  constructor(
    private readonly onboardingManifest: any,
    private readonly packets: ReadonlyMap<string, ReviewPacket>,
    private readonly registryRepo = new PostgresCommercialProductRegistryRepo(),
    private readonly reviewRepo = new PostgresCommercialProductReviewRepo(),
    private readonly auditWriter = writeAuditEvent,
    private readonly transaction = withTransaction,
    private readonly clock = () => new Date(),
  ) {}

  static async fromDefaultManifests() {
    const readJson = async (relativePath: string) => JSON.parse(await readFile(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8"));
    const [reviewManifest, onboardingManifest] = await Promise.all([
      readJson("../../../../../../docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json"),
      readJson("../../../../../../docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json"),
    ]);
    const generatedAt = reviewManifest.reviewed_at || new Date().toISOString();
    const packets = buildReviewPackets(reviewManifest, onboardingManifest, generatedAt);
    return new CommercialProductProductionOnboardingService(onboardingManifest, new Map(packets.map((packet) => [packet.candidate_id, packet])));
  }

  async dryRun(candidateId: string, actor: Actor, input: any = {}) {
    const ctx = scope(actor, input);
    requireCapability(actor);
    rejectProtected(input);
    const candidate = this.candidate(candidateId);
    const packet = this.packet(candidateId);
    const decisions = await this.reviewRepo.listDecisionHistory(candidateId);
    const sourceHistory = await this.reviewRepo.listSourceResolutionHistory(candidateId);
    const latestSource = sourceHistory.at(-1) || null;
    const existing = await this.registryRepo.getProductById(candidate.proposed_commercial_product_id);
    return this.buildDryRun(candidate, packet, decisions, latestSource, existing, ctx, false);
  }

  async execute(candidateId: string, actor: Actor, input: any = {}) {
    const ctx = scope(actor, input);
    requireCapability(actor);
    rejectProtected(input);
    if (input.confirmation !== CONFIRMATION_PHRASE) {
      throw new CommercialProductProductionOnboardingError("PRODUCTION_ONBOARD_CONFIRMATION_REQUIRED", `confirmation must equal ${CONFIRMATION_PHRASE}.`);
    }
    const candidate = this.candidate(candidateId);
    const packet = this.packet(candidateId);
    if (input.expectedCandidateVersion !== undefined && input.expectedCandidateVersion !== candidate.version) {
      throw new CommercialProductProductionOnboardingError("CANDIDATE_VERSION_STALE", "Candidate changed since dry-run.", 409);
    }
    return this.transaction(async (executor: ProductRegistryExecutor) => {
      await executor.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`cpr-production-onboard:${candidateId}`]);
      const already = await this.onboardingByCandidate(candidateId, executor);
      if (already) {
        const product = await this.registryRepo.getProductById(already.commercial_product_id, executor);
        return { status: "ALREADY_ONBOARDED", idempotent: true, candidate_id: candidateId, commercial_product_id: already.commercial_product_id, product, onboarding: already };
      }
      const existing = await this.registryRepo.getProductById(candidate.proposed_commercial_product_id, executor);
      if (existing) throw new CommercialProductProductionOnboardingError("PRODUCT_ALREADY_EXISTS_WITHOUT_LINEAGE", "Canonical product exists without 4I candidate lineage.", 409);
      const decisions = await Promise.all(REVIEW_GATE_TYPES.map((gate) => this.reviewRepo.getLatestDecision(candidateId, gate, executor, true)));
      const source = await this.reviewRepo.getLatestSourceResolution(candidateId, executor, true);
      const report = this.buildDryRun(candidate, packet, decisions.filter(Boolean), source, null, ctx, true);
      if (input.expectedSourceVersion !== undefined && input.expectedSourceVersion !== report.sourceAuthorityState.latestVersion) {
        throw new CommercialProductProductionOnboardingError("SOURCE_VERSION_STALE", "Source authority changed since dry-run.", 409);
      }
      const expectedDecisionVersions = input.expectedDecisionVersions || {};
      for (const decision of report.currentDecisions) {
        if (expectedDecisionVersions[decision.gateType] !== undefined && expectedDecisionVersions[decision.gateType] !== decision.version) {
          throw new CommercialProductProductionOnboardingError("REVIEW_VERSION_STALE", "Review decision changed since dry-run.", 409);
        }
      }
      if (!report.eligibility.eligible) {
        await this.audit("commercial_product_candidate", candidateId, "commercial_product_registry.production_onboarding_rejected", ctx, null, report, executor);
        throw new CommercialProductProductionOnboardingError("PRODUCTION_ONBOARD_INELIGIBLE", report.eligibility.blockers.join("; ") || "Candidate is not eligible.", 409);
      }
      await this.audit("commercial_product_candidate", candidateId, "commercial_product_registry.production_onboarding_attempted", ctx, null, report, executor);
      const product = await this.createCanonicalProduct(candidate, ctx, executor);
      await this.copyRelatedState(candidate, report, executor);
      const onboarding = await this.insertOnboarding(candidate, report, ctx, executor);
      await this.audit("commercial_product", product.commercial_product_id, "commercial_product_registry.production_onboarding_succeeded", ctx, null, { product, onboarding, eligibility: report.eligibility }, executor);
      return { status: "REGISTERED", idempotent: false, candidate_id: candidateId, commercial_product_id: product.commercial_product_id, product, onboarding, dryRun: report };
    });
  }

  async history(candidateId: string, actor: Actor) {
    scope(actor);
    const result = await this.transaction(async (executor: ProductRegistryExecutor) => this.onboardingByCandidate(candidateId, executor));
    return result ? { item: result } : { item: null };
  }

  private buildDryRun(candidate: any, packet: ReviewPacket, decisions: readonly any[], latestSource: any, existing: any, ctx: Scope, insideExecution: boolean) {
    const asOf = this.clock().toISOString();
    const latest = latestByGate(decisions);
    const reassessment = reassessReviewPacket(packet, [...latest.values()], latestSource, asOf);
    const validationErrors = validateOnboardingCandidate(candidate);
    const requiredGates = packet.current_review_gates.filter((gate: any) => gate.status !== "NOT_REQUIRED");
    const blockingGates: string[] = [];
    const staleGates: string[] = [];
    const missingEvidence: string[] = [];
    const unknownMandatoryGates: string[] = [];
    const missingRequiredDecisions: string[] = [];
    const currentDecisions = requiredGates.map((gate: any) => {
      const decision = latest.get(gate.gate_type);
      const status = nonStaleDecisionStatus(decision, asOf);
      if (!decision) missingRequiredDecisions.push(gate.gate_type);
      if (status === "BLOCKED") blockingGates.push(gate.gate_type);
      if (status === "STALE") staleGates.push(gate.gate_type);
      if (status === "UNKNOWN") unknownMandatoryGates.push(gate.gate_type);
      if ((status === "APPROVED" || status === "NOT_REQUIRED") && !parseArray(decision?.evidence_references).length) missingEvidence.push(gate.gate_type);
      return {
        gateType: gate.gate_type,
        manifestStatus: gate.status,
        decisionStatus: status,
        decisionId: decision?.review_decision_id || null,
        version: decision?.version || 0,
        authorityType: decision?.authority_type || null,
        authorityReference: decision?.authority_reference || null,
        evidenceReferences: parseArray(decision?.evidence_references),
        reviewedAt: decision?.reviewed_at || null,
      };
    });
    const regulated = REGULATED_FAMILIES.has(candidate.family) || candidate.regulated_metadata?.external_training_authority_required === "PENDING";
    const regulatoryDecision = currentDecisions.find((decision) => decision.gateType === "REGULATORY");
    const regulatedBlockers = regulated && (!regulatoryDecision || regulatoryDecision.decisionStatus !== "APPROVED")
      ? ["regulated_candidate_requires_external_regulatory_or_training_authority"]
      : [];
    const sourceBlockers = [];
    if (!latestSource || latestSource.resolution_status !== "RESOLVED") sourceBlockers.push("source_authority_unresolved");
    if (parseArray(latestSource?.remaining_requirements).length) sourceBlockers.push("source_authority_remaining_requirements");
    const entityBlockers = [];
    if (packet.selling_entity === "UNKNOWN" || packet.selling_entity === "JOINT_STRUCTURE_REVIEW_REQUIRED") entityBlockers.push("selling_entity_unresolved");
    if (packet.delivery_entity === "UNKNOWN" || packet.delivery_entity === "JOINT_STRUCTURE_REVIEW_REQUIRED") entityBlockers.push("delivery_entity_unresolved");
    const blockers = [
      ...validationErrors,
      ...sourceBlockers,
      ...missingRequiredDecisions.map((gate) => `missing_required_review_decision:${gate}`),
      ...blockingGates.map((gate) => `blocked_gate:${gate}`),
      ...staleGates.map((gate) => `stale_gate:${gate}`),
      ...unknownMandatoryGates.map((gate) => `unknown_mandatory_gate:${gate}`),
      ...missingEvidence.map((gate) => `missing_evidence:${gate}`),
      ...regulatedBlockers,
      ...entityBlockers,
      ...(!reassessment.production_onboarding_eligibility ? reassessment.eligibility_reason : []),
      ...(existing ? ["candidate_already_onboarded_or_product_exists"] : []),
    ];
    const eligible = blockers.length === 0 && candidate.registration_allowed === true && reassessment.production_onboarding_eligibility === true;
    return {
      mode: "DRY_RUN",
      mutationPerformed: false,
      candidateId: candidate.candidate_id,
      candidateName: candidate.candidate_name,
      sourceAuthorityState: {
        status: latestSource?.resolution_status || "MISSING",
        latestSourceResolutionId: latestSource?.source_resolution_id || null,
        latestVersion: latestSource?.version || 0,
        remainingRequirements: parseArray(latestSource?.remaining_requirements),
      },
      requiredReviewGates: requiredGates.map((gate: any) => gate.gate_type),
      currentDecisions,
      blockingGates,
      staleGates,
      unknownMandatoryGates,
      missingEvidence,
      regulatedRequirements: {
        regulated,
        metadata: candidate.regulated_metadata,
        blockers: regulatedBlockers,
      },
      eligibility: {
        eligible,
        explicitProductionOnboardingEligibility: reassessment.production_onboarding_eligibility === true,
        contractValid: validationErrors.length === 0 && packet.contract_valid,
        blockers: [...new Set(blockers)],
      },
      proposed: {
        canonicalProductId: candidate.proposed_commercial_product_id,
        lifecycle: candidate.lifecycle as ProductLifecycleState,
        readiness: candidate.readiness as ReadinessState,
        sellability: candidate.sellability as SellabilityStatus,
        sourceProvenance: candidate.source_authorities,
        entitlementReferences: candidate.entitlement_refs || [],
        buyerTypes: candidate.buyer_types || [],
        commercialForms: candidate.commercial_forms || [],
        fundingRelationships: candidate.funding_relationships || [],
      },
      expectedAuditEffects: insideExecution
        ? ["commercial_product_registry.production_onboarding_attempted", "commercial_product_registry.product_created", "commercial_product_registry.production_onboarding_succeeded"]
        : ["commercial_product_registry.production_onboarding_attempted when execute is called"],
      operator: { userId: ctx.actorId, organizationId: ctx.organizationId },
      expectedVersions: {
        candidateVersion: candidate.version,
        sourceVersion: latestSource?.version || 0,
        decisionVersions: Object.fromEntries(currentDecisions.map((decision) => [decision.gateType, decision.version])),
      },
      reassessment,
    };
  }

  private async createCanonicalProduct(candidate: any, ctx: Scope, executor: ProductRegistryExecutor) {
    return this.registryRepo.createProduct({
      commercial_product_id: candidate.proposed_commercial_product_id,
      canonical_name: candidate.canonical_name,
      display_name: candidate.display_name,
      slug: candidate.slug,
      commercial_family: candidate.family,
      subfamily: candidate.subfamily || null,
      product_type: candidate.product_type,
      version: 1,
      status: "ACTIVE",
      lifecycle_state: candidate.lifecycle,
      readiness: candidate.readiness,
      readiness_reason: candidate.readiness_reason,
      readiness_authority: candidate.readiness_source?.[0]?.source_domain || "production-onboarding-source-authority",
      readiness_evidence_references: candidateSource(candidate),
      sellability: candidate.sellability,
      sellability_reason: candidate.sellability_reason,
      sellability_authority: candidate.sellability_source?.source_domain || "production-onboarding-source-authority",
      selling_entity: candidate.selling_entity,
      delivery_entity: candidate.delivery_entity,
      partner_required: candidate.partner_required,
      partner_type: candidate.partner_type || null,
      joint_structure_required: candidate.joint_structure_required,
      entity_review_flags: candidate.entity_review_flags || [],
      pricing_status: candidate.pricing_metadata?.pricing_status || "NOT_DEFINED",
      margin_status: candidate.margin_metadata?.margin_status || "UNKNOWN",
      commission_eligible_status: candidate.commission_metadata?.commission_eligible_status || "UNKNOWN",
      renewal_model: candidate.renewal_metadata?.renewal_model || "UNKNOWN",
      created_by: ctx.actorId,
      updated_by: ctx.actorId,
    }, executor);
  }

  private async copyRelatedState(candidate: any, report: any, executor: ProductRegistryExecutor) {
    const productId = candidate.proposed_commercial_product_id;
    for (const source of candidate.source_authorities || []) await this.registryRepo.addSourceAuthority(sourceRecord(productId, source), executor);
    for (const buyer of candidate.buyer_types || []) await this.registryRepo.addBuyerCompatibility({ commercial_product_buyer_id: `cpr_buyer_${randomUUID()}`, commercial_product_id: productId, buyer_type: buyer, status: "UNKNOWN", limitations: [] }, executor);
    for (const form of candidate.commercial_forms || []) await this.registryRepo.addCommercialForm({ commercial_product_form_id: `cpr_form_${randomUUID()}`, commercial_product_id: productId, commercial_form: form, status: "UNKNOWN", limitations: [] }, executor);
    for (const decision of report.currentDecisions) {
      const status = decision.decisionStatus as ReviewGateStatus;
      await this.registryRepo.addReviewGate({
        commercial_product_gate_id: `cpr_gate_${randomUUID()}`,
        commercial_product_id: productId,
        gate_type: decision.gateType,
        status,
        authority: decision.authorityType,
        reference: decision.authorityReference || decision.decisionId,
        reason: status === "APPROVED" ? "Approved human review decision consumed during production onboarding." : "Human review decision consumed during production onboarding.",
        reviewed_at: decision.reviewedAt,
      }, executor);
    }
    for (const funding of candidate.funding_relationships || []) for (const category of funding.categories || []) {
      await this.registryRepo.addFundingRelationship({
        commercial_product_funding_id: `cpr_funding_${randomUUID()}`,
        commercial_product_id: productId,
        funding_relationship_status: funding.status,
        funding_category: category,
        limitations: ["Product compatibility metadata only; no customer eligibility, award, reimbursement, or funding guarantee."],
        provenance: candidate.source_audit_refs || [],
      }, executor);
    }
    for (const entitlement of candidate.entitlement_refs || []) {
      await this.registryRepo.addEntitlementReference({
        commercial_product_entitlement_id: `cpr_ent_${randomUUID()}`,
        commercial_product_id: productId,
        entitlement_id: entitlement.entitlement_id || entitlement.id || String(entitlement),
        entitlement_requirement: entitlement.entitlement_requirement || "REQUIRED",
        entitlement_authority: entitlement.entitlement_authority || null,
        entitlement_status_reference: entitlement.entitlement_status_reference || null,
      }, executor);
    }
    if (candidate.regulated_metadata) await this.registryRepo.upsertRegulatedProgramMetadata({
      commercial_product_id: productId,
      program_types: candidate.regulated_metadata.program_types || [],
      regulatory_authority: candidate.regulated_metadata.regulatory_authority || null,
      external_training_authority_required: candidate.regulated_metadata.external_training_authority_required || "UNKNOWN",
      credential_authority: candidate.regulated_metadata.credential_authority || null,
      partner_required: candidate.regulated_metadata.partner_required === true,
      scope_limitations: candidate.regulated_metadata.scope_limitations || [],
      sales_language_restrictions: candidate.regulated_metadata.sales_language_restrictions || [],
    }, executor);
    await this.registryRepo.upsertImplementationSupport({ commercial_product_id: productId, ...(candidate.implementation_metadata || {}), ...(candidate.support_metadata || {}) }, executor);
    await this.registryRepo.upsertRenewalExpansion({ commercial_product_id: productId, ...(candidate.renewal_metadata || {}), expansion_paths: candidate.expansion_paths || [] }, executor);
    await this.registryRepo.upsertGovernanceState({
      commercial_product_id: productId,
      pricing_status: candidate.pricing_metadata?.pricing_status || "NOT_DEFINED",
      margin_status: candidate.margin_metadata?.margin_status || "UNKNOWN",
      commercial_viability_status: candidate.margin_metadata?.commercial_viability_status || "UNKNOWN",
      commission_eligible_status: candidate.commission_metadata?.commission_eligible_status || "UNKNOWN",
      leadership_override_eligible: candidate.commission_metadata?.leadership_override_eligible || "UNKNOWN",
      renewal_commission_eligible: candidate.commission_metadata?.renewal_commission_eligible || "UNKNOWN",
      expansion_commission_eligible: candidate.commission_metadata?.expansion_commission_eligible || "UNKNOWN",
      revenue_classifications: [],
    }, executor);
  }

  private async insertOnboarding(candidate: any, report: any, ctx: Scope, executor: ProductRegistryExecutor) {
    const lineage = {
      candidate_id: candidate.candidate_id,
      audit_catalog_sources: candidate.source_audit_refs || [],
      source_authority_references: candidate.source_authorities || [],
      review_decisions: report.currentDecisions.map((decision: any) => decision.decisionId),
      onboarding_operator: ctx.actorId,
      onboarding_timestamp: this.clock().toISOString(),
      canonical_product_id: candidate.proposed_commercial_product_id,
    };
    const result = await executor.query(
      `INSERT INTO commercial_product_production_onboardings (
        onboarding_id,candidate_id,commercial_product_id,organization_id,operator_user_id,
        source_resolution_id,source_resolution_version,review_decision_refs,eligibility_snapshot,
        lineage_snapshot,lifecycle_state,readiness,sellability,onboarding_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12,$13,'REGISTERED')
      RETURNING *`,
      [
        `cpr_onboard_${randomUUID()}`, candidate.candidate_id, candidate.proposed_commercial_product_id,
        ctx.organizationId, ctx.actorId, report.sourceAuthorityState.latestSourceResolutionId,
        report.sourceAuthorityState.latestVersion, JSON.stringify(report.currentDecisions.map((decision: any) => ({
          gate_type: decision.gateType,
          review_decision_id: decision.decisionId,
          version: decision.version,
          authority_type: decision.authorityType,
          authority_reference: decision.authorityReference,
          evidence_references: decision.evidenceReferences,
        }))),
        JSON.stringify(report.eligibility), JSON.stringify(lineage),
        report.proposed.lifecycle, report.proposed.readiness, report.proposed.sellability,
      ],
    );
    return result.rows[0];
  }

  private async onboardingByCandidate(candidateId: string, executor: ProductRegistryExecutor) {
    const result = await executor.query("SELECT * FROM commercial_product_production_onboardings WHERE candidate_id=$1 LIMIT 1", [candidateId]);
    return result.rows[0] || null;
  }

  private candidate(candidateId: string) {
    const candidate = (this.onboardingManifest.candidates || []).find((item: any) => item.candidate_id === candidateId);
    if (!candidate) throw new CommercialProductProductionOnboardingError("PRODUCTION_ONBOARD_CANDIDATE_NOT_FOUND", "Candidate not found.", 404);
    return candidate;
  }

  private packet(candidateId: string) {
    const packet = this.packets.get(candidateId);
    if (!packet) throw new CommercialProductProductionOnboardingError("PRODUCTION_ONBOARD_REVIEW_PACKET_NOT_FOUND", "Review packet not found.", 404);
    return packet;
  }

  private async audit(targetType: string, targetId: string, action: string, ctx: Scope, previous: any, next: any, executor: ProductRegistryExecutor) {
    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: ctx.organizationId,
      actor_user_id: ctx.actorId,
      target_object_type: targetType,
      target_object_id: targetId,
      action_type: action,
      previous_state_json: previous,
      new_state_json: next,
      reason_text: null,
      correlation_id: ctx.correlationId,
      source_channel: "commercial-product-registry-production-onboarding",
    }, executor);
  }
}

export function hasProductionOnboardingCapabilityContract() {
  return (GOVERNANCE_CAPABILITIES as readonly string[]).includes(PRODUCTION_ONBOARD_CAPABILITY);
}
