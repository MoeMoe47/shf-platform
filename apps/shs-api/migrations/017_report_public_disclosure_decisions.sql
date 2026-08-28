-- Public disclosure is separate from report eligibility and public approval.
CREATE TABLE IF NOT EXISTS report_public_disclosure_decisions (
  public_disclosure_decision_id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  public_eligibility_decision_id TEXT NOT NULL REFERENCES report_public_eligibility_decisions(public_eligibility_decision_id),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  decision TEXT NOT NULL CHECK (decision IN ('PUBLIC_DISCLOSURE_APPROVED', 'PUBLIC_DISCLOSURE_BLOCKED')),
  privacy_policy_reference TEXT NOT NULL,
  privacy_policy_version TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  reviewed_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  supersedes_decision_id TEXT REFERENCES report_public_disclosure_decisions(public_disclosure_decision_id),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_public_disclosure_scope
  ON report_public_disclosure_decisions (tenant_id, organization_id, report_id, report_version, reviewed_at DESC);
