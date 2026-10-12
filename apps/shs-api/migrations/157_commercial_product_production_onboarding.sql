-- 4I: explicit production onboarding lineage.
-- This records candidate-to-canonical-product registration authorization and
-- eligibility snapshots. Human review/source decisions remain in their
-- append-only 4C tables; product state remains in the canonical registry.

CREATE TABLE IF NOT EXISTS commercial_product_production_onboardings (
  onboarding_id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL CHECK (candidate_id ~ '^cc-[0-9]{3}$'),
  commercial_product_id TEXT NOT NULL REFERENCES commercial_products(commercial_product_id) ON DELETE RESTRICT,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  operator_user_id TEXT NOT NULL REFERENCES users(user_id),
  source_resolution_id TEXT NOT NULL REFERENCES commercial_product_source_resolutions(source_resolution_id),
  source_resolution_version INTEGER NOT NULL CHECK (source_resolution_version > 0),
  review_decision_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  eligibility_snapshot JSONB NOT NULL,
  lineage_snapshot JSONB NOT NULL,
  lifecycle_state TEXT NOT NULL,
  readiness TEXT NOT NULL,
  sellability TEXT NOT NULL,
  onboarding_status TEXT NOT NULL DEFAULT 'REGISTERED',
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_production_onboardings_status CHECK (onboarding_status IN ('REGISTERED','ALREADY_REGISTERED')),
  CONSTRAINT commercial_product_production_onboardings_decision_refs_array CHECK (jsonb_typeof(review_decision_refs) = 'array'),
  CONSTRAINT commercial_product_production_onboardings_lineage_object CHECK (jsonb_typeof(lineage_snapshot) = 'object'),
  CONSTRAINT commercial_product_production_onboardings_eligibility_object CHECK (jsonb_typeof(eligibility_snapshot) = 'object'),
  CONSTRAINT commercial_product_production_onboardings_lifecycle_known CHECK (lifecycle_state IN ('DISCOVERED','DEFINED','REVIEW','PILOT_READY','PILOT_ACTIVE','SALES_READY','ACTIVE','SUSPENDED','SUNSET','RETIRED')),
  CONSTRAINT commercial_product_production_onboardings_readiness_known CHECK (readiness IN ('RED','YELLOW','GREEN','BLUE','UNKNOWN')),
  CONSTRAINT commercial_product_production_onboardings_sellability_known CHECK (sellability IN ('SELL_NOW','PILOT','DEVELOP','NOT_SELLABLE','NEEDS_REVIEW'))
);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_product_production_onboardings_candidate_uq
  ON commercial_product_production_onboardings(candidate_id);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_product_production_onboardings_product_uq
  ON commercial_product_production_onboardings(commercial_product_id);

CREATE INDEX IF NOT EXISTS commercial_product_production_onboardings_org_idx
  ON commercial_product_production_onboardings(organization_id, authorized_at DESC);
