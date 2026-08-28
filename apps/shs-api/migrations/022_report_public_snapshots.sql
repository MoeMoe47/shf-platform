-- Immutable public-safe evaluated report snapshots. This is data authority,
-- not file storage, publication authorization, or a public URL.
CREATE TABLE IF NOT EXISTS report_public_snapshots (
  public_snapshot_id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  source_result_reference TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  public_eligibility_decision_id TEXT NOT NULL REFERENCES report_public_eligibility_decisions(public_eligibility_decision_id),
  public_disclosure_decision_id TEXT NOT NULL REFERENCES report_public_disclosure_decisions(public_disclosure_decision_id),
  disclosure_policy_reference TEXT NOT NULL,
  disclosure_policy_version TEXT NOT NULL,
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  reporting_period TEXT NOT NULL CHECK (reporting_period IN ('QUARTERLY', 'ANNUAL')),
  reporting_period_label TEXT NOT NULL,
  data_as_of TIMESTAMPTZ NOT NULL,
  geography_level TEXT NOT NULL CHECK (geography_level IN ('COUNTY', 'STATE', 'ORGANIZATION_WIDE')),
  program_granularity TEXT NOT NULL CHECK (program_granularity IN ('FOUNDATION_WIDE', 'NAMED_PROGRAM')),
  public_representation_type TEXT NOT NULL CHECK (public_representation_type IN ('EXACT_COUNT', 'SUPPRESSED_LT_10')),
  public_display_value TEXT NOT NULL,
  suppression_state TEXT NOT NULL CHECK (suppression_state IN ('NONE', 'SUPPRESSED_LT_10')),
  snapshot_hash TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  idempotency_key TEXT NOT NULL,
  UNIQUE (tenant_id, organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_report_public_snapshots_scope
  ON report_public_snapshots (tenant_id, organization_id, report_id, report_version, created_at DESC);
