-- Versioned privacy policy authority. Policy definitions are governance data,
-- never executable code; approval is separate from report disclosure review.
CREATE TABLE IF NOT EXISTS report_public_disclosure_policies (
  policy_id TEXT PRIMARY KEY,
  policy_key TEXT NOT NULL,
  policy_version INTEGER NOT NULL CHECK (policy_version > 0),
  report_id TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'RETIRED')),
  policy_type TEXT NOT NULL,
  policy_definition JSONB NOT NULL,
  effective_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  approved_by_user_id TEXT REFERENCES users(user_id),
  approved_at TIMESTAMPTZ,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (tenant_id, organization_id, policy_key, policy_version),
  CHECK (jsonb_typeof(policy_definition) = 'object'),
  CHECK ((status = 'APPROVED' AND approved_by_user_id IS NOT NULL AND approved_at IS NOT NULL) OR status <> 'APPROVED'),
  CHECK ((status = 'RETIRED' AND retired_at IS NOT NULL) OR status <> 'RETIRED')
);

CREATE INDEX IF NOT EXISTS idx_report_public_disclosure_policies_scope
  ON report_public_disclosure_policies (tenant_id, organization_id, report_id, report_version, status);
