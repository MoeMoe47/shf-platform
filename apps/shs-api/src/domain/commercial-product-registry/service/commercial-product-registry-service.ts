import { randomUUID } from "node:crypto";
import { withTransaction } from "../../../db/transaction.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import {
  BUYER_TYPES,
  COMMERCIAL_FAMILIES,
  COMMERCIAL_FORMS,
  COMMERCIAL_PRODUCT_REGISTRY_AUTHORITY,
  COMMERCIAL_VIABILITY_STATUSES,
  COMMISSION_ELIGIBILITY_STATUSES,
  FUNDING_CATEGORIES,
  FUNDING_RELATIONSHIP_STATUSES,
  GOVERNED_DECISION_STATUSES,
  GOVERNANCE_CAPABILITIES,
  IMPLEMENTATION_TIERS,
  MARGIN_STATUSES,
  PRODUCT_IDENTITY_STATUSES,
  PRICING_STATUSES,
  PRODUCT_TYPES,
  PRODUCT_LIFECYCLE_TRANSITIONS,
  PRODUCT_RELATIONSHIP_TYPES,
  READINESS_STATES,
  REGULATED_PROGRAM_TYPES,
  RELATIONSHIP_DIRECTIONS,
  RELATIONSHIP_STATUSES,
  RENEWAL_MODELS,
  REVENUE_CLASSIFICATIONS,
  REVIEW_GATE_TYPES,
  REVIEW_GATE_STATUSES,
  SALES_CONSUMER_AUTHORITY,
  SALES_LANGUAGE_STATUSES,
  SELLABILITY_STATUSES,
  SOURCE_AUTHORITY_STATUSES,
  SOURCE_AUTHORITY_TYPES,
  SUPPORT_TIERS,
  assertNoCommissionCalculation,
  assertNoFundingEligibilityField,
  canTransitionProductLifecycle,
  isCommercialFamily,
  isProductLifecycleState,
  validateProductIdentityContract,
  validateSourceAuthorityReference,
  type BuyerType,
  type CommercialForm,
  type CommercialProductGovernanceCapability,
  type FundingCategory,
  type FundingRelationshipStatus,
  type GovernedDecisionStatus,
  type MockStatusContract,
  type ProductLifecycleState,
  type ProductRelationshipType,
  type ReadinessState,
  type RelationshipDirection,
  type RelationshipStatus,
  type ReviewGateStatus,
  type ReviewGateType,
  type SellabilityStatus,
  type SourceAuthorityReference,
} from "../model/commercial-product-registry-contract.js";
import { PostgresCommercialProductRegistryRepo } from "../repo/postgres-commercial-product-registry-repo.js";
import type {
  CommercialProductRegistryRepository,
  GovernanceStateRecord,
  ProductRegistryExecutor,
} from "../repo/commercial-product-registry-repository.js";

type Actor = {
  user_id?: string;
  id?: string;
  actor_user_id?: string;
  active_organization_id?: string;
  organization_id?: string;
  actor_system_id?: string;
  capabilities?: readonly string[];
};

type ServiceScope = {
  actor_id: string | null;
  actor_system_id: string | null;
  organization_id: string;
  correlation_id: string;
  source_channel: string;
};

const SERVER_DERIVED_FIELDS = [
  "created_at", "createdAt", "updated_at", "updatedAt", "archived_at", "archivedAt",
  "created_by", "createdBy", "updated_by", "updatedBy", "version", "audit",
  "audit_event_id", "auditEventId", "reviewed_at", "reviewedAt", "approved_by",
  "approvedBy", "verified", "verified_at", "verifiedAt", "system_provenance",
  "systemProvenance", "source_payload", "sourcePayload", "tenant_id", "tenantId",
];

const GOVERNED_UPDATE_FIELDS = [
  "lifecycle_state", "lifecycleState", "readiness", "sellability", "sellabilityStatus",
  "reviewGates", "review_gates", "pricing_status", "pricingStatus", "margin_status",
  "marginStatus", "commission_eligible_status", "commissionEligibleStatus",
  "legalApproval", "regulatoryApproval", "pricingApproval", "marginApproval",
  "commissionApproval",
];

export const COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT: Record<string, CommercialProductGovernanceCapability> = {
  createProduct: "commercial_product.create",
  updateDescriptiveMetadata: "commercial_product.edit",
  reviewReadiness: "commercial_product.review_readiness",
  reviewSellability: "commercial_product.review_sellability",
  manageReviewGate: "commercial_product.edit",
  manageSourceAuthority: "commercial_product.edit",
  manageBuyerCompatibility: "commercial_product.edit",
  manageCommercialForm: "commercial_product.edit",
  manageFundingRelationship: "commercial_product.edit",
  manageEntitlementReference: "commercial_product.edit",
  manageProductRelationship: "commercial_product.edit",
  updateRegulatedProgramMetadata: "commercial_product.review_regulatory",
  updateImplementationSupportMetadata: "commercial_product.edit",
  updateRenewalExpansionMetadata: "commercial_product.edit",
  updateSocialSellingMetadata: "commercial_product.review_sponsorship",
  updateGovernanceState: "commercial_product.review_pricing",
  transitionLifecycle: "commercial_product.transition_lifecycle",
  retireProduct: "commercial_product.retire",
  readSalesProductModel: "commercial_product.read",
};

export class CommercialProductRegistryServiceError extends Error {
  constructor(public readonly code: string, message = code, public readonly statusCode = 400) {
    super(message === code ? code : `${code}: ${message}`);
    this.name = "CommercialProductRegistryServiceError";
  }
}

function text(value: unknown, label: string, required = false, max = 2000) {
  const raw = String(value ?? "").trim();
  if (!raw && required) throw new CommercialProductRegistryServiceError("COMMERCIAL_PRODUCT_INVALID_REQUEST", `${label} is required.`);
  return raw ? raw.slice(0, max) : null;
}

function enumValue<T extends readonly string[]>(value: unknown, allowed: T, label: string, required = true): T[number] | undefined {
  const raw = String(value ?? "").trim().toUpperCase();
  if (!raw && !required) return undefined;
  if (!allowed.includes(raw)) throw new CommercialProductRegistryServiceError("COMMERCIAL_PRODUCT_ENUM_INVALID", `${label} is not supported.`);
  return raw as T[number];
}

function stringArray(value: unknown, label: string) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new CommercialProductRegistryServiceError("COMMERCIAL_PRODUCT_ARRAY_INVALID", `${label} must be a non-empty string array.`);
  }
  return value.map((item) => item.trim());
}

function rejectKeys(input: any, keys: readonly string[], code: string) {
  for (const key of Object.keys(input || {})) {
    if (keys.includes(key)) throw new CommercialProductRegistryServiceError(code, `${key} is not client-assignable through this operation.`);
  }
}

function scopeFromActor(actor: Actor, input?: any): ServiceScope {
  const actorId = String(actor?.user_id || actor?.id || actor?.actor_user_id || "").trim() || null;
  const actorSystemId = String(actor?.actor_system_id || "").trim() || null;
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || input?.organization_id || input?.organizationId || "").trim();
  if (!organizationId) throw new CommercialProductRegistryServiceError("AUDIT_ORGANIZATION_REQUIRED", "Canonical audit requires organization context.");
  if (!actorId && !actorSystemId) throw new CommercialProductRegistryServiceError("ACTOR_REQUIRED", "Actor provenance is required.");
  return {
    actor_id: actorId,
    actor_system_id: actorSystemId,
    organization_id: organizationId,
    correlation_id: String(input?.correlation_id || input?.correlationId || `corr_${randomUUID()}`),
    source_channel: String(input?.source_channel || input?.sourceChannel || "commercial-product-registry-service"),
  };
}

function requireCapability(actor: Actor, capability: CommercialProductGovernanceCapability) {
  if (!GOVERNANCE_CAPABILITIES.includes(capability)) throw new CommercialProductRegistryServiceError("COMMERCIAL_PRODUCT_CAPABILITY_UNKNOWN");
  if (actor?.capabilities && !actor.capabilities.includes(capability)) {
    throw new CommercialProductRegistryServiceError("COMMERCIAL_PRODUCT_CAPABILITY_REQUIRED", `${capability} is required.`, 403);
  }
}

function sourceAuthority(input: any): SourceAuthorityReference {
  const value = {
    sourceAuthorityType: enumValue(input?.sourceAuthorityType ?? input?.source_authority_type, SOURCE_AUTHORITY_TYPES, "sourceAuthorityType"),
    sourceAuthorityId: text(input?.sourceAuthorityId ?? input?.source_authority_id, "sourceAuthorityId", false, 160) || undefined,
    sourceDomain: text(input?.sourceDomain ?? input?.source_domain, "sourceDomain", false, 160) || undefined,
    sourceRecordId: text(input?.sourceRecordId ?? input?.source_record_id, "sourceRecordId", true, 260)!,
    sourceVersion: text(input?.sourceVersion ?? input?.source_version, "sourceVersion", false, 80) || undefined,
    sourceStatus: enumValue(input?.sourceStatus ?? input?.source_status, SOURCE_AUTHORITY_STATUSES, "sourceStatus"),
    sourceLastVerifiedAt: text(input?.sourceLastVerifiedAt ?? input?.source_last_verified_at, "sourceLastVerifiedAt", false, 80) || undefined,
    sourceProvenance: stringArray(input?.sourceProvenance ?? input?.source_provenance, "sourceProvenance"),
  };
  return validateSourceAuthorityReference(value);
}

function containsForbiddenMoneyFields(value: unknown) {
  const textValue = JSON.stringify(value || {});
  if (/(priceAmount|unitPrice|computedPrice|discountAmount|marginAmount|commissionAmount|commissionRate|calculatedCommission|leadershipOverrideAmount)/i.test(textValue)) {
    throw new CommercialProductRegistryServiceError("COMMERCIAL_PRODUCT_FINANCIAL_CALCULATION_NOT_ALLOWED");
  }
}

function auditShape(row: any) {
  if (!row) return null;
  return JSON.parse(JSON.stringify(row));
}

function statusForRows(rows: readonly any[]): MockStatusContract {
  return { status: rows.length ? "CONNECTED" : "CONNECTED_EMPTY" };
}

function parseJsonArray(value: any) {
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

export class CommercialProductRegistryService {
  constructor(
    private repo: CommercialProductRegistryRepository = new PostgresCommercialProductRegistryRepo(),
    private auditWriter = writeAuditEvent,
    private transaction = withTransaction,
  ) {}

  async createProduct(input: any, actor: Actor) {
    rejectKeys(input, SERVER_DERIVED_FIELDS, "SERVER_DERIVED_FIELD_FORBIDDEN");
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.createProduct);
    containsForbiddenMoneyFields(input);
    const identity = validateProductIdentityContract({
      commercialProductId: text(input?.commercialProductId ?? input?.commercial_product_id, "commercialProductId", true, 160),
      canonicalName: text(input?.canonicalName ?? input?.canonical_name, "canonicalName", true, 240),
      displayName: text(input?.displayName ?? input?.display_name, "displayName", true, 240),
      slug: text(input?.slug, "slug", true, 180),
      commercialFamily: enumValue(input?.commercialFamily ?? input?.commercial_family, COMMERCIAL_FAMILIES, "commercialFamily"),
      subfamily: text(input?.subfamily, "subfamily", false, 180) || undefined,
      productType: enumValue(input?.productType ?? input?.product_type, PRODUCT_TYPES, "productType"),
      description: text(input?.description, "description", false, 4000) || undefined,
      shortDescription: text(input?.shortDescription ?? input?.short_description, "shortDescription", false, 600) || undefined,
      version: 1,
      status: enumValue(input?.status, PRODUCT_IDENTITY_STATUSES, "status", false) || "ACTIVE",
    });
    if (!isCommercialFamily(identity.commercialFamily)) throw new CommercialProductRegistryServiceError("COMMERCIAL_PRODUCT_FAMILY_INVALID");
    const lifecycle = enumValue(input?.lifecycleState ?? input?.lifecycle_state, Object.keys(PRODUCT_LIFECYCLE_TRANSITIONS) as ProductLifecycleState[], "lifecycleState", false) || "DISCOVERED";
    const readiness = enumValue(input?.readiness, READINESS_STATES, "readiness", false) || "UNKNOWN";
    const sellability = enumValue(input?.sellability ?? input?.sellabilityStatus, SELLABILITY_STATUSES, "sellability", false) || "NEEDS_REVIEW";
    const sellingEntity = enumValue(input?.sellingEntity ?? input?.selling_entity, ["SHF", "SHS", "PARTNER", "JOINT_STRUCTURE_REVIEW_REQUIRED", "UNKNOWN"] as const, "sellingEntity", false) || "UNKNOWN";
    const deliveryEntity = enumValue(input?.deliveryEntity ?? input?.delivery_entity, ["SHF", "SHS", "PARTNER", "JOINT_STRUCTURE_REVIEW_REQUIRED", "UNKNOWN"] as const, "deliveryEntity", false) || "UNKNOWN";
    const sources = (input?.sourceAuthorities ?? input?.source_authorities ?? []).map(sourceAuthority);
    const buyers = stringArray(input?.buyerCompatibility ?? input?.buyer_compatibility, "buyerCompatibility");
    for (const buyer of buyers) enumValue(buyer, BUYER_TYPES, "buyerCompatibility");
    const forms = stringArray(input?.commercialForms ?? input?.commercial_forms, "commercialForms");
    for (const form of forms) enumValue(form, COMMERCIAL_FORMS, "commercialForms");

    return this.transaction(async (executor: ProductRegistryExecutor) => {
      const created = await this.repo.createProduct({
        commercial_product_id: identity.commercialProductId,
        canonical_name: identity.canonicalName,
        display_name: identity.displayName,
        slug: identity.slug,
        commercial_family: identity.commercialFamily,
        subfamily: identity.subfamily || null,
        product_type: identity.productType,
        description: identity.description || null,
        short_description: identity.shortDescription || null,
        version: 1,
        status: identity.status,
        lifecycle_state: lifecycle,
        readiness,
        readiness_reason: text(input?.readinessReason ?? input?.readiness_reason, "readinessReason", false, 1000),
        sellability,
        sellability_reason: text(input?.sellabilityReason ?? input?.sellability_reason, "sellabilityReason", false, 1000),
        selling_entity: sellingEntity,
        delivery_entity: deliveryEntity,
        partner_required: input?.partnerRequired === true || input?.partner_required === true,
        partner_type: text(input?.partnerType ?? input?.partner_type, "partnerType", false, 160),
        joint_structure_required: input?.jointStructureRequired === true || input?.joint_structure_required === true,
        pricing_status: "NOT_DEFINED",
        margin_status: "NOT_DEFINED",
        commission_eligible_status: "UNKNOWN",
        renewal_model: "UNKNOWN",
        created_by: scope.actor_id,
      }, executor);
      for (const source of sources) await this.repo.addSourceAuthority(this.sourceRecord(identity.commercialProductId, source), executor);
      for (const buyer of buyers) await this.repo.addBuyerCompatibility({ commercial_product_buyer_id: `cpr_buyer_${randomUUID()}`, commercial_product_id: identity.commercialProductId, buyer_type: buyer as BuyerType, status: "UNKNOWN", limitations: [] }, executor);
      for (const form of forms) await this.repo.addCommercialForm({ commercial_product_form_id: `cpr_form_${randomUUID()}`, commercial_product_id: identity.commercialProductId, commercial_form: form as CommercialForm, status: "UNKNOWN", limitations: [] }, executor);
      await this.audit("commercial_product", identity.commercialProductId, "commercial_product_registry.product_created", scope, null, created, executor);
      return created;
    });
  }

  async updateDescriptiveMetadata(commercialProductId: string, input: any, actor: Actor) {
    rejectKeys(input, SERVER_DERIVED_FIELDS, "SERVER_DERIVED_FIELD_FORBIDDEN");
    rejectKeys(input, GOVERNED_UPDATE_FIELDS, "GOVERNED_STATE_CHANGE_REQUIRED");
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.updateDescriptiveMetadata);
    const update = {
      canonical_name: text(input?.canonicalName ?? input?.canonical_name, "canonicalName", false, 240) || undefined,
      display_name: text(input?.displayName ?? input?.display_name, "displayName", false, 240) || undefined,
      slug: text(input?.slug, "slug", false, 180) || undefined,
      subfamily: text(input?.subfamily, "subfamily", false, 180) || undefined,
      description: text(input?.description, "description", false, 4000) || undefined,
      short_description: text(input?.shortDescription ?? input?.short_description, "shortDescription", false, 600) || undefined,
      updated_by: scope.actor_id || undefined,
    };
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.descriptive_updated", scope, async (executor) => this.repo.updateDescriptiveMetadata(commercialProductId, update, executor));
  }

  async transitionLifecycle(commercialProductId: string, toState: ProductLifecycleState, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    if (!isProductLifecycleState(toState)) throw new CommercialProductRegistryServiceError("COMMERCIAL_PRODUCT_LIFECYCLE_INVALID");
    requireCapability(actor, toState === "RETIRED" ? COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.retireProduct : COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.transitionLifecycle);
    const reason = text(input?.reason, "reason", true, 1000);
    return this.transaction(async (executor: ProductRegistryExecutor) => {
      const previous = await this.requireProduct(commercialProductId, executor);
      if (!canTransitionProductLifecycle(previous.lifecycle_state, toState)) {
        throw new CommercialProductRegistryServiceError("COMMERCIAL_PRODUCT_LIFECYCLE_TRANSITION_REJECTED");
      }
      const updated = await this.repo.updateLifecycle(commercialProductId, toState, scope.actor_id, executor);
      await this.audit("commercial_product", commercialProductId, "commercial_product_registry.lifecycle_transitioned", scope, previous, updated, executor, reason);
      return updated;
    });
  }

  async reviewReadiness(commercialProductId: string, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.reviewReadiness);
    const readiness = enumValue(input?.readiness, READINESS_STATES, "readiness") as ReadinessState;
    const authority = text(input?.evaluatedByAuthority ?? input?.authority, "evaluatedByAuthority", true, 200)!;
    const reason = text(input?.reason, "reason", readiness !== "UNKNOWN", 1000) || "Unknown readiness pending governed evaluation.";
    const evidenceReferences = (input?.evidenceReferences ?? input?.evidence_references ?? []).map(sourceAuthority);
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.readiness_reviewed", scope, async (executor) => this.repo.updateReadiness(commercialProductId, readiness, reason, authority, evidenceReferences, text(input?.staleAfter ?? input?.stale_after, "staleAfter", false, 80), executor));
  }

  async reviewSellability(commercialProductId: string, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.reviewSellability);
    const sellability = enumValue(input?.sellability ?? input?.sellabilityStatus, SELLABILITY_STATUSES, "sellability") as SellabilityStatus;
    const authority = sourceAuthority(input?.sourceAuthority ?? input?.source_authority);
    const reason = text(input?.reason, "reason", true, 1000)!;
    const blockers = stringArray(input?.blockers, "blockers");
    const restrictions = stringArray(input?.restrictions, "restrictions");
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.sellability_reviewed", scope, async (executor) => this.repo.updateSellability(commercialProductId, sellability, reason, authority.sourceAuthorityId || authority.sourceRecordId, blockers, restrictions, text(input?.effectiveFrom ?? input?.effective_from, "effectiveFrom", false, 80), text(input?.effectiveTo ?? input?.effective_to, "effectiveTo", false, 80), text(input?.staleAfter ?? input?.stale_after, "staleAfter", false, 80), text(input?.sourceAuthorityReferenceId ?? input?.source_authority_reference_id, "sourceAuthorityReferenceId", false, 160), executor));
  }

  async manageReviewGate(commercialProductId: string, input: any, actor: Actor) {
    const gateType = enumValue(input?.gateType ?? input?.gate_type, REVIEW_GATE_TYPES, "gateType") as ReviewGateType;
    const status = enumValue(input?.status, REVIEW_GATE_STATUSES, "status") as ReviewGateStatus;
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, this.capabilityForGate(gateType));
    if (status === "APPROVED" && !text(input?.authority, "authority", false) && !text(input?.reference, "reference", false)) throw new CommercialProductRegistryServiceError("REVIEW_GATE_APPROVAL_AUTHORITY_REQUIRED");
    if (status === "BLOCKED") text(input?.reason, "reason", true);
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.review_gate_changed", scope, async (executor) => this.repo.addReviewGate({
      commercial_product_gate_id: input?.commercial_product_gate_id || `cpr_gate_${randomUUID()}`,
      commercial_product_id: commercialProductId,
      gate_type: gateType,
      status,
      authority: text(input?.authority, "authority", false, 200),
      reference: text(input?.reference, "reference", false, 300),
      reason: text(input?.reason, "reason", false, 1000),
      reviewed_at: text(input?.reviewedAt ?? input?.reviewed_at, "reviewedAt", false, 80) || new Date().toISOString(),
      expires_at: text(input?.expiresAt ?? input?.expires_at, "expiresAt", false, 80),
      stale_after: text(input?.staleAfter ?? input?.stale_after, "staleAfter", false, 80),
    }, executor));
  }

  async addSourceAuthority(commercialProductId: string, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageSourceAuthority);
    const source = sourceAuthority(input);
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.source_authority_changed", scope, async (executor) => this.repo.addSourceAuthority(this.sourceRecord(commercialProductId, source), executor));
  }

  async updateSourceAuthority(commercialProductId: string, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageSourceAuthority);
    const source = sourceAuthority(input);
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.source_authority_changed", scope, async (executor) => this.repo.replaceSourceAuthority(this.sourceRecord(commercialProductId, source), executor));
  }

  async deactivateSourceAuthority(commercialProductId: string, sourceReferenceId: string, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageSourceAuthority);
    const status = enumValue(input?.status, SOURCE_AUTHORITY_STATUSES, "status", false) || "STALE";
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.source_authority_changed", scope, async (executor) => this.repo.deactivateSourceAuthority(sourceReferenceId, status, executor));
  }

  listSourceAuthorities(commercialProductId: string, executor?: ProductRegistryExecutor) {
    return this.repo.listSourceAuthorities(commercialProductId, executor);
  }

  getProductById(commercialProductId: string, actor?: Actor) {
    if (actor) requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.readSalesProductModel);
    return this.repo.getProductById(commercialProductId);
  }

  getProductBySlug(slug: string, actor?: Actor) {
    if (actor) requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.readSalesProductModel);
    return this.repo.getProductBySlug(slug);
  }

  listProducts(actor?: Actor) {
    if (actor) requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.readSalesProductModel);
    return this.repo.listProducts();
  }

  listBuyers(commercialProductId: string) {
    return this.repo.listBuyers(commercialProductId);
  }

  listCommercialForms(commercialProductId: string) {
    return this.repo.listCommercialForms(commercialProductId);
  }

  listReviewGates(commercialProductId: string) {
    return this.repo.listGates(commercialProductId);
  }

  listFundingRelationships(commercialProductId: string) {
    return this.repo.listFundingRelationships(commercialProductId);
  }

  listEntitlements(commercialProductId: string) {
    return this.repo.listEntitlements(commercialProductId);
  }

  getRegulatedProgramMetadata(commercialProductId: string) {
    return this.repo.getRegulatedProgramMetadata(commercialProductId);
  }

  getImplementationSupport(commercialProductId: string) {
    return this.repo.getImplementationSupport(commercialProductId);
  }

  getRenewalExpansion(commercialProductId: string) {
    return this.repo.getRenewalExpansion(commercialProductId);
  }

  getSocialSelling(commercialProductId: string) {
    return this.repo.getSocialSelling(commercialProductId);
  }

  getGovernanceState(commercialProductId: string) {
    return this.repo.getGovernanceState(commercialProductId);
  }

  async getProductDetail(commercialProductId: string, actor?: Actor) {
    if (actor) requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.readSalesProductModel);
    const product = await this.repo.getProductById(commercialProductId);
    if (!product) return null;
    const [
      sourceAuthorities,
      buyers,
      commercialForms,
      reviewGates,
      relationships,
      fundingRelationships,
      entitlements,
      regulatedProgram,
      implementationSupport,
      renewalExpansion,
      socialSelling,
      governanceState,
    ] = await Promise.all([
      this.repo.listSourceAuthorities(commercialProductId),
      this.repo.listBuyers(commercialProductId),
      this.repo.listCommercialForms(commercialProductId),
      this.repo.listGates(commercialProductId),
      this.repo.listRelationships(commercialProductId),
      this.repo.listFundingRelationships(commercialProductId),
      this.repo.listEntitlements(commercialProductId),
      this.repo.getRegulatedProgramMetadata(commercialProductId),
      this.repo.getImplementationSupport(commercialProductId),
      this.repo.getRenewalExpansion(commercialProductId),
      this.repo.getSocialSelling(commercialProductId),
      this.repo.getGovernanceState(commercialProductId),
    ]);
    return {
      product,
      sourceAuthorities,
      buyers,
      commercialForms,
      reviewGates,
      relationships,
      fundingRelationships,
      entitlements,
      regulatedProgram,
      implementationSupport,
      renewalExpansion,
      socialSelling,
      governanceState,
    };
  }

  async addBuyerCompatibility(commercialProductId: string, buyerType: BuyerType, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageBuyerCompatibility);
    enumValue(buyerType, BUYER_TYPES, "buyerType");
    return this.transaction(async (executor) => {
      const existing = await this.repo.listBuyers(commercialProductId, executor);
      if (existing.some((row) => row.buyer_type === buyerType)) throw new CommercialProductRegistryServiceError("BUYER_COMPATIBILITY_DUPLICATE");
      const created = await this.repo.addBuyerCompatibility({ commercial_product_buyer_id: `cpr_buyer_${randomUUID()}`, commercial_product_id: commercialProductId, buyer_type: buyerType, status: enumValue(input?.status, ["POTENTIAL", "DOCUMENTED", "VERIFIED", "BLOCKED", "UNKNOWN"] as const, "status", false) || "UNKNOWN", limitations: stringArray(input?.limitations, "limitations"), authority_source_reference_id: text(input?.authoritySourceReferenceId ?? input?.authority_source_reference_id, "authoritySourceReferenceId", false, 160) }, executor);
      await this.audit("commercial_product_buyer", created.commercial_product_buyer_id, "commercial_product_registry.buyer_form_changed", scope, null, created, executor);
      return created;
    });
  }

  async removeBuyerCompatibility(commercialProductId: string, buyerType: BuyerType, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageBuyerCompatibility);
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.buyer_form_changed", scope, (executor) => this.repo.removeBuyerCompatibility(commercialProductId, buyerType, executor));
  }

  async addCommercialForm(commercialProductId: string, commercialForm: CommercialForm, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageCommercialForm);
    enumValue(commercialForm, COMMERCIAL_FORMS, "commercialForm");
    return this.transaction(async (executor) => {
      const existing = await this.repo.listCommercialForms(commercialProductId, executor);
      if (existing.some((row) => row.commercial_form === commercialForm)) throw new CommercialProductRegistryServiceError("COMMERCIAL_FORM_DUPLICATE");
      const created = await this.repo.addCommercialForm({ commercial_product_form_id: `cpr_form_${randomUUID()}`, commercial_product_id: commercialProductId, commercial_form: commercialForm, status: enumValue(input?.status, ["POTENTIAL", "DOCUMENTED", "VERIFIED", "BLOCKED", "UNKNOWN"] as const, "status", false) || "UNKNOWN", limitations: stringArray(input?.limitations, "limitations"), authority_source_reference_id: text(input?.authoritySourceReferenceId ?? input?.authority_source_reference_id, "authoritySourceReferenceId", false, 160) }, executor);
      await this.audit("commercial_product_form", created.commercial_product_form_id, "commercial_product_registry.buyer_form_changed", scope, null, created, executor);
      return created;
    });
  }

  async removeCommercialForm(commercialProductId: string, commercialForm: CommercialForm, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageCommercialForm);
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.buyer_form_changed", scope, (executor) => this.repo.removeCommercialForm(commercialProductId, commercialForm, executor));
  }

  async manageFundingRelationship(commercialProductId: string, input: any, actor: Actor) {
    assertNoFundingEligibilityField(input);
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageFundingRelationship);
    const status = enumValue(input?.status ?? input?.fundingRelationshipStatus, FUNDING_RELATIONSHIP_STATUSES, "status") as FundingRelationshipStatus;
    const category = enumValue(input?.category ?? input?.fundingCategory, FUNDING_CATEGORIES, "category") as FundingCategory;
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.funding_relationship_changed", scope, (executor) => this.repo.addFundingRelationship({
      commercial_product_funding_id: input?.commercial_product_funding_id || `cpr_funding_${randomUUID()}`,
      commercial_product_id: commercialProductId,
      funding_relationship_status: status,
      funding_category: category,
      authority_source_reference_id: text(input?.authoritySourceReferenceId ?? input?.authority_source_reference_id, "authoritySourceReferenceId", false, 160),
      limitations: stringArray(input?.limitations, "limitations"),
      provenance: stringArray(input?.provenance, "provenance"),
    }, executor));
  }

  async addEntitlementReference(commercialProductId: string, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageEntitlementReference);
    const requirement = enumValue(input?.requirement ?? input?.entitlement_requirement, ["REQUIRED", "OPTIONAL"] as const, "requirement")!;
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.entitlement_reference_changed", scope, (executor) => this.repo.addEntitlementReference({
      commercial_product_entitlement_id: input?.commercial_product_entitlement_id || `cpr_entitlement_${randomUUID()}`,
      commercial_product_id: commercialProductId,
      entitlement_id: text(input?.entitlementId ?? input?.entitlement_id, "entitlementId", true, 200)!,
      entitlement_requirement: requirement,
      entitlement_authority: text(input?.entitlementAuthority ?? input?.entitlement_authority, "entitlementAuthority", false, 200),
      entitlement_status_reference: text(input?.entitlementStatusReference ?? input?.entitlement_status_reference, "entitlementStatusReference", false, 300),
    }, executor));
  }

  async removeEntitlementReference(commercialProductId: string, entitlementId: string, requirement: "REQUIRED" | "OPTIONAL", input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageEntitlementReference);
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.entitlement_reference_changed", scope, (executor) => this.repo.removeEntitlementReference(commercialProductId, entitlementId, requirement, executor));
  }

  async addProductRelationship(input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageProductRelationship);
    const sourceProductId = text(input?.sourceProductId ?? input?.source_product_id, "sourceProductId", true, 160)!;
    const targetProductId = text(input?.targetProductId ?? input?.target_product_id, "targetProductId", true, 160)!;
    const relationshipType = enumValue(input?.relationshipType ?? input?.relationship_type, PRODUCT_RELATIONSHIP_TYPES, "relationshipType") as ProductRelationshipType;
    const direction = enumValue(input?.direction, RELATIONSHIP_DIRECTIONS, "direction") as RelationshipDirection;
    const status = enumValue(input?.status, RELATIONSHIP_STATUSES, "status", false) as RelationshipStatus || "UNKNOWN";
    if (sourceProductId === targetProductId && relationshipType !== "STANDALONE_PRODUCT") throw new CommercialProductRegistryServiceError("PRODUCT_RELATIONSHIP_SELF_RELATION_INVALID");
    return this.transaction(async (executor) => {
      const existing = await this.repo.listRelationships(sourceProductId, executor);
      if (existing.some((row) => row.source_product_id === sourceProductId && row.target_product_id === targetProductId && row.relationship_type === relationshipType && row.direction === direction && row.status !== "RETIRED")) throw new CommercialProductRegistryServiceError("PRODUCT_RELATIONSHIP_DUPLICATE_ACTIVE");
      if (["PREREQUISITE", "REPLACES", "SUPERSEDES"].includes(relationshipType) && existing.some((row) => row.source_product_id === targetProductId && row.target_product_id === sourceProductId && row.relationship_type === relationshipType && row.status === "ACTIVE")) throw new CommercialProductRegistryServiceError("PRODUCT_RELATIONSHIP_BOUNDED_CYCLE_REJECTED");
      const created = await this.repo.addProductRelationship({ relationship_id: input?.relationshipId ?? input?.relationship_id ?? `cpr_rel_${randomUUID()}`, source_product_id: sourceProductId, target_product_id: targetProductId, relationship_type: relationshipType, direction, status, provenance: stringArray(input?.provenance, "provenance") }, executor);
      await this.audit("commercial_product_relationship", created.relationship_id, "commercial_product_registry.relationship_changed", scope, null, created, executor);
      return created;
    });
  }

  async deactivateProductRelationship(commercialProductId: string, relationshipId: string, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageProductRelationship);
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.relationship_changed", scope, (executor) => this.repo.deactivateProductRelationship(relationshipId, executor));
  }

  listRelationships(commercialProductId: string, executor?: ProductRegistryExecutor) {
    return this.repo.listRelationships(commercialProductId, executor);
  }

  async updateRegulatedProgramMetadata(commercialProductId: string, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.updateRegulatedProgramMetadata);
    const programTypes = stringArray(input?.programTypes ?? input?.program_types, "programTypes").map((value) => enumValue(value, REGULATED_PROGRAM_TYPES, "programTypes"));
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.regulated_metadata_changed", scope, (executor) => this.repo.upsertRegulatedProgramMetadata({
      commercial_product_id: commercialProductId,
      program_types: programTypes as any,
      regulatory_authority: text(input?.regulatoryAuthority ?? input?.regulatory_authority, "regulatoryAuthority", false, 240),
      external_training_authority_required: enumValue(input?.externalTrainingAuthorityRequired ?? input?.external_training_authority_required, GOVERNED_DECISION_STATUSES, "externalTrainingAuthorityRequired", false) as GovernedDecisionStatus,
      credential_authority: text(input?.credentialAuthority ?? input?.credential_authority, "credentialAuthority", false, 240),
      partner_required: input?.partnerRequired === true || input?.partner_required === true,
      scope_limitations: stringArray(input?.scopeLimitations ?? input?.scope_limitations, "scopeLimitations"),
      sales_language_restrictions: stringArray(input?.salesLanguageRestrictions ?? input?.sales_language_restrictions, "salesLanguageRestrictions"),
    }, executor));
  }

  async updateImplementationSupportMetadata(commercialProductId: string, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.updateImplementationSupportMetadata);
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.implementation_support_changed", scope, (executor) => this.repo.upsertImplementationSupport({
      commercial_product_id: commercialProductId,
      implementation_required: enumValue(input?.implementationRequired ?? input?.implementation_required, GOVERNED_DECISION_STATUSES, "implementationRequired", false) as GovernedDecisionStatus,
      implementation_tier: enumValue(input?.implementationTier ?? input?.implementation_tier, IMPLEMENTATION_TIERS, "implementationTier", false) as any,
      implementation_owner: text(input?.implementationOwner ?? input?.implementation_owner, "implementationOwner", false, 200),
      support_required: enumValue(input?.supportRequired ?? input?.support_required, GOVERNED_DECISION_STATUSES, "supportRequired", false) as GovernedDecisionStatus,
      support_tier: enumValue(input?.supportTier ?? input?.support_tier, SUPPORT_TIERS, "supportTier", false) as any,
      managed_service_available: enumValue(input?.managedServiceAvailable ?? input?.managed_service_available, GOVERNED_DECISION_STATUSES, "managedServiceAvailable", false) as GovernedDecisionStatus,
      sla_status: enumValue(input?.slaStatus ?? input?.sla_status, GOVERNED_DECISION_STATUSES, "slaStatus", false) as GovernedDecisionStatus,
      training_required: enumValue(input?.trainingRequired ?? input?.training_required, GOVERNED_DECISION_STATUSES, "trainingRequired", false) as GovernedDecisionStatus,
      professional_development_available: enumValue(input?.professionalDevelopmentAvailable ?? input?.professional_development_available, GOVERNED_DECISION_STATUSES, "professionalDevelopmentAvailable", false) as GovernedDecisionStatus,
    }, executor));
  }

  async updateRenewalExpansionMetadata(commercialProductId: string, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.updateRenewalExpansionMetadata);
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.renewal_expansion_changed", scope, (executor) => this.repo.upsertRenewalExpansion({
      commercial_product_id: commercialProductId,
      renewal_model: enumValue(input?.renewalModel ?? input?.renewal_model, RENEWAL_MODELS, "renewalModel", false) as any,
      renewal_term: text(input?.renewalTerm ?? input?.renewal_term, "renewalTerm", false, 160),
      renewal_window: text(input?.renewalWindow ?? input?.renewal_window, "renewalWindow", false, 160),
      expansion_paths: stringArray(input?.expansionPaths ?? input?.expansion_paths, "expansionPaths"),
      upsell_paths: stringArray(input?.upsellPaths ?? input?.upsell_paths, "upsellPaths"),
      cross_sell_paths: stringArray(input?.crossSellPaths ?? input?.cross_sell_paths, "crossSellPaths"),
    }, executor));
  }

  async updateSocialSellingMetadata(commercialProductId: string, input: any, actor: Actor) {
    const scope = scopeFromActor(actor, input);
    requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.updateSocialSellingMetadata);
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.social_selling_changed", scope, (executor) => this.repo.upsertSocialSelling({
      commercial_product_id: commercialProductId,
      approved_public_marketing: enumValue(input?.approvedPublicMarketing ?? input?.approved_public_marketing, GOVERNED_DECISION_STATUSES, "approvedPublicMarketing", false) as GovernedDecisionStatus,
      approved_social_sharing: enumValue(input?.approvedSocialSharing ?? input?.approved_social_sharing, GOVERNED_DECISION_STATUSES, "approvedSocialSharing", false) as GovernedDecisionStatus,
      social_campaign_tags: stringArray(input?.socialCampaignTags ?? input?.social_campaign_tags, "socialCampaignTags"),
      approved_talking_points_reference: text(input?.approvedTalkingPointsReference ?? input?.approved_talking_points_reference, "approvedTalkingPointsReference", false, 300),
      sales_language_status: enumValue(input?.salesLanguageStatus ?? input?.sales_language_status, SALES_LANGUAGE_STATUSES, "salesLanguageStatus", false) as any,
      brand_restrictions: stringArray(input?.brandRestrictions ?? input?.brand_restrictions, "brandRestrictions"),
    }, executor));
  }

  async updateGovernanceState(commercialProductId: string, input: any, actor: Actor) {
    assertNoCommissionCalculation(input);
    containsForbiddenMoneyFields(input);
    const revenueClassifications = stringArray(input?.revenueClassifications ?? input?.revenue_classifications, "revenueClassifications");
    if (revenueClassifications.some((value) => /RECRUIT/.test(value))) throw new CommercialProductRegistryServiceError("RECRUITING_REVENUE_NOT_ALLOWED");
    const scope = scopeFromActor(actor, input);
    const capability = input?.marginStatus || input?.margin_status ? COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.updateGovernanceState.replace("pricing", "margin") as CommercialProductGovernanceCapability
      : input?.commissionEligibleStatus || input?.commission_eligible_status ? "commercial_product.review_commission"
      : COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.updateGovernanceState;
    requireCapability(actor, capability);
    const payload: GovernanceStateRecord = {
      commercial_product_id: commercialProductId,
      pricing_status: enumValue(input?.pricingStatus ?? input?.pricing_status, PRICING_STATUSES, "pricingStatus", false) as any,
      pricing_model: text(input?.pricingModel ?? input?.pricing_model, "pricingModel", false, 240),
      pricing_authority: text(input?.pricingAuthority ?? input?.pricing_authority, "pricingAuthority", false, 240),
      pricing_reference: text(input?.pricingReference ?? input?.pricing_reference, "pricingReference", false, 300),
      currency: text(input?.currency, "currency", false, 3),
      discount_policy_reference: text(input?.discountPolicyReference ?? input?.discount_policy_reference, "discountPolicyReference", false, 300),
      margin_status: enumValue(input?.marginStatus ?? input?.margin_status, MARGIN_STATUSES, "marginStatus", false) as any,
      cost_model_reference: text(input?.costModelReference ?? input?.cost_model_reference, "costModelReference", false, 300),
      gross_margin_class: text(input?.grossMarginClass ?? input?.gross_margin_class, "grossMarginClass", false, 160),
      minimum_margin_policy: text(input?.minimumMarginPolicy ?? input?.minimum_margin_policy, "minimumMarginPolicy", false, 300),
      commercial_viability_status: enumValue(input?.commercialViabilityStatus ?? input?.commercial_viability_status, COMMERCIAL_VIABILITY_STATUSES, "commercialViabilityStatus", false) as any,
      commission_eligible_status: enumValue(input?.commissionEligibleStatus ?? input?.commission_eligible_status, COMMISSION_ELIGIBILITY_STATUSES, "commissionEligibleStatus", false) as any,
      commission_policy_reference: text(input?.commissionPolicyReference ?? input?.commission_policy_reference, "commissionPolicyReference", false, 300),
      leadership_override_eligible: enumValue(input?.leadershipOverrideEligible ?? input?.leadership_override_eligible, GOVERNED_DECISION_STATUSES, "leadershipOverrideEligible", false) as GovernedDecisionStatus,
      renewal_commission_eligible: enumValue(input?.renewalCommissionEligible ?? input?.renewal_commission_eligible, GOVERNED_DECISION_STATUSES, "renewalCommissionEligible", false) as GovernedDecisionStatus,
      expansion_commission_eligible: enumValue(input?.expansionCommissionEligible ?? input?.expansion_commission_eligible, GOVERNED_DECISION_STATUSES, "expansionCommissionEligible", false) as GovernedDecisionStatus,
      revenue_classifications: revenueClassifications.map((value) => enumValue(value, REVENUE_CLASSIFICATIONS, "revenueClassifications")) as any,
    };
    return this.updateWithAudit(commercialProductId, "commercial_product_registry.governance_state_changed", scope, (executor) => this.repo.upsertGovernanceState(payload, executor));
  }

  async projectSalesProductReadModel(actor?: Actor) {
    if (actor) requireCapability(actor, COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.readSalesProductModel);
    try {
      const products = await this.repo.listProducts();
      const status = statusForRows(products);
      const items = [];
      for (const product of products) items.push(await this.projectProduct(product, status));
      return { status, items, summary: this.summary(products, status), distributions: this.distributions(products, status) };
    } catch (error: any) {
      const status: MockStatusContract = { status: error?.code === "ECONNREFUSED" ? "NOT_CONNECTED" : "ERROR", reason: error?.message || "registry unavailable" };
      return { status, items: [], summary: this.summary([], status), distributions: this.distributions([], status) };
    }
  }

  private async updateWithAudit(commercialProductId: string, action: string, scope: ServiceScope, mutate: (executor: ProductRegistryExecutor) => Promise<any>) {
    return this.transaction(async (executor: ProductRegistryExecutor) => {
      const previous = await this.repo.getProductById(commercialProductId, executor);
      const updated = await mutate(executor);
      await this.audit("commercial_product", commercialProductId, action, scope, previous, updated, executor);
      return updated;
    });
  }

  private async requireProduct(commercialProductId: string, executor: ProductRegistryExecutor) {
    const product = await this.repo.getProductById(commercialProductId, executor);
    if (!product) throw new CommercialProductRegistryServiceError("COMMERCIAL_PRODUCT_NOT_FOUND", "Commercial product not found.", 404);
    return product;
  }

  private async audit(targetType: string, targetId: string, action: string, scope: ServiceScope, previous: any, next: any, executor: ProductRegistryExecutor, reasonText?: string | null) {
    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: scope.organization_id,
      actor_user_id: scope.actor_id,
      actor_system_id: scope.actor_system_id,
      target_object_type: targetType,
      target_object_id: targetId,
      action_type: action,
      previous_state_json: auditShape(previous),
      new_state_json: auditShape(next),
      reason_text: reasonText || null,
      correlation_id: scope.correlation_id,
      source_channel: scope.source_channel,
    }, executor);
  }

  private sourceRecord(commercialProductId: string, source: SourceAuthorityReference) {
    return {
      source_reference_id: `cpr_src_${randomUUID()}`,
      commercial_product_id: commercialProductId,
      source_authority_type: source.sourceAuthorityType,
      source_authority_id: source.sourceAuthorityId || null,
      source_domain: source.sourceDomain || null,
      source_record_id: source.sourceRecordId,
      source_version: source.sourceVersion || null,
      source_status: source.sourceStatus,
      source_last_verified_at: source.sourceLastVerifiedAt || null,
      source_provenance: source.sourceProvenance,
    };
  }

  private capabilityForGate(gateType: ReviewGateType): CommercialProductGovernanceCapability {
    if (gateType === "LEGAL") return "commercial_product.review_legal";
    if (gateType === "REGULATORY") return "commercial_product.review_regulatory";
    if (gateType === "PRICING") return "commercial_product.review_pricing";
    if (gateType === "MARGIN") return "commercial_product.review_margin";
    if (gateType === "COMMISSION") return "commercial_product.review_commission";
    if (gateType === "PARTNER") return "commercial_product.review_sponsorship";
    if (gateType === "COMMERCIAL_READINESS") return "commercial_product.review_readiness";
    return COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT.manageReviewGate;
  }

  private async projectProduct(product: any, status: MockStatusContract) {
    const [buyers, forms, gates, sources, funding, implementation, renewal] = await Promise.all([
      this.repo.listBuyers(product.commercial_product_id),
      this.repo.listCommercialForms(product.commercial_product_id),
      this.repo.listGates(product.commercial_product_id),
      this.repo.listSourceAuthorities(product.commercial_product_id),
      this.repo.listFundingRelationships(product.commercial_product_id),
      this.repo.getImplementationSupport(product.commercial_product_id),
      this.repo.getRenewalExpansion(product.commercial_product_id),
    ]);
    const blockedGates = gates.filter((gate: any) => gate.status === "BLOCKED" || gate.status === "PENDING" || gate.status === "STALE").map((gate: any) => gate.gate_type);
    return {
      commercialProductId: product.commercial_product_id,
      name: product.display_name,
      family: product.commercial_family,
      shortDescription: product.short_description || undefined,
      buyerFit: buyers.map((buyer: any) => buyer.buyer_type),
      readiness: product.readiness,
      sellability: product.sellability,
      commercialForms: forms.map((form: any) => form.commercial_form),
      sellingEntity: product.selling_entity,
      deliveryEntity: product.delivery_entity,
      pricingStatus: product.pricing_status,
      fundingRelationship: funding[0]?.funding_relationship_status || "NOT_FOUND",
      implementationStatus: implementation?.implementation_required || "UNKNOWN",
      supportStatus: implementation?.support_required || "UNKNOWN",
      commissionEligibility: product.commission_eligible_status,
      renewalModel: renewal?.renewal_model || product.renewal_model || "UNKNOWN",
      expansionPaths: parseJsonArray(renewal?.expansion_paths),
      reviewBlocks: blockedGates,
      sourceProvenance: sources.map((source: any) => ({
        sourceAuthorityType: source.source_authority_type,
        sourceAuthorityId: source.source_authority_id || undefined,
        sourceDomain: source.source_domain || undefined,
        sourceRecordId: source.source_record_id,
        sourceVersion: source.source_version || undefined,
        sourceStatus: source.source_status,
        sourceLastVerifiedAt: source.source_last_verified_at || undefined,
        sourceProvenance: parseJsonArray(source.source_provenance),
      })),
      lastVerifiedAt: product.last_verified_at || undefined,
      connectionStatus: status,
    };
  }

  private summary(products: readonly any[], status: MockStatusContract) {
    return {
      sellNow: products.filter((row) => row.sellability === "SELL_NOW").length,
      pilot: products.filter((row) => row.sellability === "PILOT").length,
      develop: products.filter((row) => row.sellability === "DEVELOP").length,
      needsReview: products.filter((row) => row.sellability === "NEEDS_REVIEW").length,
      notSellable: products.filter((row) => row.sellability === "NOT_SELLABLE").length,
      status,
    };
  }

  private distributions(products: readonly any[], status: MockStatusContract) {
    const countBy = (field: string) => products.reduce((acc: Record<string, number>, row: any) => {
      acc[row[field]] = (acc[row[field]] || 0) + 1;
      return acc;
    }, {});
    return {
      family: Object.entries(countBy("commercial_family")).map(([key, count]) => ({ key, count, status })),
      readiness: Object.entries(countBy("readiness")).map(([key, count]) => ({ key, count, status })),
      sellability: Object.entries(countBy("sellability")).map(([key, count]) => ({ key, count, status })),
    };
  }
}

export const COMMERCIAL_PRODUCT_REGISTRY_SCOPE = {
  authority: COMMERCIAL_PRODUCT_REGISTRY_AUTHORITY,
  salesRole: SALES_CONSUMER_AUTHORITY,
  identityScope: "GLOBAL_CANONICAL",
  tenantOverlayBoundary: "Future tenant/geography availability must be modeled as overlays, not canonical identity fields.",
} as const;
