-- Wave 3B: append-only state history for derived Money-at-Risk exposures.
CREATE TABLE IF NOT EXISTS gpa_money_at_risk_history (
  history_id TEXT PRIMARY KEY,
  exposure_id TEXT NOT NULL REFERENCES gpa_money_at_risk(exposure_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  cycle_reference TEXT,
  status TEXT NOT NULL,
  amount_basis NUMERIC NOT NULL CHECK (amount_basis >= 0),
  amount_at_risk NUMERIC NOT NULL CHECK (amount_at_risk >= 0),
  calculation_version TEXT NOT NULL,
  materiality TEXT NOT NULL,
  confidence NUMERIC,
  signal_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  decision_reference TEXT,
  rationale TEXT NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gpa_money_risk_history_scope CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE INDEX IF NOT EXISTS gpa_money_risk_history_scope_idx ON gpa_money_at_risk_history (organization_id, tenant_id, exposure_id, recorded_at);
