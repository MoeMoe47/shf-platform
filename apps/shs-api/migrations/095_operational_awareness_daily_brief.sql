-- Phase 6B: Operational Awareness and Daily Operating Brief.
-- These are derived/read-model records. They do not own evidence, truth, or metrics.

CREATE TABLE IF NOT EXISTS operational_awareness_findings (
  finding_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  finding_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('BLOCKER','RISK','DEADLINE','APPROVAL_REQUIRED','SECURITY_ALERT','GOVERNANCE_ALERT','AGENT_EXCEPTION','DATA_QUALITY','SERVICE_DEGRADATION','PERFORMANCE_CHANGE','OUTCOME_CHANGE','FUNDING_OBLIGATION_ISSUE','OPPORTUNITY','FOLLOW_UP','INFORMATIONAL')),
  severity TEXT NOT NULL CHECK (severity IN ('INFO','LOW','MEDIUM','HIGH','CRITICAL')),
  priority TEXT NOT NULL CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_refs JSONB NOT NULL DEFAULT '[]'::JSONB,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::JSONB,
  truth_refs JSONB NOT NULL DEFAULT '[]'::JSONB,
  metric_refs JSONB NOT NULL DEFAULT '[]'::JSONB,
  external_source_refs JSONB NOT NULL DEFAULT '[]'::JSONB,
  confidence NUMERIC,
  verification_class TEXT NOT NULL CHECK (verification_class IN ('VERIFIED_FACT','CANONICAL_OPERATIONAL_FACT','SECURITY_GOVERNANCE_FACT','EXTERNAL_OBSERVATION','DERIVED_FINDING','RECOMMENDATION')),
  first_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED','DISMISSED')),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT REFERENCES users(user_id),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT REFERENCES users(user_id),
  generated_by TEXT NOT NULL DEFAULT 'deterministic-awareness-v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT operational_awareness_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (organization_id, tenant_id, dedupe_key)
);

CREATE INDEX IF NOT EXISTS operational_awareness_scope_idx
  ON operational_awareness_findings (organization_id, tenant_id, status, priority, last_observed_at DESC);

CREATE TABLE IF NOT EXISTS daily_operating_briefs (
  brief_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  reporting_period_start TIMESTAMPTZ NOT NULL,
  reporting_period_end TIMESTAMPTZ NOT NULL,
  generated_for TEXT NOT NULL REFERENCES users(user_id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_window JSONB NOT NULL,
  finding_refs JSONB NOT NULL DEFAULT '[]'::JSONB,
  verified_outcome_refs JSONB NOT NULL DEFAULT '[]'::JSONB,
  agent_activity_refs JSONB NOT NULL DEFAULT '[]'::JSONB,
  external_observation_refs JSONB NOT NULL DEFAULT '[]'::JSONB,
  brief_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (status IN ('GENERATED','SUPERSEDED')),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT daily_operating_brief_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT daily_operating_brief_period_valid CHECK (reporting_period_end > reporting_period_start)
);

CREATE INDEX IF NOT EXISTS daily_operating_brief_scope_idx
  ON daily_operating_briefs (organization_id, tenant_id, generated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS daily_operating_brief_version_idx
  ON daily_operating_briefs (organization_id, tenant_id, reporting_period_start, reporting_period_end, version);
