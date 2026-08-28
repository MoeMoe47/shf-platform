-- Report-level public eligibility is a governance decision, not public approval.
CREATE TABLE IF NOT EXISTS report_public_eligibility_decisions (
  public_eligibility_decision_id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  decision TEXT NOT NULL CHECK (decision IN ('PUBLIC_ELIGIBLE', 'PUBLIC_INELIGIBLE')),
  reason_code TEXT NOT NULL,
  policy_reference TEXT NOT NULL,
  decided_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  supersedes_decision_id TEXT REFERENCES report_public_eligibility_decisions(public_eligibility_decision_id),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_public_eligibility_scope
  ON report_public_eligibility_decisions (tenant_id, organization_id, report_id, report_version, decided_at DESC);
