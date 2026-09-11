-- Government Program Assurance Wave 2: recurring assurance coordination.
-- These tables are scoped workflow/projection records, not provider, program, Truth,
-- metric, evidence, reporting, or decision authorities.
CREATE TABLE IF NOT EXISTS gpa_assurance_cycles (
  cycle_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  program_reference TEXT NOT NULL,
  jurisdiction_reference TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED','OPEN','EVIDENCE_COLLECTION','VERIFICATION','REVIEW','CORRECTIVE_ACTION','DECISION_PENDING','CLOSED','DISCLOSURE_REVIEW','PUBLISHED')),
  evidence_rule_reference TEXT,
  metric_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  review_state TEXT NOT NULL DEFAULT 'NOT_STARTED',
  closure_state TEXT NOT NULL DEFAULT 'OPEN',
  public_disclosure_state TEXT NOT NULL DEFAULT 'NOT_REVIEWED',
  provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gpa_assurance_cycle_scope CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_assurance_cycle_period CHECK (period_end >= period_start),
  UNIQUE (cycle_id, organization_id, tenant_id)
);
CREATE INDEX IF NOT EXISTS gpa_assurance_cycles_scope_idx ON gpa_assurance_cycles (organization_id, tenant_id, program_reference, period_start, period_end);

CREATE TABLE IF NOT EXISTS gpa_assurance_cycle_scope (
  scope_id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL REFERENCES gpa_assurance_cycles(cycle_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  provider_reference TEXT NOT NULL,
  service_reference TEXT NOT NULL,
  funding_reference TEXT,
  effective_from DATE,
  effective_to DATE,
  provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gpa_assurance_cycle_scope_tenant CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_assurance_cycle_scope_period CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from),
  UNIQUE (cycle_id, provider_reference, service_reference)
);
CREATE INDEX IF NOT EXISTS gpa_assurance_cycle_scope_lookup_idx ON gpa_assurance_cycle_scope (organization_id, tenant_id, cycle_id, provider_reference, service_reference);

CREATE TABLE IF NOT EXISTS gpa_assurance_cycle_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL REFERENCES gpa_assurance_cycles(cycle_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('PROVIDER','PROGRAM')),
  subject_reference TEXT NOT NULL,
  summary JSONB NOT NULL,
  source_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gpa_assurance_snapshot_scope CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (cycle_id, profile_type, subject_reference)
);
CREATE INDEX IF NOT EXISTS gpa_assurance_snapshot_history_idx ON gpa_assurance_cycle_snapshots (organization_id, tenant_id, profile_type, subject_reference, created_at DESC);
