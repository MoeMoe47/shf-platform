-- Completes policy representation without supplying institutional values.
ALTER TABLE report_public_disclosure_policies
  ADD COLUMN IF NOT EXISTS institutional_signoff_required BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS report_public_disclosure_policy_signoffs (
  signoff_record_id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL REFERENCES report_public_disclosure_policies(policy_id),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  signoff_type TEXT NOT NULL CHECK (signoff_type IN ('PRIVACY_DATA_GOVERNANCE', 'LEGAL_PRIVACY_REVIEW', 'EXECUTIVE_APPROVAL')),
  authority_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  recorded_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((status = 'PENDING' AND decided_at IS NULL) OR (status <> 'PENDING' AND decided_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_public_disclosure_policy_signoffs_scope
  ON report_public_disclosure_policy_signoffs (tenant_id, organization_id, policy_id, status);
