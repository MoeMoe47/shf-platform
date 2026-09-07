-- Government Program Assurance Phase 4: deterministic Metric Result and Truth lineage.
-- Metric definitions, results, and accepted Truth remain separate authorities.

ALTER TABLE gpa_metrics
  ADD COLUMN IF NOT EXISTS metric_type TEXT NOT NULL DEFAULT 'CUSTOM' CHECK (metric_type IN ('COUNT','RATE','PERCENTAGE','CURRENCY','DURATION','AVERAGE','MEDIAN','RATIO','BOOLEAN','INDEX','CUSTOM')),
  ADD COLUMN IF NOT EXISTS numerator_definition TEXT,
  ADD COLUMN IF NOT EXISTS denominator_definition TEXT,
  ADD COLUMN IF NOT EXISTS formula_reference TEXT,
  ADD COLUMN IF NOT EXISTS inclusion_criteria JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS exclusion_criteria JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS population_definition JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS required_evidence_classes JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS minimum_verification_level TEXT NOT NULL DEFAULT 'V2' CHECK (minimum_verification_level IN ('V0','V1','V2','V3','V4','V5')),
  ADD COLUMN IF NOT EXISTS source_authority_requirements JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS reporting_period_rules JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS jurisdiction_reference TEXT,
  ADD COLUMN IF NOT EXISTS supersedes_metric_version INTEGER,
  ADD COLUMN IF NOT EXISTS approval_reference TEXT,
  ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::JSONB;
ALTER TABLE gpa_metrics ADD CONSTRAINT gpa_metrics_scoped_version_unique UNIQUE (metric_id, version, organization_id, tenant_id);

CREATE TABLE IF NOT EXISTS gpa_metric_results (
  metric_result_id TEXT PRIMARY KEY,
  metric_id TEXT NOT NULL,
  metric_version INTEGER NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  program_reference TEXT,
  provider_reference TEXT,
  jurisdiction_reference TEXT,
  reporting_period_start DATE,
  reporting_period_end DATE,
  population_reference JSONB NOT NULL DEFAULT '{}'::JSONB,
  numerator NUMERIC,
  denominator NUMERIC,
  calculated_value JSONB NOT NULL,
  unit_value_type TEXT NOT NULL,
  input_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  input_verification_levels JSONB NOT NULL DEFAULT '[]'::JSONB,
  calculation_version TEXT NOT NULL,
  calculation_hash TEXT NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  calculated_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CALCULATED' CHECK (status IN ('PREVIEW','CALCULATED','ACCEPTED','STALE','REVIEW_REQUIRED','SUPERSEDED','REJECTED')),
  provenance JSONB NOT NULL,
  supersedes_metric_result_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (metric_result_id, organization_id, tenant_id),
  UNIQUE (metric_id, metric_version, metric_result_id, organization_id, tenant_id),
  CONSTRAINT gpa_metric_result_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_metric_result_period_valid CHECK (reporting_period_end IS NULL OR reporting_period_start IS NULL OR reporting_period_end >= reporting_period_start),
  FOREIGN KEY (metric_id, metric_version, organization_id, tenant_id) REFERENCES gpa_metrics(metric_id, version, organization_id, tenant_id),
  FOREIGN KEY (supersedes_metric_result_id, organization_id, tenant_id) REFERENCES gpa_metric_results(metric_result_id, organization_id, tenant_id)
);
CREATE INDEX IF NOT EXISTS gpa_metric_results_scope_lookup_idx ON gpa_metric_results (organization_id, tenant_id, metric_id, metric_version, status, calculated_at DESC);

ALTER TABLE gpa_truth_facts
  ADD COLUMN IF NOT EXISTS metric_result_id TEXT,
  ADD COLUMN IF NOT EXISTS unit_value_type TEXT,
  ADD COLUMN IF NOT EXISTS reporting_period_start DATE,
  ADD COLUMN IF NOT EXISTS reporting_period_end DATE,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_level TEXT CHECK (verification_level IS NULL OR verification_level IN ('V0','V1','V2','V3','V4','V5')),
  ADD COLUMN IF NOT EXISTS authority_level TEXT,
  ADD COLUMN IF NOT EXISTS public_approval_status TEXT NOT NULL DEFAULT 'NOT_REVIEWED' CHECK (public_approval_status IN ('NOT_REVIEWED','RESTRICTED','PUBLIC_ELIGIBLE','PUBLIC_APPROVED','PUBLIC_DENIED')),
  ADD COLUMN IF NOT EXISTS confidence NUMERIC CHECK (confidence IS NULL OR confidence >= 0 AND confidence <= 1),
  ADD COLUMN IF NOT EXISTS reconciliation_case_id TEXT,
  ADD COLUMN IF NOT EXISTS retraction_reason TEXT,
  ADD COLUMN IF NOT EXISTS determination_metadata JSONB NOT NULL DEFAULT '{}'::JSONB;
ALTER TABLE gpa_truth_facts ADD CONSTRAINT gpa_truth_metric_result_fk FOREIGN KEY (metric_result_id, organization_id, tenant_id) REFERENCES gpa_metric_results(metric_result_id, organization_id, tenant_id);
CREATE INDEX IF NOT EXISTS gpa_truth_facts_metric_idx ON gpa_truth_facts (organization_id, tenant_id, metric_result_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS gpa_truth_determinations (
  determination_id TEXT PRIMARY KEY,
  truth_fact_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('ACCEPTED','SUPERSEDED','RETRACTED','DENIED')),
  determining_actor TEXT NOT NULL,
  authorization_reference TEXT NOT NULL,
  claim_reference TEXT,
  verification_reference TEXT,
  metric_result_reference TEXT,
  evidence_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  source_authority_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  reconciliation_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  reason TEXT NOT NULL,
  policy_version_reference TEXT,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT gpa_truth_determination_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  FOREIGN KEY (truth_fact_id, organization_id, tenant_id) REFERENCES gpa_truth_facts(truth_fact_id, organization_id, tenant_id)
);
CREATE INDEX IF NOT EXISTS gpa_truth_determinations_scope_idx ON gpa_truth_determinations (organization_id, tenant_id, truth_fact_id, created_at DESC);
