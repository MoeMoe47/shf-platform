import { randomUUID } from "node:crypto";
import { withTransaction } from "../../../db/transaction.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { SOURCE_AUTHORITY_TYPES } from "../model/commercial-product-registry-contract.js";
import { PostgresCommercialProductReviewRepo } from "./postgres-commercial-product-review-repo.js";
import { reassessReviewPacket, REVIEW_GATE_POLICY, resolveCandidateIdentity, validateDecisionInput, validateSourceResolutionInput } from "./review-contract.js";

export class CommercialProductReviewError extends Error {
  constructor(public readonly code: string, message = code, public readonly statusCode = 400) {
    super(message);
    this.name = "CommercialProductReviewError";
  }
}

function actorContext(actor: any) {
  const actorId = String(actor?.user_id || actor?.id || "").trim();
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  if (!actorId || !organizationId) throw new CommercialProductReviewError("REVIEW_ACTOR_CONTEXT_REQUIRED", "Authenticated human actor and organization are required.", 403);
  return { actorId, organizationId };
}

function requireCapability(actor: any, capability: string) {
  if (actor?.actor_system_id || !actor?.user_id && !actor?.id) throw new CommercialProductReviewError("REVIEW_HUMAN_ACTOR_REQUIRED", "System actors cannot record human review decisions.", 403);
  const permissions = actor?.capabilities || actor?.permissions || [];
  if (!Array.isArray(permissions) || !permissions.includes(capability)) throw new CommercialProductReviewError("REVIEW_CAPABILITY_REQUIRED", `${capability} is required.`, 403);
}

function safeSourceReference(value: string) {
  return !/(^|[/\\])(pages|components|data)([/\\])|demo|fixture|mock|keyword.scan|marketing/i.test(value);
}

function rejectUnexpected(input: any, allowed: readonly string[]) {
  const unexpected = Object.keys(input || {}).filter((key) => !allowed.includes(key));
  if (unexpected.length) throw new CommercialProductReviewError("REVIEW_INPUT_FIELD_FORBIDDEN", `Unsupported review fields: ${unexpected.join(", ")}`);
}

function assertExpectedVersion(expectedVersion: unknown, latest: any, stream: string) {
  if (expectedVersion === undefined) return;
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion !== (latest?.version || 0)) {
    throw new CommercialProductReviewError(`${stream}_SUPERSESSION_CONFLICT`, "The review stream changed; reload its latest version.", 409);
  }
}

function rejectFundingEligibilitySemantics(input: any) {
  if (input.gateType !== "FUNDING") return;
  const text = [input.decisionReason, input.authorityReference, ...(input.evidenceReferences || [])].filter(Boolean).join(" ");
  if (/customer\s+(is\s+)?eligible|eligible\s+customer|grant\s+(award|approved|approval|guaranteed)|award\s+guaranteed|reimbursement\s+guaranteed|funding\s+guaranteed/i.test(text)) {
    throw new CommercialProductReviewError("FUNDING_ELIGIBILITY_NOT_REGISTRY_AUTHORITY", "Funding review records product compatibility only; customer eligibility and awards are outside Product Registry authority.");
  }
}

export class CommercialProductReviewService {
  constructor(
    private readonly identities: ReadonlyMap<string, string>,
    private readonly packets: ReadonlyMap<string, any>,
    private readonly repo = new PostgresCommercialProductReviewRepo(),
    private readonly auditWriter = writeAuditEvent,
    private readonly transaction = withTransaction,
    private readonly clock = () => new Date(),
  ) {}

  private identity(candidateId: string, productId?: string) {
    const canonicalProductId = this.identities.get(candidateId);
    if (!canonicalProductId || productId && productId !== canonicalProductId) throw new CommercialProductReviewError("REVIEW_CANDIDATE_IDENTITY_MISMATCH");
    try { return resolveCandidateIdentity(candidateId, canonicalProductId, this.identities); }
    catch (error: any) { throw new CommercialProductReviewError(error.message); }
  }

  private packet(candidateId: string, productId?: string) {
    const identity = this.identity(candidateId, productId);
    const packet = this.packets.get(candidateId);
    if (!packet || packet.commercial_product_id !== identity.commercialProductId) throw new CommercialProductReviewError("REVIEW_PACKET_NOT_FOUND", "Review packet is unavailable.", 404);
    return packet;
  }

  async recordDecision(input: any, actor: any) {
    rejectUnexpected(input, ["candidateId", "commercialProductId", "gateType", "decisionStatus", "decisionReason", "authorityType", "authorityReference", "evidenceReferences", "reviewedAt", "effectiveAt", "expiresAt", "staleAt", "supersedesDecisionId", "reviewDecisionId", "expectedVersion"]);
    const identity = this.identity(input?.candidateId, input?.commercialProductId);
    const packet = this.packet(input?.candidateId, identity.commercialProductId);
    actorContext(actor);
    const policy = REVIEW_GATE_POLICY[input?.gateType as keyof typeof REVIEW_GATE_POLICY];
    if (!policy) throw new CommercialProductReviewError("REVIEW_GATE_TYPE_INVALID");
    requireCapability(actor, policy.capability);
    let decision: any;
    try { decision = validateDecisionInput(input, policy.authorityTypes); }
    catch (error: any) { throw new CommercialProductReviewError(error.message); }
    if (decision.decisionStatus === "NOT_REQUIRED" && !decision.decisionReason) throw new CommercialProductReviewError("REVIEW_DECISION_REASON_REQUIRED");
    rejectFundingEligibilitySemantics({ ...input, evidenceReferences: decision.evidenceReferences });
    if (decision.decisionStatus === "APPROVED" && (!actor.user_id || actor.actor_system_id)) throw new CommercialProductReviewError("REVIEW_HUMAN_ACTOR_REQUIRED", "Only an attributable human reviewer may record approval.", 403);
    if (["APPROVED", "NOT_REQUIRED"].includes(decision.decisionStatus) && [decision.authorityReference, ...decision.evidenceReferences].some((reference) => !safeSourceReference(reference))) {
      throw new CommercialProductReviewError("REVIEW_EVIDENCE_REFERENCE_NOT_AUTHORITATIVE", "Demo, fixture, UI, marketing, or mock references cannot support a review decision.");
    }
    const context = actorContext(actor);
    return this.transaction(async (executor: any) => {
      await this.repo.lockStream(input.candidateId, input.gateType, executor);
      const latest = await this.repo.getLatestDecision(input.candidateId, input.gateType, executor, true);
      assertExpectedVersion(input.expectedVersion, latest, "REVIEW");
      if (latest && input.supersedesDecisionId !== latest.review_decision_id) throw new CommercialProductReviewError("REVIEW_SUPERSESSION_REQUIRED", "A new decision must explicitly supersede the latest decision.", 409);
      if (!latest && input.supersedesDecisionId) throw new CommercialProductReviewError("REVIEW_SUPERSESSION_NOT_FOUND", "There is no prior decision to supersede.", 409);
      const now = this.clock();
      const row = await this.repo.insertDecision({
        review_decision_id: input.reviewDecisionId || `cprd_${randomUUID()}`,
        candidate_id: input.candidateId,
        commercial_product_id: identity.commercialProductId,
        gate_type: input.gateType,
        decision_status: decision.decisionStatus,
        decision_reason: decision.decisionReason,
        authority_type: decision.authorityType,
        authority_reference: decision.authorityReference,
        evidence_references: decision.evidenceReferences,
        reviewer_actor_id: context.actorId,
        reviewer_org_id: context.organizationId,
        effective_at: input.effectiveAt || null,
        reviewed_at: decision.reviewedAt,
        expires_at: input.expiresAt || null,
        stale_at: input.staleAt || null,
        supersedes_decision_id: latest?.review_decision_id || null,
        version: (latest?.version || 0) + 1,
      }, executor);
      if (latest) await this.audit("commercial_product_review_decision", latest.review_decision_id, "commercial_product_registry.review_decision_superseded", context, latest, row, executor);
      await this.audit("commercial_product_review_decision", row.review_decision_id, "commercial_product_registry.review_decision_recorded", context, null, row, executor);
      return row;
    });
  }

  async recordSourceResolution(input: any, actor: any) {
    rejectUnexpected(input, ["candidateId", "commercialProductId", "resolutionStatus", "authorityDomain", "authorityReference", "authorityVersion", "evidenceReference", "resolvedAt", "resolutionReason", "remainingRequirements", "supersedesResolutionId", "sourceResolutionId", "expectedVersion"]);
    const identity = this.identity(input?.candidateId, input?.commercialProductId);
    this.packet(input?.candidateId, identity.commercialProductId);
    actorContext(actor);
    requireCapability(actor, "commercial_product.review_source_authority");
    let resolution: any;
    try { resolution = validateSourceResolutionInput(input); }
    catch (error: any) { throw new CommercialProductReviewError(error.message); }
    if (resolution.resolutionStatus === "RESOLVED") {
      if (!(SOURCE_AUTHORITY_TYPES as readonly string[]).includes(resolution.authorityDomain)) throw new CommercialProductReviewError("SOURCE_RESOLUTION_DOMAIN_INVALID");
      if (!safeSourceReference(resolution.authorityReference) || !safeSourceReference(resolution.evidenceReference)) throw new CommercialProductReviewError("SOURCE_RESOLUTION_REFERENCE_NOT_AUTHORITATIVE");
    }
    const context = actorContext(actor);
    return this.transaction(async (executor: any) => {
      await this.repo.lockStream(input.candidateId, "SOURCE", executor);
      const latest = await this.repo.getLatestSourceResolution(input.candidateId, executor, true);
      assertExpectedVersion(input.expectedVersion, latest, "SOURCE_RESOLUTION");
      if (latest && input.supersedesResolutionId !== latest.source_resolution_id) throw new CommercialProductReviewError("SOURCE_RESOLUTION_SUPERSESSION_REQUIRED", "A new resolution must explicitly supersede the latest source resolution.", 409);
      if (!latest && input.supersedesResolutionId) throw new CommercialProductReviewError("SOURCE_RESOLUTION_SUPERSESSION_NOT_FOUND", "There is no prior source resolution to supersede.", 409);
      const row = await this.repo.insertSourceResolution({
        source_resolution_id: input.sourceResolutionId || `cprs_${randomUUID()}`,
        candidate_id: input.candidateId,
        commercial_product_id: identity.commercialProductId,
        resolution_status: resolution.resolutionStatus,
        authority_domain: resolution.authorityDomain,
        authority_reference: resolution.authorityReference,
        authority_version: input.authorityVersion || null,
        evidence_reference: resolution.evidenceReference,
        resolved_by_actor: context.actorId,
        resolved_by_org: context.organizationId,
        resolved_at: resolution.resolvedAt,
        resolution_reason: resolution.resolutionReason,
        remaining_requirements: resolution.remainingRequirements,
        supersedes_resolution_id: latest?.source_resolution_id || null,
        version: (latest?.version || 0) + 1,
      }, executor);
      if (latest) await this.audit("commercial_product_source_resolution", latest.source_resolution_id, "commercial_product_registry.source_resolution_superseded", context, latest, row, executor);
      await this.audit("commercial_product_source_resolution", row.source_resolution_id, "commercial_product_registry.source_resolution_recorded", context, null, row, executor);
      return row;
    });
  }

  async listDecisionHistory(candidateId: string, actor: any, gateType?: string) {
    actorContext(actor);
    requireCapability(actor, "commercial_product.read");
    if (!this.identities.has(candidateId)) throw new CommercialProductReviewError("REVIEW_PACKET_NOT_FOUND", "Review packet is unavailable.", 404);
    return this.repo.listDecisionHistory(candidateId, gateType);
  }

  async listDecisionHistoryPage(candidateId: string, actor: any, options: { gateType?: string; limit: number; offset: number }) {
    actorContext(actor);
    requireCapability(actor, "commercial_product.read");
    if (!this.identities.has(candidateId)) throw new CommercialProductReviewError("REVIEW_PACKET_NOT_FOUND", "Review packet is unavailable.", 404);
    return this.repo.listDecisionHistoryPage(candidateId, options);
  }

  async listSourceResolutionHistory(candidateId: string, actor: any) {
    actorContext(actor);
    requireCapability(actor, "commercial_product.read");
    if (!this.identities.has(candidateId)) throw new CommercialProductReviewError("REVIEW_PACKET_NOT_FOUND", "Review packet is unavailable.", 404);
    return this.repo.listSourceResolutionHistory(candidateId);
  }

  async listSourceResolutionHistoryPage(candidateId: string, actor: any, options: { limit: number; offset: number }) {
    actorContext(actor);
    requireCapability(actor, "commercial_product.read");
    if (!this.identities.has(candidateId)) throw new CommercialProductReviewError("REVIEW_PACKET_NOT_FOUND", "Review packet is unavailable.", 404);
    return this.repo.listSourceResolutionHistoryPage(candidateId, options);
  }

  async getPacket(candidateId: string, actor: any) {
    actorContext(actor);
    requireCapability(actor, "commercial_product.read");
    const productId = this.identities.get(candidateId);
    if (!productId) throw new CommercialProductReviewError("REVIEW_PACKET_NOT_FOUND", "Review packet is unavailable.", 404);
    const packet = this.packet(candidateId, productId);
    const decisions = await this.repo.listDecisionHistory(candidateId);
    const sourceResolutions = await this.repo.listSourceResolutionHistory(candidateId);
    const latestDecisions = new Map<string, any>();
    for (const row of decisions) if (!latestDecisions.has(row.gate_type) || Number(latestDecisions.get(row.gate_type).version) < Number(row.version)) latestDecisions.set(row.gate_type, row);
    const latestSource = sourceResolutions.reduce((latest: any, row: any) => !latest || Number(row.version) > Number(latest.version) ? row : latest, null);
    return {
      packet,
      latest_decisions: [...latestDecisions.values()],
      latest_source_resolution: latestSource,
      reassessment: reassessReviewPacket(packet, [...latestDecisions.values()], latestSource, this.clock().toISOString()),
    };
  }

  async listQueue(actor: any) {
    actorContext(actor);
    requireCapability(actor, "commercial_product.read");
    const entries = [];
    for (const candidateId of this.identities.keys()) {
      const productId = this.identities.get(candidateId)!;
      const packet = this.packet(candidateId, productId);
      const decisions = await this.repo.listDecisionHistory(candidateId);
      const latestDecisions = new Map<string, any>();
      for (const row of decisions) if (!latestDecisions.has(row.gate_type) || Number(latestDecisions.get(row.gate_type).version) < Number(row.version)) latestDecisions.set(row.gate_type, row);
      const sources = await this.repo.listSourceResolutionHistory(candidateId);
      const latestSource = sources.reduce((latest: any, row: any) => !latest || Number(row.version) > Number(latest.version) ? row : latest, null);
      entries.push({ candidate_id: candidateId, commercial_product_id: productId, candidate_name: packet.candidate_name, family: packet.family, source_status: latestSource?.resolution_status || packet.source_resolution_status, ...reassessReviewPacket(packet, [...latestDecisions.values()], latestSource, this.clock().toISOString()) });
    }
    return entries;
  }

  async reassess(candidateId: string, actor: any) {
    actorContext(actor);
    requireCapability(actor, "commercial_product.read");
    const productId = this.identities.get(candidateId);
    if (!productId) throw new CommercialProductReviewError("REVIEW_PACKET_NOT_FOUND", "Review packet is unavailable.", 404);
    const packet = this.packet(candidateId, productId);
    const decisions = await this.repo.listDecisionHistory(candidateId);
    const latestByGate = new Map<string, any>();
    for (const row of decisions) if (!latestByGate.has(row.gate_type) || Number(latestByGate.get(row.gate_type).version) < Number(row.version)) latestByGate.set(row.gate_type, row);
    const sourceHistory = await this.repo.listSourceResolutionHistory(candidateId);
    const latestSource = sourceHistory.reduce((latest: any, row: any) => !latest || Number(row.version) > Number(latest.version) ? row : latest, null);
    return reassessReviewPacket(packet, [...latestByGate.values()], latestSource, this.clock().toISOString());
  }

  private async audit(targetType: string, targetId: string, action: string, context: { actorId: string; organizationId: string }, previous: any, next: any, executor: any) {
    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: context.organizationId,
      actor_user_id: context.actorId,
      target_object_type: targetType,
      target_object_id: targetId,
      action_type: action,
      previous_state_json: previous,
      new_state_json: next,
      reason_text: next?.decision_reason || next?.resolution_reason || null,
      correlation_id: `cpr_review_${randomUUID()}`,
      source_channel: "commercial-product-registry-human-review",
    }, executor);
  }
}
