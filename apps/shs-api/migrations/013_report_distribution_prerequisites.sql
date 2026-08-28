-- Recipient authorization and artifact-bound disclosure decisions only.
-- Distribution, delivery, and publication remain separate authorities.

CREATE TABLE IF NOT EXISTS report_distribution_recipients (
  recipient_authorization_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  recipient_organization_ref TEXT NOT NULL REFERENCES organizations(organization_id),
  recipient_contact_ref TEXT,
  audience_type TEXT NOT NULL,
  purpose_scope TEXT,
  status TEXT NOT NULL DEFAULT 'AUTHORIZED' CHECK (status IN ('AUTHORIZED', 'REVOKED')),
  authorized_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((status = 'AUTHORIZED' AND revoked_at IS NULL) OR (status = 'REVOKED' AND revoked_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_report_distribution_recipients_scope
  ON report_distribution_recipients (tenant_id, organization_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS report_disclosure_decisions (
  disclosure_decision_id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES report_artifacts(artifact_id),
  artifact_version INTEGER NOT NULL CHECK (artifact_version > 0),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  classification TEXT NOT NULL CHECK (classification = 'RESTRICTED_EXTERNAL'),
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'BLOCKED')),
  decision_scope JSONB NOT NULL,
  reviewed_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rationale_code TEXT,
  policy_reference TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (jsonb_typeof(decision_scope) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_report_disclosure_decisions_artifact
  ON report_disclosure_decisions (tenant_id, organization_id, artifact_id, artifact_version, reviewed_at DESC);
