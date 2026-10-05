import type {
  BuyerType,
  CommercialFamily,
  CommercialForm,
  EntityReviewFlag,
  CommercialProductType,
  EntityClassification,
  ProductIdentityStatus,
  ProductLifecycleState,
  ProductRelationshipType,
  ReadinessState,
  CommissionEligibilityStatus,
  CommercialViabilityStatus,
  FundingCategory,
  FundingRelationshipStatus,
  GovernedDecisionStatus,
  ImplementationTier,
  MarginStatus,
  PricingStatus,
  RegulatedProgramType,
  RenewalModel,
  RelationshipDirection,
  RelationshipStatus,
  ReviewGateStatus,
  ReviewGateType,
  RevenueClassification,
  SalesLanguageStatus,
  SellabilityStatus,
  SourceAuthorityStatus,
  SourceAuthorityType,
  SupportTier,
} from "../model/commercial-product-registry-contract.js";

export type CommercialProductCore = {
  commercial_product_id: string;
  canonical_name: string;
  display_name: string;
  slug: string;
  commercial_family: CommercialFamily;
  subfamily?: string | null;
  product_type: CommercialProductType;
  description?: string | null;
  short_description?: string | null;
  version?: number;
  status?: ProductIdentityStatus;
  lifecycle_state?: ProductLifecycleState;
  readiness?: ReadinessState;
  readiness_reason?: string | null;
  readiness_authority?: string | null;
  readiness_evidence_references?: unknown;
  sellability?: SellabilityStatus;
  sellability_reason?: string | null;
  sellability_authority?: string | null;
  selling_entity?: EntityClassification;
  delivery_entity?: EntityClassification;
  partner_required?: boolean;
  partner_type?: string | null;
  joint_structure_required?: boolean;
  entity_review_flags?: readonly EntityReviewFlag[];
  pricing_status?: string;
  margin_status?: string;
  commission_eligible_status?: string;
  renewal_model?: string;
  last_verified_at?: Date | string | null;
  created_by?: string | null;
  updated_by?: string | null;
};

export type CommercialProductMetadataUpdate = Partial<Pick<
  CommercialProductCore,
  "canonical_name" | "display_name" | "slug" | "subfamily" | "description" | "short_description" | "updated_by"
>>;

export type ProductRegistryListFilters = {
  commercial_family?: CommercialFamily;
  readiness?: ReadinessState;
  sellability?: SellabilityStatus;
  lifecycle_state?: ProductLifecycleState;
  status?: ProductIdentityStatus;
};

export type SourceAuthorityRecord = {
  source_reference_id: string;
  commercial_product_id: string;
  source_authority_type: SourceAuthorityType;
  source_authority_id?: string | null;
  source_domain?: string | null;
  source_record_id: string;
  source_version?: string | null;
  source_status: SourceAuthorityStatus;
  source_last_verified_at?: Date | string | null;
  source_provenance: readonly string[];
};

export type BuyerCompatibilityRecord = {
  commercial_product_buyer_id: string;
  commercial_product_id: string;
  buyer_type: BuyerType;
  status?: "POTENTIAL" | "DOCUMENTED" | "VERIFIED" | "BLOCKED" | "UNKNOWN";
  authority_source_reference_id?: string | null;
  limitations?: readonly string[];
};

export type CommercialFormRecord = {
  commercial_product_form_id: string;
  commercial_product_id: string;
  commercial_form: CommercialForm;
  status?: "POTENTIAL" | "DOCUMENTED" | "VERIFIED" | "BLOCKED" | "UNKNOWN";
  authority_source_reference_id?: string | null;
  limitations?: readonly string[];
};

export type ReviewGateRecord = {
  commercial_product_gate_id: string;
  commercial_product_id: string;
  gate_type: ReviewGateType;
  status: ReviewGateStatus;
  authority?: string | null;
  reference?: string | null;
  reason?: string | null;
  reviewed_at?: Date | string | null;
  expires_at?: Date | string | null;
  stale_after?: Date | string | null;
};

export type ProductRelationshipRecord = {
  relationship_id: string;
  source_product_id: string;
  target_product_id: string;
  relationship_type: ProductRelationshipType;
  direction: RelationshipDirection;
  status?: RelationshipStatus;
  effective_from?: Date | string | null;
  effective_to?: Date | string | null;
  source_authority_reference_id?: string | null;
  provenance?: readonly string[];
};

export type FundingRelationshipRecord = {
  commercial_product_funding_id: string;
  commercial_product_id: string;
  funding_relationship_status: FundingRelationshipStatus;
  funding_category: FundingCategory;
  authority_source_reference_id?: string | null;
  limitations?: readonly string[];
  provenance?: readonly string[];
};

export type EntitlementRecord = {
  commercial_product_entitlement_id: string;
  commercial_product_id: string;
  entitlement_id: string;
  entitlement_requirement: "REQUIRED" | "OPTIONAL";
  entitlement_authority?: string | null;
  entitlement_status_reference?: string | null;
};

export type RegulatedProgramRecord = {
  commercial_product_id: string;
  program_types?: readonly RegulatedProgramType[];
  regulatory_authority?: string | null;
  external_training_authority_required?: GovernedDecisionStatus;
  credential_authority?: string | null;
  partner_required?: boolean;
  scope_limitations?: readonly string[];
  sales_language_restrictions?: readonly string[];
};

export type ImplementationSupportRecord = {
  commercial_product_id: string;
  implementation_required?: GovernedDecisionStatus;
  implementation_tier?: ImplementationTier;
  implementation_owner?: string | null;
  support_required?: GovernedDecisionStatus;
  support_tier?: SupportTier;
  managed_service_available?: GovernedDecisionStatus;
  sla_status?: GovernedDecisionStatus;
  training_required?: GovernedDecisionStatus;
  professional_development_available?: GovernedDecisionStatus;
};

export type RenewalExpansionRecord = {
  commercial_product_id: string;
  renewal_model?: RenewalModel;
  renewal_term?: string | null;
  renewal_window?: string | null;
  expansion_paths?: readonly string[];
  upsell_paths?: readonly string[];
  cross_sell_paths?: readonly string[];
};

export type SocialSellingRecord = {
  commercial_product_id: string;
  approved_public_marketing?: GovernedDecisionStatus;
  approved_social_sharing?: GovernedDecisionStatus;
  social_campaign_tags?: readonly string[];
  approved_talking_points_reference?: string | null;
  sales_language_status?: SalesLanguageStatus;
  brand_restrictions?: readonly string[];
};

export type GovernanceStateRecord = {
  commercial_product_id: string;
  pricing_status?: PricingStatus;
  pricing_model?: string | null;
  pricing_authority?: string | null;
  pricing_reference?: string | null;
  price_effective_from?: Date | string | null;
  price_effective_to?: Date | string | null;
  currency?: string | null;
  discount_policy_reference?: string | null;
  margin_status?: MarginStatus;
  cost_model_reference?: string | null;
  gross_margin_class?: string | null;
  minimum_margin_policy?: string | null;
  commercial_viability_status?: CommercialViabilityStatus;
  commission_eligible_status?: CommissionEligibilityStatus;
  commission_policy_reference?: string | null;
  leadership_override_eligible?: GovernedDecisionStatus;
  renewal_commission_eligible?: GovernedDecisionStatus;
  expansion_commission_eligible?: GovernedDecisionStatus;
  revenue_classifications?: readonly RevenueClassification[];
};

export type ProductRegistryExecutor = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount?: number }>;
};

export interface CommercialProductRegistryRepository {
  createProduct(input: CommercialProductCore, executor?: ProductRegistryExecutor): Promise<any>;
  getProductById(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any | null>;
  getProductBySlug(slug: string, executor?: ProductRegistryExecutor): Promise<any | null>;
  listProducts(filters?: ProductRegistryListFilters, executor?: ProductRegistryExecutor): Promise<any[]>;
  updateDescriptiveMetadata(commercialProductId: string, input: CommercialProductMetadataUpdate, executor?: ProductRegistryExecutor): Promise<any | null>;
  updateLifecycle(commercialProductId: string, lifecycleState: ProductLifecycleState, actorId?: string | null, executor?: ProductRegistryExecutor): Promise<any | null>;
  updateReadiness(commercialProductId: string, readiness: ReadinessState, reason: string, authority?: string | null, evidenceReferences?: unknown, staleAfter?: Date | string | null, executor?: ProductRegistryExecutor): Promise<any | null>;
  updateSellability(commercialProductId: string, sellability: SellabilityStatus, reason: string, authority?: string | null, blockers?: readonly string[], restrictions?: readonly string[], effectiveFrom?: Date | string | null, effectiveTo?: Date | string | null, staleAfter?: Date | string | null, sourceAuthorityReferenceId?: string | null, executor?: ProductRegistryExecutor): Promise<any | null>;
  listSourceAuthorities(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
  addSourceAuthority(input: SourceAuthorityRecord, executor?: ProductRegistryExecutor): Promise<any>;
  replaceSourceAuthority(input: SourceAuthorityRecord, executor?: ProductRegistryExecutor): Promise<any>;
  deactivateSourceAuthority(sourceReferenceId: string, status: SourceAuthorityStatus, executor?: ProductRegistryExecutor): Promise<any | null>;
  listBuyers(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
  addBuyerCompatibility(input: BuyerCompatibilityRecord, executor?: ProductRegistryExecutor): Promise<any>;
  removeBuyerCompatibility(commercialProductId: string, buyerType: BuyerType, executor?: ProductRegistryExecutor): Promise<any | null>;
  listCommercialForms(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
  addCommercialForm(input: CommercialFormRecord, executor?: ProductRegistryExecutor): Promise<any>;
  removeCommercialForm(commercialProductId: string, commercialForm: CommercialForm, executor?: ProductRegistryExecutor): Promise<any | null>;
  listGates(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
  addReviewGate(input: ReviewGateRecord, executor?: ProductRegistryExecutor): Promise<any>;
  listRelationships(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
  addProductRelationship(input: ProductRelationshipRecord, executor?: ProductRegistryExecutor): Promise<any>;
  deactivateProductRelationship(relationshipId: string, executor?: ProductRegistryExecutor): Promise<any | null>;
  listFundingRelationships(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
  addFundingRelationship(input: FundingRelationshipRecord, executor?: ProductRegistryExecutor): Promise<any>;
  listEntitlements(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
  addEntitlementReference(input: EntitlementRecord, executor?: ProductRegistryExecutor): Promise<any>;
  removeEntitlementReference(commercialProductId: string, entitlementId: string, requirement: "REQUIRED" | "OPTIONAL", executor?: ProductRegistryExecutor): Promise<any | null>;
  getRegulatedProgramMetadata(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any | null>;
  upsertRegulatedProgramMetadata(input: RegulatedProgramRecord, executor?: ProductRegistryExecutor): Promise<any>;
  getImplementationSupport(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any | null>;
  upsertImplementationSupport(input: ImplementationSupportRecord, executor?: ProductRegistryExecutor): Promise<any>;
  getRenewalExpansion(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any | null>;
  upsertRenewalExpansion(input: RenewalExpansionRecord, executor?: ProductRegistryExecutor): Promise<any>;
  getSocialSelling(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any | null>;
  upsertSocialSelling(input: SocialSellingRecord, executor?: ProductRegistryExecutor): Promise<any>;
  getGovernanceState(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any | null>;
  upsertGovernanceState(input: GovernanceStateRecord, executor?: ProductRegistryExecutor): Promise<any>;
}
