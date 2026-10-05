export const COMMERCIAL_PRODUCT_REGISTRY_AUTHORITY = "COMMERCIAL_PRODUCT_REGISTRY" as const;
export const SALES_CONSUMER_AUTHORITY = "SALES_CONSUMER" as const;

export const COMMERCIAL_FAMILIES = [
  "CORE_EDUCATION",
  "CAREER_WORKFORCE",
  "DATA_CENTER",
  "HEALTHCARE_WORKFORCE",
  "FIRE_PUBLIC_SAFETY",
  "INFRASTRUCTURE_WORKFORCE",
  "LOGISTICS_SUPPLY_CHAIN",
  "APPRENTICESHIP_WBL",
  "AVIATION",
  "CREATOR_MEDIA_SHNN",
  "LEARNING_GAMING",
  "METAVERSE",
  "CIVIC_FINANCIAL_CAPABILITY",
  "INSTITUTIONAL_TECH_SHS",
  "ASSURANCE_VERIFICATION_REPORTING",
] as const;
export type CommercialFamily = typeof COMMERCIAL_FAMILIES[number];

export const PRODUCT_TYPES = ["LICENSE", "SERVICE", "PROGRAM", "SPONSORSHIP", "ASSESSMENT", "MANAGED_SERVICE", "IMPLEMENTATION_PACKAGE", "CONTENT_LICENSE", "PROFESSIONAL_SERVICE", "UNKNOWN"] as const;
export type CommercialProductType = typeof PRODUCT_TYPES[number];

export const PRODUCT_IDENTITY_STATUSES = ["ACTIVE", "SUSPENDED", "SUNSET", "RETIRED"] as const;
export type ProductIdentityStatus = typeof PRODUCT_IDENTITY_STATUSES[number];

export const PRODUCT_LIFECYCLE_STATES = ["DISCOVERED", "DEFINED", "REVIEW", "PILOT_READY", "PILOT_ACTIVE", "SALES_READY", "ACTIVE", "SUSPENDED", "SUNSET", "RETIRED"] as const;
export type ProductLifecycleState = typeof PRODUCT_LIFECYCLE_STATES[number];

export const PRODUCT_LIFECYCLE_TRANSITIONS: Readonly<Record<ProductLifecycleState, readonly ProductLifecycleState[]>> = {
  DISCOVERED: ["DEFINED", "REVIEW", "RETIRED"],
  DEFINED: ["REVIEW", "SUSPENDED", "RETIRED"],
  REVIEW: ["DEFINED", "PILOT_READY", "SUSPENDED", "RETIRED"],
  PILOT_READY: ["PILOT_ACTIVE", "REVIEW", "SUSPENDED", "SUNSET"],
  PILOT_ACTIVE: ["SALES_READY", "REVIEW", "SUSPENDED", "SUNSET"],
  SALES_READY: ["ACTIVE", "REVIEW", "SUSPENDED", "SUNSET"],
  ACTIVE: ["SUSPENDED", "SUNSET"],
  SUSPENDED: ["REVIEW", "ACTIVE", "SUNSET", "RETIRED"],
  SUNSET: ["RETIRED"],
  RETIRED: [],
};

export const READINESS_STATES = ["RED", "YELLOW", "GREEN", "BLUE", "UNKNOWN"] as const;
export type ReadinessState = typeof READINESS_STATES[number];

export const SELLABILITY_STATUSES = ["SELL_NOW", "PILOT", "DEVELOP", "NOT_SELLABLE", "NEEDS_REVIEW"] as const;
export type SellabilityStatus = typeof SELLABILITY_STATUSES[number];

export const REVIEW_GATE_TYPES = ["COMMERCIAL_READINESS", "LEGAL", "TAX", "REGULATORY", "PROCUREMENT", "FUNDING", "DELIVERY_CAPACITY", "EVIDENCE", "SUPPORT", "PRICING", "MARGIN", "COMMISSION", "ENTITLEMENT", "PARTNER"] as const;
export type ReviewGateType = typeof REVIEW_GATE_TYPES[number];

export const REVIEW_GATE_STATUSES = ["NOT_REQUIRED", "PENDING", "APPROVED", "BLOCKED", "STALE", "UNKNOWN"] as const;
export type ReviewGateStatus = typeof REVIEW_GATE_STATUSES[number];

export const ENTITY_CLASSIFICATIONS = ["SHF", "SHS", "PARTNER", "JOINT_STRUCTURE_REVIEW_REQUIRED", "UNKNOWN"] as const;
export type EntityClassification = typeof ENTITY_CLASSIFICATIONS[number];

export const ENTITY_REVIEW_FLAGS = ["LEGAL_REVIEW_REQUIRED", "TAX_REVIEW_REQUIRED", "REGULATORY_REVIEW_REQUIRED", "PROCUREMENT_REVIEW_REQUIRED", "FUNDING_REVIEW_REQUIRED"] as const;
export type EntityReviewFlag = typeof ENTITY_REVIEW_FLAGS[number];

export const BUYER_TYPES = [
  "K12_SCHOOL",
  "SCHOOL_DISTRICT",
  "CHARTER_SCHOOL",
  "PRIVATE_SCHOOL",
  "COLLEGE",
  "UNIVERSITY",
  "CAREER_TECH",
  "WORKFORCE_BOARD",
  "AMERICAN_JOB_CENTER",
  "MUNICIPALITY",
  "COUNTY",
  "STATE_AGENCY",
  "NONPROFIT",
  "YOUTH_PROGRAM",
  "AFTER_SCHOOL_PROVIDER",
  "SUMMER_PROGRAM",
  "LIBRARY",
  "EMPLOYER",
  "DATA_CENTER_OPERATOR",
  "HEALTHCARE_EMPLOYER",
  "HOSPITAL",
  "NURSING_FACILITY",
  "FIRE_DEPARTMENT",
  "PUBLIC_SAFETY_AGENCY",
  "UTILITY",
  "CONTRACTOR",
  "LOGISTICS_EMPLOYER",
  "UNION",
  "APPRENTICESHIP_SPONSOR",
  "BANK",
  "CREDIT_UNION",
  "FOUNDATION",
  "PHILANTHROPY",
  "COMMUNITY_ORGANIZATION",
  "TRAINING_PROVIDER",
  "ENTERPRISE",
] as const;
export type BuyerType = typeof BUYER_TYPES[number];

export const COMMERCIAL_FORMS = ["PER_STUDENT_LICENSE", "PER_COHORT_LICENSE", "PER_SITE_LICENSE", "PER_INSTITUTION_LICENSE", "ANNUAL_LICENSE", "SUBSCRIPTION", "IMPLEMENTATION_FEE", "PROFESSIONAL_SERVICE", "MANAGED_SERVICE", "ASSESSMENT", "CUSTOM_DEVELOPMENT", "SPONSORSHIP", "TRAINING", "SUPPORT", "USAGE_BASED", "ENTERPRISE_CONTRACT", "PARTNER_DELIVERED", "GRANT_SUPPORTED", "EMPLOYER_SUPPORTED"] as const;
export type CommercialForm = typeof COMMERCIAL_FORMS[number];

export const SOURCE_AUTHORITY_TYPES = ["PROGRAM_REGISTRY", "CURRICULUM", "CAREER_REGISTRY", "SERVICE_CATALOG", "ENTITLEMENTS", "FUNDING", "EVIDENCE", "TRUTH_SPINE", "ORACLE", "REPORTING", "CONTRACTS", "DELIVERY", "CREDENTIALS", "OTHER_GOVERNED_AUTHORITY"] as const;
export type SourceAuthorityType = typeof SOURCE_AUTHORITY_TYPES[number];

export const SOURCE_AUTHORITY_STATUSES = ["FOUND", "PARTIAL", "PLANNED", "NOT_FOUND", "UNKNOWN", "STALE", "BLOCKED"] as const;
export type SourceAuthorityStatus = typeof SOURCE_AUTHORITY_STATUSES[number];

export const FUNDING_RELATIONSHIP_STATUSES = ["POTENTIAL", "DOCUMENTED", "VERIFIED", "NOT_FOUND", "REVIEW_REQUIRED"] as const;
export type FundingRelationshipStatus = typeof FUNDING_RELATIONSHIP_STATUSES[number];

export const FUNDING_CATEGORIES = ["GRANT", "WORKFORCE_FUNDING", "EMPLOYER_CONTRIBUTION", "APPRENTICESHIP_FUNDING", "UNION_PARTNERSHIP", "PHILANTHROPY", "SPONSORSHIP", "INSTITUTIONAL_PURCHASING", "SHS_COMMERCIAL_REVENUE"] as const;
export type FundingCategory = typeof FUNDING_CATEGORIES[number];

export const PRICING_STATUSES = ["NOT_DEFINED", "DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "EXPIRED", "BLOCKED"] as const;
export type PricingStatus = typeof PRICING_STATUSES[number];

export const MARGIN_STATUSES = ["NOT_DEFINED", "DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "BLOCKED", "UNKNOWN"] as const;
export type MarginStatus = typeof MARGIN_STATUSES[number];

export const COMMERCIAL_VIABILITY_STATUSES = ["UNKNOWN", "NEEDS_REVIEW", "VIABLE", "CONDITIONALLY_VIABLE", "NOT_VIABLE", "BLOCKED"] as const;
export type CommercialViabilityStatus = typeof COMMERCIAL_VIABILITY_STATUSES[number];

export const COMMISSION_ELIGIBILITY_STATUSES = ["NOT_ELIGIBLE", "ELIGIBLE_AFTER_APPROVAL", "UNDER_REVIEW", "APPROVED", "BLOCKED", "UNKNOWN"] as const;
export type CommissionEligibilityStatus = typeof COMMISSION_ELIGIBILITY_STATUSES[number];

export const GOVERNED_DECISION_STATUSES = ["NOT_DEFINED", "NOT_REQUIRED", "PENDING", "APPROVED", "BLOCKED", "UNKNOWN"] as const;
export type GovernedDecisionStatus = typeof GOVERNED_DECISION_STATUSES[number];

export const SALES_LEADERSHIP_ROLES = ["SALES_ASSOCIATE", "SALES_REPRESENTATIVE", "SENIOR_SALES_REPRESENTATIVE", "TEAM_LEAD", "SALES_MANAGER", "REGIONAL_SALES_MANAGER", "SALES_DIRECTOR", "VP_HEAD_OF_SALES"] as const;
export type SalesLeadershipRole = typeof SALES_LEADERSHIP_ROLES[number];

export const REVENUE_CLASSIFICATIONS = ["ONE_TIME", "RECURRING", "IMPLEMENTATION", "SUBSCRIPTION", "LICENSE", "PROFESSIONAL_SERVICE", "MANAGED_SERVICE", "SPONSORSHIP", "GRANT_SUPPORTED", "EMPLOYER_SUPPORTED", "RENEWAL", "EXPANSION"] as const;
export type RevenueClassification = typeof REVENUE_CLASSIFICATIONS[number];

export const PRODUCT_RELATIONSHIP_TYPES = ["STANDALONE_PRODUCT", "BASE_PRODUCT", "ADD_ON", "BUNDLE_COMPONENT", "PREREQUISITE", "OPTIONAL_MODULE", "UPSELL", "CROSS_SELL", "RENEWAL", "EXPANSION", "SPONSORSHIP_ASSOCIATION", "PARTNER_REQUIRED", "FUNDING_SUPPORTED", "REPLACES", "SUPERSEDES"] as const;
export type ProductRelationshipType = typeof PRODUCT_RELATIONSHIP_TYPES[number];

export const RELATIONSHIP_DIRECTIONS = ["SELF", "SOURCE_TO_TARGET", "TARGET_TO_SOURCE"] as const;
export type RelationshipDirection = typeof RELATIONSHIP_DIRECTIONS[number];

export const RELATIONSHIP_STATUSES = ["DRAFT", "ACTIVE", "STALE", "RETIRED", "BLOCKED", "UNKNOWN"] as const;
export type RelationshipStatus = typeof RELATIONSHIP_STATUSES[number];

export const REGULATED_PROGRAM_TYPES = ["HEALTHCARE", "STNA", "NURSING", "PHLEBOTOMY", "FIRE_PUBLIC_SAFETY", "EMS", "AVIATION", "APPRENTICESHIP", "OTHER_REGULATED_PROGRAM"] as const;
export type RegulatedProgramType = typeof REGULATED_PROGRAM_TYPES[number];

export const IMPLEMENTATION_TIERS = ["NONE", "LIGHT", "STANDARD", "COMPLEX", "CUSTOM", "UNKNOWN"] as const;
export type ImplementationTier = typeof IMPLEMENTATION_TIERS[number];

export const SUPPORT_TIERS = ["NONE", "BASIC", "STANDARD", "ENHANCED", "ENTERPRISE", "UNKNOWN"] as const;
export type SupportTier = typeof SUPPORT_TIERS[number];

export const RENEWAL_MODELS = ["NONE", "MANUAL", "ANNUAL", "MULTI_YEAR", "EVERGREEN", "PROJECT_BASED", "UNKNOWN"] as const;
export type RenewalModel = typeof RENEWAL_MODELS[number];

export const SALES_LANGUAGE_STATUSES = ["NOT_DEFINED", "DRAFT", "APPROVED_INTERNAL_ONLY", "APPROVED_PUBLIC", "RESTRICTED", "BLOCKED", "UNKNOWN"] as const;
export type SalesLanguageStatus = typeof SALES_LANGUAGE_STATUSES[number];

export const MOCK_CONNECTION_STATUSES = ["LOADING", "CONNECTED", "CONNECTED_EMPTY", "NOT_CONNECTED", "BLOCKED", "STALE", "UNKNOWN", "ERROR"] as const;
export type MockConnectionStatus = typeof MOCK_CONNECTION_STATUSES[number];

export const GOVERNANCE_CAPABILITIES = [
  "commercial_product.read",
  "commercial_product.create",
  "commercial_product.edit",
  "commercial_product.review_readiness",
  "commercial_product.review_sellability",
  "commercial_product.review_legal",
  "commercial_product.review_regulatory",
  "commercial_product.review_pricing",
  "commercial_product.review_margin",
  "commercial_product.review_commission",
  "commercial_product.review_sponsorship",
  "commercial_product.review_tax",
  "commercial_product.review_procurement",
  "commercial_product.review_funding",
  "commercial_product.review_delivery_capacity",
  "commercial_product.review_evidence",
  "commercial_product.review_support",
  "commercial_product.review_entitlement",
  "commercial_product.review_partner",
  "commercial_product.review_source_authority",
  "commercial_product.transition_lifecycle",
  "commercial_product.retire",
] as const;
export type CommercialProductGovernanceCapability = typeof GOVERNANCE_CAPABILITIES[number];

export interface SourceAuthorityReference {
  sourceAuthorityType: SourceAuthorityType;
  sourceAuthorityId?: string;
  sourceDomain?: string;
  sourceRecordId: string;
  sourceVersion?: string;
  sourceStatus: SourceAuthorityStatus;
  sourceLastVerifiedAt?: string;
  sourceProvenance: readonly string[];
}

export interface ProductIdentityContract {
  commercialProductId: string;
  canonicalName: string;
  displayName: string;
  slug: string;
  commercialFamily: CommercialFamily;
  subfamily?: string;
  productType: CommercialProductType;
  description?: string;
  shortDescription?: string;
  version: number;
  status: ProductIdentityStatus;
}

export interface ReadinessContract {
  readiness: ReadinessState;
  reason: string;
  evidenceReferences: readonly SourceAuthorityReference[];
  lastEvaluatedAt?: string;
  evaluatedByAuthority?: string;
  staleAfter?: string;
}

export interface SellabilityContract {
  sellabilityStatus: SellabilityStatus;
  reason: string;
  blockers: readonly string[];
  restrictions: readonly string[];
  effectiveFrom?: string;
  effectiveTo?: string;
  staleAfter?: string;
  sourceAuthority: SourceAuthorityReference;
}

export interface ReviewGateContract {
  gateType: ReviewGateType;
  status: ReviewGateStatus;
  authority?: string;
  reference?: string;
  reason?: string;
  reviewedAt?: string;
  expiresAt?: string;
  staleAfter?: string;
}

export interface EntityContract {
  sellingEntity: EntityClassification;
  deliveryEntity: EntityClassification;
  partnerRequired: boolean;
  partnerType?: string;
  jointStructureRequired: boolean;
  reviewFlags: readonly EntityReviewFlag[];
}

export interface BuyerCompatibilityContract {
  buyerType: BuyerType;
  status: "POTENTIAL" | "DOCUMENTED" | "VERIFIED" | "BLOCKED" | "UNKNOWN";
  authorityReference?: SourceAuthorityReference;
  limitations: readonly string[];
}

export interface FundingRelationshipContract {
  status: FundingRelationshipStatus;
  categories: readonly FundingCategory[];
  authorityReference?: SourceAuthorityReference;
  limitations: readonly string[];
}

export interface EntitlementReferenceContract {
  requiredEntitlementIds: readonly string[];
  optionalEntitlementIds: readonly string[];
  entitlementAuthority?: string;
  entitlementStatusReference?: string;
}

export interface PricingMetadataContract {
  pricingStatus: PricingStatus;
  pricingModel?: string;
  pricingAuthority?: string;
  pricingReference?: string;
  priceEffectiveFrom?: string;
  priceEffectiveTo?: string;
  currency?: string;
  discountPolicyReference?: string;
}

export interface MarginMetadataContract {
  marginStatus: MarginStatus;
  costModelReference?: string;
  grossMarginClass?: string;
  minimumMarginPolicy?: string;
  commercialViabilityStatus: CommercialViabilityStatus;
}

export interface CommissionLeadershipMetadataContract {
  commissionEligibleStatus: CommissionEligibilityStatus;
  commissionPolicyReference?: string;
  leadershipOverrideEligible: GovernedDecisionStatus;
  renewalCommissionEligible: GovernedDecisionStatus;
  expansionCommissionEligible: GovernedDecisionStatus;
}

export interface ProductRelationshipContract {
  relationshipId: string;
  sourceProductId: string;
  targetProductId: string;
  relationshipType: ProductRelationshipType;
  direction: RelationshipDirection;
  status: RelationshipStatus;
  effectiveFrom?: string;
  effectiveTo?: string;
  sourceAuthority?: SourceAuthorityReference;
  provenance: readonly string[];
}

export interface RegulatedProgramMetadataContract {
  programTypes: readonly RegulatedProgramType[];
  regulatoryAuthority?: string;
  externalTrainingAuthorityRequired: GovernedDecisionStatus;
  credentialAuthority?: string;
  partnerRequired: boolean;
  scopeLimitations: readonly string[];
  salesLanguageRestrictions: readonly string[];
}

export interface ImplementationSupportMetadataContract {
  implementationRequired: GovernedDecisionStatus;
  implementationTier: ImplementationTier;
  implementationOwner?: string;
  supportRequired: GovernedDecisionStatus;
  supportTier: SupportTier;
  managedServiceAvailable: GovernedDecisionStatus;
  slaStatus: GovernedDecisionStatus;
  trainingRequired: GovernedDecisionStatus;
  professionalDevelopmentAvailable: GovernedDecisionStatus;
}

export interface RenewalExpansionMetadataContract {
  renewalModel: RenewalModel;
  renewalTerm?: string;
  renewalWindow?: string;
  expansionPaths: readonly string[];
  upsellPaths: readonly string[];
  crossSellPaths: readonly string[];
}

export interface SocialSellingMetadataContract {
  approvedPublicMarketing: GovernedDecisionStatus;
  approvedSocialSharing: GovernedDecisionStatus;
  socialCampaignTags: readonly string[];
  approvedTalkingPointsReference?: string;
  salesLanguageStatus: SalesLanguageStatus;
  brandRestrictions: readonly string[];
}

export interface MockStatusContract {
  status: MockConnectionStatus;
  reason?: string;
  lastConnectedAt?: string;
  staleAfter?: string;
}

export interface CommercialProductReadModel {
  commercialProductId: string;
  name: string;
  family: CommercialFamily;
  shortDescription?: string;
  buyerFit: readonly BuyerType[];
  readiness: ReadinessState;
  sellability: SellabilityStatus;
  commercialForms: readonly CommercialForm[];
  sellingEntity: EntityClassification;
  deliveryEntity: EntityClassification;
  pricingStatus: PricingStatus;
  fundingRelationship: FundingRelationshipStatus;
  implementationStatus: GovernedDecisionStatus;
  supportStatus: GovernedDecisionStatus;
  commissionEligibility: CommissionEligibilityStatus;
  renewalModel: RenewalModel;
  expansionPaths: readonly string[];
  reviewBlocks: readonly ReviewGateType[];
  sourceProvenance: readonly SourceAuthorityReference[];
  lastVerifiedAt?: string;
  connectionStatus: MockStatusContract;
}

export interface CommercialProductSummaryCounts {
  sellNow: number;
  pilot: number;
  develop: number;
  needsReview: number;
  notSellable: number;
  status: MockStatusContract;
}

export interface CommercialProductDistribution<T extends string> {
  key: T;
  count: number;
  status: MockStatusContract;
}

export interface CommercialProductRegistryContract {
  authority: typeof COMMERCIAL_PRODUCT_REGISTRY_AUTHORITY;
  salesRole: typeof SALES_CONSUMER_AUTHORITY;
  identity: ProductIdentityContract;
  lifecycleState: ProductLifecycleState;
  sourceAuthorities: readonly SourceAuthorityReference[];
  readiness: ReadinessContract;
  sellability: SellabilityContract;
  reviewGates: readonly ReviewGateContract[];
  entity: EntityContract;
  buyerCompatibility: readonly BuyerCompatibilityContract[];
  commercialForms: readonly CommercialForm[];
  funding: FundingRelationshipContract;
  entitlements: EntitlementReferenceContract;
  pricing: PricingMetadataContract;
  margin: MarginMetadataContract;
  commissionLeadership: CommissionLeadershipMetadataContract;
  revenueClassifications: readonly RevenueClassification[];
  relationships: readonly ProductRelationshipContract[];
  regulatedProgram: RegulatedProgramMetadataContract;
  implementationSupport: ImplementationSupportMetadataContract;
  renewalExpansion: RenewalExpansionMetadataContract;
  socialSelling: SocialSellingMetadataContract;
}

export function isOneOf<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

export const isCommercialFamily = (value: unknown): value is CommercialFamily => isOneOf(COMMERCIAL_FAMILIES, value);
export const isReadinessState = (value: unknown): value is ReadinessState => isOneOf(READINESS_STATES, value);
export const isSellabilityStatus = (value: unknown): value is SellabilityStatus => isOneOf(SELLABILITY_STATUSES, value);
export const isReviewGateStatus = (value: unknown): value is ReviewGateStatus => isOneOf(REVIEW_GATE_STATUSES, value);
export const isBuyerType = (value: unknown): value is BuyerType => isOneOf(BUYER_TYPES, value);
export const isCommercialForm = (value: unknown): value is CommercialForm => isOneOf(COMMERCIAL_FORMS, value);
export const isFundingRelationshipStatus = (value: unknown): value is FundingRelationshipStatus => isOneOf(FUNDING_RELATIONSHIP_STATUSES, value);
export const isProductRelationshipType = (value: unknown): value is ProductRelationshipType => isOneOf(PRODUCT_RELATIONSHIP_TYPES, value);
export const isProductLifecycleState = (value: unknown): value is ProductLifecycleState => isOneOf(PRODUCT_LIFECYCLE_STATES, value);
export const isMockConnectionStatus = (value: unknown): value is MockConnectionStatus => isOneOf(MOCK_CONNECTION_STATUSES, value);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateProductIdentityContract(value: unknown): ProductIdentityContract {
  if (!isRecord(value)) throw new Error("COMMERCIAL_PRODUCT_IDENTITY_INVALID");
  if (!nonEmptyString(value.commercialProductId) || !String(value.commercialProductId).startsWith("cp_")) throw new Error("COMMERCIAL_PRODUCT_ID_INVALID");
  if (!nonEmptyString(value.canonicalName) || !nonEmptyString(value.displayName) || !nonEmptyString(value.slug)) throw new Error("COMMERCIAL_PRODUCT_IDENTITY_TEXT_INVALID");
  if (!isCommercialFamily(value.commercialFamily)) throw new Error("COMMERCIAL_PRODUCT_FAMILY_INVALID");
  if (!isOneOf(PRODUCT_TYPES, value.productType)) throw new Error("COMMERCIAL_PRODUCT_TYPE_INVALID");
  if (!Number.isInteger(value.version) || Number(value.version) < 1) throw new Error("COMMERCIAL_PRODUCT_VERSION_INVALID");
  if (!isOneOf(PRODUCT_IDENTITY_STATUSES, value.status)) throw new Error("COMMERCIAL_PRODUCT_STATUS_INVALID");
  return value as unknown as ProductIdentityContract;
}

export function validateSourceAuthorityReference(value: unknown): SourceAuthorityReference {
  if (!isRecord(value)) throw new Error("SOURCE_AUTHORITY_REFERENCE_INVALID");
  if (!isOneOf(SOURCE_AUTHORITY_TYPES, value.sourceAuthorityType)) throw new Error("SOURCE_AUTHORITY_TYPE_INVALID");
  if (!nonEmptyString(value.sourceRecordId)) throw new Error("SOURCE_AUTHORITY_RECORD_REQUIRED");
  if (!isOneOf(SOURCE_AUTHORITY_STATUSES, value.sourceStatus)) throw new Error("SOURCE_AUTHORITY_STATUS_INVALID");
  if (!Array.isArray(value.sourceProvenance) || value.sourceProvenance.some((item) => !nonEmptyString(item))) throw new Error("SOURCE_AUTHORITY_PROVENANCE_REQUIRED");
  return value as unknown as SourceAuthorityReference;
}

export function validateReadinessContract(value: unknown): ReadinessContract {
  if (!isRecord(value) || !isReadinessState(value.readiness) || !nonEmptyString(value.reason)) throw new Error("READINESS_CONTRACT_INVALID");
  if (!Array.isArray(value.evidenceReferences)) throw new Error("READINESS_EVIDENCE_REQUIRED");
  value.evidenceReferences.forEach(validateSourceAuthorityReference);
  return value as unknown as ReadinessContract;
}

export function validateSellabilityContract(value: unknown): SellabilityContract {
  if (!isRecord(value) || !isSellabilityStatus(value.sellabilityStatus) || !nonEmptyString(value.reason)) throw new Error("SELLABILITY_CONTRACT_INVALID");
  if (!Array.isArray(value.blockers) || !Array.isArray(value.restrictions)) throw new Error("SELLABILITY_CONTEXT_INVALID");
  validateSourceAuthorityReference(value.sourceAuthority);
  return value as unknown as SellabilityContract;
}

export function validateReviewGateContract(value: unknown): ReviewGateContract {
  if (!isRecord(value) || !isOneOf(REVIEW_GATE_TYPES, value.gateType) || !isReviewGateStatus(value.status)) throw new Error("REVIEW_GATE_CONTRACT_INVALID");
  if (value.status === "APPROVED" && !nonEmptyString(value.authority)) throw new Error("REVIEW_GATE_APPROVAL_AUTHORITY_REQUIRED");
  return value as unknown as ReviewGateContract;
}

export function validateProductRelationshipContract(value: unknown): ProductRelationshipContract {
  if (!isRecord(value)) throw new Error("PRODUCT_RELATIONSHIP_INVALID");
  if (!nonEmptyString(value.relationshipId) || !nonEmptyString(value.sourceProductId) || !nonEmptyString(value.targetProductId)) throw new Error("PRODUCT_RELATIONSHIP_ID_INVALID");
  if (!isProductRelationshipType(value.relationshipType)) throw new Error("PRODUCT_RELATIONSHIP_TYPE_INVALID");
  if (!isOneOf(RELATIONSHIP_DIRECTIONS, value.direction) || !isOneOf(RELATIONSHIP_STATUSES, value.status)) throw new Error("PRODUCT_RELATIONSHIP_STATE_INVALID");
  if (value.sourceProductId === value.targetProductId && value.relationshipType !== "STANDALONE_PRODUCT") throw new Error("PRODUCT_RELATIONSHIP_SELF_RELATION_INVALID");
  return value as unknown as ProductRelationshipContract;
}

export function canTransitionProductLifecycle(from: ProductLifecycleState, to: ProductLifecycleState) {
  return PRODUCT_LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validateMockStatus(value: unknown): MockStatusContract {
  if (!isRecord(value) || !isMockConnectionStatus(value.status)) throw new Error("MOCK_STATUS_INVALID");
  return value as unknown as MockStatusContract;
}

export function assertNoFundingEligibilityField(value: unknown) {
  if (!isRecord(value)) return;
  if ("eligibilityStatus" in value || "fundingEligibility" in value || "eligible" in value) throw new Error("FUNDING_ELIGIBILITY_NOT_REGISTRY_AUTHORITY");
}

export function assertNoCommissionCalculation(value: unknown) {
  if (!isRecord(value)) return;
  if ("commissionAmount" in value || "commissionRate" in value || "calculatedCommission" in value) throw new Error("COMMISSION_CALCULATION_NOT_ALLOWED");
}
