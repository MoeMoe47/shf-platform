-- Trusted cross-product composition definitions. Source facts remain owned by
-- their product adapters; these records never grant direct table access.
CREATE TABLE IF NOT EXISTS cross_product_composition_definitions (
  definition_id TEXT PRIMARY KEY,
  definition_key TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
  report_family TEXT NOT NULL,
  sources_json JSONB NOT NULL,
  subject_policy TEXT NOT NULL,
  classification_policy TEXT NOT NULL,
  period_policy TEXT NOT NULL,
  provenance_policy TEXT NOT NULL,
  definition_hash TEXT NOT NULL CHECK (definition_hash ~ '^[0-9a-f]{64}$'),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  activated_by_user_id TEXT REFERENCES users(user_id),
  retired_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  UNIQUE (organization_id, tenant_id, definition_key, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS cross_product_active_definition_idx
  ON cross_product_composition_definitions (organization_id, tenant_id, definition_key)
  WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS cross_product_definition_scope_idx
  ON cross_product_composition_definitions (organization_id, tenant_id, status, definition_key);
