-- 153_commercial_product_registry_foundation.sql
-- SHU-COMMERCIAL-PRODUCT-REGISTRY-3B: durable Product Registry persistence.
-- The registry owns commercial product representation only. It references
-- organizations, source authorities, entitlements, funding, pricing, evidence,
-- credentials, contracts, and delivery systems without becoming their authority.

CREATE TABLE IF NOT EXISTS commercial_products (
  commercial_product_id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  commercial_family TEXT NOT NULL,
  subfamily TEXT,
  product_type TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  lifecycle_state TEXT NOT NULL DEFAULT 'DISCOVERED',
  readiness TEXT NOT NULL DEFAULT 'UNKNOWN',
  readiness_reason TEXT,
  readiness_authority TEXT,
  readiness_evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  readiness_evaluated_at TIMESTAMP,
  readiness_stale_after TIMESTAMP,
  readiness_effective_from TIMESTAMP,
  readiness_effective_to TIMESTAMP,
  sellability TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  sellability_reason TEXT,
  sellability_authority TEXT,
  sellability_source_authority_id TEXT,
  sellability_blockers JSONB NOT NULL DEFAULT '[]'::jsonb,
  sellability_restrictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  sellability_evaluated_at TIMESTAMP,
  sellability_stale_after TIMESTAMP,
  sellability_effective_from TIMESTAMP,
  sellability_effective_to TIMESTAMP,
  selling_entity TEXT NOT NULL DEFAULT 'UNKNOWN',
  delivery_entity TEXT NOT NULL DEFAULT 'UNKNOWN',
  partner_required BOOLEAN NOT NULL DEFAULT FALSE,
  partner_type TEXT,
  joint_structure_required BOOLEAN NOT NULL DEFAULT FALSE,
  entity_review_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  pricing_status TEXT NOT NULL DEFAULT 'NOT_DEFINED',
  margin_status TEXT NOT NULL DEFAULT 'NOT_DEFINED',
  commission_eligible_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  renewal_model TEXT NOT NULL DEFAULT 'UNKNOWN',
  last_verified_at TIMESTAMP,
  created_by TEXT REFERENCES users(user_id),
  updated_by TEXT REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMP,
  CONSTRAINT commercial_products_id_format CHECK (commercial_product_id LIKE 'cp_%'),
  CONSTRAINT commercial_products_canonical_name_present CHECK (length(trim(canonical_name)) > 0),
  CONSTRAINT commercial_products_display_name_present CHECK (length(trim(display_name)) > 0),
  CONSTRAINT commercial_products_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT commercial_products_version_positive CHECK (version >= 1),
  CONSTRAINT commercial_products_family_known CHECK (commercial_family IN ('CORE_EDUCATION','CAREER_WORKFORCE','DATA_CENTER','HEALTHCARE_WORKFORCE','FIRE_PUBLIC_SAFETY','INFRASTRUCTURE_WORKFORCE','LOGISTICS_SUPPLY_CHAIN','APPRENTICESHIP_WBL','AVIATION','CREATOR_MEDIA_SHNN','LEARNING_GAMING','METAVERSE','CIVIC_FINANCIAL_CAPABILITY','INSTITUTIONAL_TECH_SHS','ASSURANCE_VERIFICATION_REPORTING')),
  CONSTRAINT commercial_products_type_known CHECK (product_type IN ('LICENSE','SERVICE','PROGRAM','SPONSORSHIP','ASSESSMENT','MANAGED_SERVICE','IMPLEMENTATION_PACKAGE','CONTENT_LICENSE','PROFESSIONAL_SERVICE','UNKNOWN')),
  CONSTRAINT commercial_products_status_known CHECK (status IN ('ACTIVE','SUSPENDED','SUNSET','RETIRED')),
  CONSTRAINT commercial_products_lifecycle_known CHECK (lifecycle_state IN ('DISCOVERED','DEFINED','REVIEW','PILOT_READY','PILOT_ACTIVE','SALES_READY','ACTIVE','SUSPENDED','SUNSET','RETIRED')),
  CONSTRAINT commercial_products_readiness_known CHECK (readiness IN ('RED','YELLOW','GREEN','BLUE','UNKNOWN')),
  CONSTRAINT commercial_products_sellability_known CHECK (sellability IN ('SELL_NOW','PILOT','DEVELOP','NOT_SELLABLE','NEEDS_REVIEW')),
  CONSTRAINT commercial_products_entity_known CHECK (selling_entity IN ('SHF','SHS','PARTNER','JOINT_STRUCTURE_REVIEW_REQUIRED','UNKNOWN') AND delivery_entity IN ('SHF','SHS','PARTNER','JOINT_STRUCTURE_REVIEW_REQUIRED','UNKNOWN')),
  CONSTRAINT commercial_products_pricing_status_known CHECK (pricing_status IN ('NOT_DEFINED','DRAFT','UNDER_REVIEW','APPROVED','ACTIVE','EXPIRED','BLOCKED')),
  CONSTRAINT commercial_products_margin_status_known CHECK (margin_status IN ('NOT_DEFINED','DRAFT','UNDER_REVIEW','APPROVED','ACTIVE','BLOCKED','UNKNOWN')),
  CONSTRAINT commercial_products_commission_status_known CHECK (commission_eligible_status IN ('NOT_ELIGIBLE','ELIGIBLE_AFTER_APPROVAL','UNDER_REVIEW','APPROVED','BLOCKED','UNKNOWN')),
  CONSTRAINT commercial_products_renewal_model_known CHECK (renewal_model IN ('NONE','MANUAL','ANNUAL','MULTI_YEAR','EVERGREEN','PROJECT_BASED','UNKNOWN')),
  CONSTRAINT commercial_products_readiness_effective_range CHECK (readiness_effective_to IS NULL OR readiness_effective_from IS NULL OR readiness_effective_to >= readiness_effective_from),
  CONSTRAINT commercial_products_sellability_effective_range CHECK (sellability_effective_to IS NULL OR sellability_effective_from IS NULL OR sellability_effective_to >= sellability_effective_from),
  CONSTRAINT commercial_products_no_price_payload CHECK (
    NOT (
      readiness_evidence_references ? 'price' OR
      sellability_blockers ? 'priceAmount' OR
      sellability_restrictions ? 'commissionRate'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_products_canonical_name_active_uq
  ON commercial_products(lower(canonical_name))
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS commercial_products_slug_active_uq
  ON commercial_products(slug)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS commercial_products_family_idx
  ON commercial_products(commercial_family)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS commercial_products_readiness_idx
  ON commercial_products(readiness)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS commercial_products_sellability_idx
  ON commercial_products(sellability)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS commercial_products_status_lifecycle_idx
  ON commercial_products(status, lifecycle_state)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS commercial_products_entity_idx
  ON commercial_products(selling_entity, delivery_entity)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS commercial_products_last_verified_idx
  ON commercial_products(last_verified_at)
  WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS commercial_product_source_authorities (
  source_reference_id TEXT PRIMARY KEY,
  commercial_product_id TEXT NOT NULL REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  source_authority_type TEXT NOT NULL,
  source_authority_id TEXT,
  source_domain TEXT,
  source_record_id TEXT NOT NULL,
  source_version TEXT,
  source_status TEXT NOT NULL,
  source_last_verified_at TIMESTAMP,
  source_provenance JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_source_authority_type_known CHECK (source_authority_type IN ('PROGRAM_REGISTRY','CURRICULUM','CAREER_REGISTRY','SERVICE_CATALOG','ENTITLEMENTS','FUNDING','EVIDENCE','TRUTH_SPINE','ORACLE','REPORTING','CONTRACTS','DELIVERY','CREDENTIALS','OTHER_GOVERNED_AUTHORITY')),
  CONSTRAINT commercial_product_source_status_known CHECK (source_status IN ('FOUND','PARTIAL','PLANNED','NOT_FOUND','UNKNOWN','STALE','BLOCKED')),
  CONSTRAINT commercial_product_source_record_present CHECK (length(trim(source_record_id)) > 0),
  CONSTRAINT commercial_product_source_provenance_array CHECK (jsonb_typeof(source_provenance) = 'array')
);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_product_source_authorities_uq
  ON commercial_product_source_authorities(commercial_product_id, source_authority_type, COALESCE(source_domain, ''), source_record_id, COALESCE(source_version, ''));

CREATE INDEX IF NOT EXISTS commercial_product_source_authorities_lookup_idx
  ON commercial_product_source_authorities(source_authority_type, source_domain, source_record_id);

CREATE TABLE IF NOT EXISTS commercial_product_buyers (
  commercial_product_buyer_id TEXT PRIMARY KEY,
  commercial_product_id TEXT NOT NULL REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  buyer_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  authority_source_reference_id TEXT REFERENCES commercial_product_source_authorities(source_reference_id),
  limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_buyers_type_known CHECK (buyer_type IN ('K12_SCHOOL','SCHOOL_DISTRICT','CHARTER_SCHOOL','PRIVATE_SCHOOL','COLLEGE','UNIVERSITY','CAREER_TECH','WORKFORCE_BOARD','AMERICAN_JOB_CENTER','MUNICIPALITY','COUNTY','STATE_AGENCY','NONPROFIT','YOUTH_PROGRAM','AFTER_SCHOOL_PROVIDER','SUMMER_PROGRAM','LIBRARY','EMPLOYER','DATA_CENTER_OPERATOR','HEALTHCARE_EMPLOYER','HOSPITAL','NURSING_FACILITY','FIRE_DEPARTMENT','PUBLIC_SAFETY_AGENCY','UTILITY','CONTRACTOR','LOGISTICS_EMPLOYER','UNION','APPRENTICESHIP_SPONSOR','BANK','CREDIT_UNION','FOUNDATION','PHILANTHROPY','COMMUNITY_ORGANIZATION','TRAINING_PROVIDER','ENTERPRISE')),
  CONSTRAINT commercial_product_buyers_status_known CHECK (status IN ('POTENTIAL','DOCUMENTED','VERIFIED','BLOCKED','UNKNOWN')),
  CONSTRAINT commercial_product_buyers_limitations_array CHECK (jsonb_typeof(limitations) = 'array')
);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_product_buyers_product_type_uq
  ON commercial_product_buyers(commercial_product_id, buyer_type);

CREATE INDEX IF NOT EXISTS commercial_product_buyers_type_idx
  ON commercial_product_buyers(buyer_type, status);

CREATE TABLE IF NOT EXISTS commercial_product_forms (
  commercial_product_form_id TEXT PRIMARY KEY,
  commercial_product_id TEXT NOT NULL REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  commercial_form TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  authority_source_reference_id TEXT REFERENCES commercial_product_source_authorities(source_reference_id),
  limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_forms_form_known CHECK (commercial_form IN ('PER_STUDENT_LICENSE','PER_COHORT_LICENSE','PER_SITE_LICENSE','PER_INSTITUTION_LICENSE','ANNUAL_LICENSE','SUBSCRIPTION','IMPLEMENTATION_FEE','PROFESSIONAL_SERVICE','MANAGED_SERVICE','ASSESSMENT','CUSTOM_DEVELOPMENT','SPONSORSHIP','TRAINING','SUPPORT','USAGE_BASED','ENTERPRISE_CONTRACT','PARTNER_DELIVERED','GRANT_SUPPORTED','EMPLOYER_SUPPORTED')),
  CONSTRAINT commercial_product_forms_status_known CHECK (status IN ('POTENTIAL','DOCUMENTED','VERIFIED','BLOCKED','UNKNOWN')),
  CONSTRAINT commercial_product_forms_no_prices CHECK (limitations::text !~* '(price|amount|rate|fee_amount)'),
  CONSTRAINT commercial_product_forms_limitations_array CHECK (jsonb_typeof(limitations) = 'array')
);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_product_forms_product_form_uq
  ON commercial_product_forms(commercial_product_id, commercial_form);

CREATE TABLE IF NOT EXISTS commercial_product_review_gates (
  commercial_product_gate_id TEXT PRIMARY KEY,
  commercial_product_id TEXT NOT NULL REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  gate_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  authority TEXT,
  reference TEXT,
  reason TEXT,
  reviewed_at TIMESTAMP,
  expires_at TIMESTAMP,
  stale_after TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_gate_type_known CHECK (gate_type IN ('COMMERCIAL_READINESS','LEGAL','TAX','REGULATORY','PROCUREMENT','FUNDING','DELIVERY_CAPACITY','EVIDENCE','SUPPORT','PRICING','MARGIN','ENTITLEMENT','PARTNER')),
  CONSTRAINT commercial_product_gate_status_known CHECK (status IN ('NOT_REQUIRED','PENDING','APPROVED','BLOCKED','STALE','UNKNOWN')),
  CONSTRAINT commercial_product_gate_approved_authority CHECK (status <> 'APPROVED' OR authority IS NOT NULL OR reference IS NOT NULL),
  CONSTRAINT commercial_product_gate_expiry_range CHECK (expires_at IS NULL OR reviewed_at IS NULL OR expires_at >= reviewed_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_product_review_gates_product_type_uq
  ON commercial_product_review_gates(commercial_product_id, gate_type);

CREATE INDEX IF NOT EXISTS commercial_product_review_gates_status_idx
  ON commercial_product_review_gates(status, gate_type);

CREATE TABLE IF NOT EXISTS commercial_product_funding_relationships (
  commercial_product_funding_id TEXT PRIMARY KEY,
  commercial_product_id TEXT NOT NULL REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  funding_relationship_status TEXT NOT NULL,
  funding_category TEXT NOT NULL,
  authority_source_reference_id TEXT REFERENCES commercial_product_source_authorities(source_reference_id),
  limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  provenance JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_funding_status_known CHECK (funding_relationship_status IN ('POTENTIAL','DOCUMENTED','VERIFIED','NOT_FOUND','REVIEW_REQUIRED')),
  CONSTRAINT commercial_product_funding_category_known CHECK (funding_category IN ('GRANT','WORKFORCE_FUNDING','EMPLOYER_CONTRIBUTION','APPRENTICESHIP_FUNDING','UNION_PARTNERSHIP','PHILANTHROPY','SPONSORSHIP','INSTITUTIONAL_PURCHASING','SHS_COMMERCIAL_REVENUE')),
  CONSTRAINT commercial_product_funding_no_eligibility CHECK (
    limitations::text !~* '(eligib|qualified|approved_applicant)' AND
    provenance::text !~* '(eligib|qualified|approved_applicant)'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_product_funding_product_category_uq
  ON commercial_product_funding_relationships(commercial_product_id, funding_category);

CREATE TABLE IF NOT EXISTS commercial_product_entitlements (
  commercial_product_entitlement_id TEXT PRIMARY KEY,
  commercial_product_id TEXT NOT NULL REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  entitlement_id TEXT NOT NULL,
  entitlement_requirement TEXT NOT NULL,
  entitlement_authority TEXT,
  entitlement_status_reference TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_entitlement_requirement_known CHECK (entitlement_requirement IN ('REQUIRED','OPTIONAL')),
  CONSTRAINT commercial_product_entitlement_id_present CHECK (length(trim(entitlement_id)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_product_entitlements_product_requirement_uq
  ON commercial_product_entitlements(commercial_product_id, entitlement_requirement, entitlement_id);

CREATE TABLE IF NOT EXISTS commercial_product_relationships (
  relationship_id TEXT PRIMARY KEY,
  source_product_id TEXT NOT NULL REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  target_product_id TEXT NOT NULL REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  effective_from TIMESTAMP,
  effective_to TIMESTAMP,
  source_authority_reference_id TEXT REFERENCES commercial_product_source_authorities(source_reference_id),
  provenance JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_relationship_type_known CHECK (relationship_type IN ('STANDALONE_PRODUCT','BASE_PRODUCT','ADD_ON','BUNDLE_COMPONENT','PREREQUISITE','OPTIONAL_MODULE','UPSELL','CROSS_SELL','RENEWAL','EXPANSION','SPONSORSHIP_ASSOCIATION','PARTNER_REQUIRED','FUNDING_SUPPORTED','REPLACES','SUPERSEDES')),
  CONSTRAINT commercial_product_relationship_direction_known CHECK (direction IN ('SELF','SOURCE_TO_TARGET','TARGET_TO_SOURCE')),
  CONSTRAINT commercial_product_relationship_status_known CHECK (status IN ('DRAFT','ACTIVE','STALE','RETIRED','BLOCKED','UNKNOWN')),
  CONSTRAINT commercial_product_relationship_self_only_standalone CHECK (
    (source_product_id <> target_product_id AND relationship_type <> 'STANDALONE_PRODUCT' AND direction <> 'SELF') OR
    (source_product_id = target_product_id AND relationship_type = 'STANDALONE_PRODUCT' AND direction = 'SELF')
  ),
  CONSTRAINT commercial_product_relationship_effective_range CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from),
  CONSTRAINT commercial_product_relationship_provenance_array CHECK (jsonb_typeof(provenance) = 'array')
);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_product_relationships_direct_uq
  ON commercial_product_relationships(source_product_id, target_product_id, relationship_type, direction)
  WHERE status <> 'RETIRED';

CREATE UNIQUE INDEX IF NOT EXISTS commercial_product_relationships_reverse_replaces_uq
  ON commercial_product_relationships(
    LEAST(source_product_id, target_product_id),
    GREATEST(source_product_id, target_product_id),
    relationship_type
  )
  WHERE relationship_type IN ('REPLACES','SUPERSEDES') AND status <> 'RETIRED';

CREATE INDEX IF NOT EXISTS commercial_product_relationships_source_idx
  ON commercial_product_relationships(source_product_id, relationship_type, status);

CREATE INDEX IF NOT EXISTS commercial_product_relationships_target_idx
  ON commercial_product_relationships(target_product_id, relationship_type, status);

CREATE TABLE IF NOT EXISTS commercial_product_regulatory_metadata (
  commercial_product_id TEXT PRIMARY KEY REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  program_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  regulatory_authority TEXT,
  external_training_authority_required TEXT NOT NULL DEFAULT 'UNKNOWN',
  credential_authority TEXT,
  partner_required BOOLEAN NOT NULL DEFAULT FALSE,
  scope_limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  sales_language_restrictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_regulatory_training_status_known CHECK (external_training_authority_required IN ('NOT_DEFINED','NOT_REQUIRED','PENDING','APPROVED','BLOCKED','UNKNOWN')),
  CONSTRAINT commercial_product_regulatory_arrays CHECK (jsonb_typeof(program_types) = 'array' AND jsonb_typeof(scope_limitations) = 'array' AND jsonb_typeof(sales_language_restrictions) = 'array')
);

CREATE TABLE IF NOT EXISTS commercial_product_implementation_support (
  commercial_product_id TEXT PRIMARY KEY REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  implementation_required TEXT NOT NULL DEFAULT 'UNKNOWN',
  implementation_tier TEXT NOT NULL DEFAULT 'UNKNOWN',
  implementation_owner TEXT,
  support_required TEXT NOT NULL DEFAULT 'UNKNOWN',
  support_tier TEXT NOT NULL DEFAULT 'UNKNOWN',
  managed_service_available TEXT NOT NULL DEFAULT 'UNKNOWN',
  sla_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  training_required TEXT NOT NULL DEFAULT 'UNKNOWN',
  professional_development_available TEXT NOT NULL DEFAULT 'UNKNOWN',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_implementation_decisions_known CHECK (
    implementation_required IN ('NOT_DEFINED','NOT_REQUIRED','PENDING','APPROVED','BLOCKED','UNKNOWN') AND
    support_required IN ('NOT_DEFINED','NOT_REQUIRED','PENDING','APPROVED','BLOCKED','UNKNOWN') AND
    managed_service_available IN ('NOT_DEFINED','NOT_REQUIRED','PENDING','APPROVED','BLOCKED','UNKNOWN') AND
    sla_status IN ('NOT_DEFINED','NOT_REQUIRED','PENDING','APPROVED','BLOCKED','UNKNOWN') AND
    training_required IN ('NOT_DEFINED','NOT_REQUIRED','PENDING','APPROVED','BLOCKED','UNKNOWN') AND
    professional_development_available IN ('NOT_DEFINED','NOT_REQUIRED','PENDING','APPROVED','BLOCKED','UNKNOWN')
  ),
  CONSTRAINT commercial_product_implementation_tiers_known CHECK (
    implementation_tier IN ('NONE','LIGHT','STANDARD','COMPLEX','CUSTOM','UNKNOWN') AND
    support_tier IN ('NONE','BASIC','STANDARD','ENHANCED','ENTERPRISE','UNKNOWN')
  )
);

CREATE TABLE IF NOT EXISTS commercial_product_renewal_expansion (
  commercial_product_id TEXT PRIMARY KEY REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  renewal_model TEXT NOT NULL DEFAULT 'UNKNOWN',
  renewal_term TEXT,
  renewal_window TEXT,
  expansion_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  upsell_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  cross_sell_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_renewal_model_known CHECK (renewal_model IN ('NONE','MANUAL','ANNUAL','MULTI_YEAR','EVERGREEN','PROJECT_BASED','UNKNOWN')),
  CONSTRAINT commercial_product_renewal_arrays CHECK (jsonb_typeof(expansion_paths) = 'array' AND jsonb_typeof(upsell_paths) = 'array' AND jsonb_typeof(cross_sell_paths) = 'array')
);

CREATE TABLE IF NOT EXISTS commercial_product_social_selling (
  commercial_product_id TEXT PRIMARY KEY REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  approved_public_marketing TEXT NOT NULL DEFAULT 'UNKNOWN',
  approved_social_sharing TEXT NOT NULL DEFAULT 'UNKNOWN',
  social_campaign_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_talking_points_reference TEXT,
  sales_language_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  brand_restrictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_social_decisions_known CHECK (
    approved_public_marketing IN ('NOT_DEFINED','NOT_REQUIRED','PENDING','APPROVED','BLOCKED','UNKNOWN') AND
    approved_social_sharing IN ('NOT_DEFINED','NOT_REQUIRED','PENDING','APPROVED','BLOCKED','UNKNOWN')
  ),
  CONSTRAINT commercial_product_social_language_status_known CHECK (sales_language_status IN ('NOT_DEFINED','DRAFT','APPROVED_INTERNAL_ONLY','APPROVED_PUBLIC','RESTRICTED','BLOCKED','UNKNOWN')),
  CONSTRAINT commercial_product_social_arrays CHECK (jsonb_typeof(social_campaign_tags) = 'array' AND jsonb_typeof(brand_restrictions) = 'array')
);

CREATE TABLE IF NOT EXISTS commercial_product_governance_state (
  commercial_product_id TEXT PRIMARY KEY REFERENCES commercial_products(commercial_product_id) ON DELETE CASCADE,
  pricing_model TEXT,
  pricing_authority TEXT,
  pricing_reference TEXT,
  price_effective_from DATE,
  price_effective_to DATE,
  currency TEXT,
  discount_policy_reference TEXT,
  cost_model_reference TEXT,
  gross_margin_class TEXT,
  minimum_margin_policy TEXT,
  commercial_viability_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  commission_policy_reference TEXT,
  leadership_override_eligible TEXT NOT NULL DEFAULT 'UNKNOWN',
  renewal_commission_eligible TEXT NOT NULL DEFAULT 'UNKNOWN',
  expansion_commission_eligible TEXT NOT NULL DEFAULT 'UNKNOWN',
  revenue_classifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_governance_price_range CHECK (price_effective_to IS NULL OR price_effective_from IS NULL OR price_effective_to >= price_effective_from),
  CONSTRAINT commercial_product_governance_currency_metadata CHECK (currency IS NULL OR currency IN ('USD')),
  CONSTRAINT commercial_product_governance_viability_known CHECK (commercial_viability_status IN ('UNKNOWN','NEEDS_REVIEW','VIABLE','CONDITIONALLY_VIABLE','NOT_VIABLE','BLOCKED')),
  CONSTRAINT commercial_product_governance_decisions_known CHECK (
    leadership_override_eligible IN ('NOT_DEFINED','NOT_REQUIRED','PENDING','APPROVED','BLOCKED','UNKNOWN') AND
    renewal_commission_eligible IN ('NOT_DEFINED','NOT_REQUIRED','PENDING','APPROVED','BLOCKED','UNKNOWN') AND
    expansion_commission_eligible IN ('NOT_DEFINED','NOT_REQUIRED','PENDING','APPROVED','BLOCKED','UNKNOWN')
  ),
  CONSTRAINT commercial_product_governance_revenue_array CHECK (jsonb_typeof(revenue_classifications) = 'array'),
  CONSTRAINT commercial_product_governance_not_financial_truth CHECK (
    revenue_classifications::text !~ '(BOOKED_REVENUE|COLLECTED_REVENUE|PIPELINE_REVENUE)' AND
    revenue_classifications::text !~ '(RECRUITING|RECRUITMENT)' AND
    COALESCE(pricing_model, '') !~* '(price_amount|unit_price|computed_price)' AND
    COALESCE(commission_policy_reference, '') !~* '(commission_amount|commission_rate|calculated)'
  )
);
