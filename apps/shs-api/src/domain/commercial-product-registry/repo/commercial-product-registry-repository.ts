import type {
  BuyerType,
  CommercialFamily,
  CommercialForm,
  CommercialProductType,
  EntityClassification,
  ProductIdentityStatus,
  ProductLifecycleState,
  ProductRelationshipType,
  ReadinessState,
  RelationshipDirection,
  RelationshipStatus,
  ReviewGateStatus,
  ReviewGateType,
  SellabilityStatus,
  SourceAuthorityStatus,
  SourceAuthorityType,
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
  sellability?: SellabilityStatus;
  sellability_reason?: string | null;
  sellability_authority?: string | null;
  selling_entity?: EntityClassification;
  delivery_entity?: EntityClassification;
  partner_required?: boolean;
  partner_type?: string | null;
  joint_structure_required?: boolean;
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
  updateReadiness(commercialProductId: string, readiness: ReadinessState, reason: string, authority?: string | null, executor?: ProductRegistryExecutor): Promise<any | null>;
  updateSellability(commercialProductId: string, sellability: SellabilityStatus, reason: string, authority?: string | null, executor?: ProductRegistryExecutor): Promise<any | null>;
  listSourceAuthorities(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
  addSourceAuthority(input: SourceAuthorityRecord, executor?: ProductRegistryExecutor): Promise<any>;
  replaceSourceAuthority(input: SourceAuthorityRecord, executor?: ProductRegistryExecutor): Promise<any>;
  listBuyers(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
  addBuyerCompatibility(input: BuyerCompatibilityRecord, executor?: ProductRegistryExecutor): Promise<any>;
  listCommercialForms(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
  addCommercialForm(input: CommercialFormRecord, executor?: ProductRegistryExecutor): Promise<any>;
  listGates(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
  addReviewGate(input: ReviewGateRecord, executor?: ProductRegistryExecutor): Promise<any>;
  listRelationships(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
  addProductRelationship(input: ProductRelationshipRecord, executor?: ProductRegistryExecutor): Promise<any>;
  listFundingRelationships(commercialProductId: string, executor?: ProductRegistryExecutor): Promise<any[]>;
}
