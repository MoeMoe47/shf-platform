-- Canonical generated report artifact metadata. Distribution and publication
-- are intentionally outside this authority slice.
CREATE TABLE IF NOT EXISTS report_artifacts (
  artifact_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  composition_type TEXT NOT NULL,
  composition_version INTEGER NOT NULL CHECK (composition_version > 0),
  classification TEXT NOT NULL CHECK (classification IN ('INTERNAL', 'RESTRICTED_EXTERNAL', 'PUBLIC')),
  canonical_input_manifest JSONB NOT NULL,
  artifact_version INTEGER NOT NULL DEFAULT 1 CHECK (artifact_version > 0),
  lifecycle_status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (lifecycle_status IN ('GENERATED')),
  content_hash TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (jsonb_typeof(canonical_input_manifest) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_report_artifacts_scope
  ON report_artifacts (tenant_id, organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_artifacts_classification
  ON report_artifacts (tenant_id, organization_id, classification, created_at DESC);
