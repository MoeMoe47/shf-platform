-- Government Program Assurance Phase 1: canonical authority boundaries.
-- These tables are bounded authorities for assurance concepts that did not
-- have a first-class owner. Existing programs, grants, evidence, identity,
-- reporting, and AI governance remain their own canonical domains.

CREATE TABLE IF NOT EXISTS gpa_claims (
  claim_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  claimant_reference TEXT NOT NULL,
  program_reference TEXT,
  claim_type TEXT NOT NULL,
  reporting_period_start DATE,
  reporting_period_end DATE,
  asserted_value JSONB NOT NULL,
  asserted_unit TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','VERIFIED','REJECTED','SUPERSEDED')),
  supersedes_claim_id TEXT REFERENCES gpa_claims(claim_id),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE (claim_id, organization_id, tenant_id),
  CONSTRAINT gpa_claim_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_claim_period_valid CHECK (reporting_period_end IS NULL OR reporting_period_start IS NULL OR reporting_period_end >= reporting_period_start)
);

CREATE INDEX IF NOT EXISTS gpa_claims_scope_status_idx ON gpa_claims (organization_id, tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS gpa_claims_program_idx ON gpa_claims (organization_id, tenant_id, program_reference, reporting_period_start);

CREATE TABLE IF NOT EXISTS gpa_source_authorities (
  source_authority_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  source_system_id TEXT NOT NULL,
  source_owner_reference TEXT NOT NULL,
  data_domain TEXT NOT NULL,
  record_type TEXT NOT NULL,
  jurisdiction TEXT,
  precedence INTEGER NOT NULL DEFAULT 0 CHECK (precedence >= 0),
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','SUSPENDED','RETIRED')),
  conflict_policy_reference TEXT,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT gpa_source_authority_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_source_authority_window_valid CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE INDEX IF NOT EXISTS gpa_source_authorities_scope_lookup_idx
  ON gpa_source_authorities (organization_id, tenant_id, data_domain, record_type, status, precedence DESC);

CREATE TABLE IF NOT EXISTS gpa_metrics (
  metric_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  program_reference TEXT,
  canonical_name TEXT NOT NULL,
  definition TEXT NOT NULL,
  unit_value_type TEXT NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  authority_owner_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','DEPRECATED','RETIRED')),
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  PRIMARY KEY (metric_id, version),
  CONSTRAINT gpa_metric_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_metric_window_valid CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE INDEX IF NOT EXISTS gpa_metrics_scope_name_idx ON gpa_metrics (organization_id, tenant_id, canonical_name, version DESC);

CREATE TABLE IF NOT EXISTS gpa_verification_methods (
  method_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  method_type TEXT NOT NULL,
  description TEXT NOT NULL,
  required_evidence_types JSONB NOT NULL DEFAULT '[]'::JSONB,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  PRIMARY KEY (method_id, version),
  CONSTRAINT gpa_verification_method_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_verification_method_window_valid CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE TABLE IF NOT EXISTS gpa_verification_records (
  verification_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  claim_id TEXT,
  subject_type TEXT NOT NULL,
  subject_reference TEXT NOT NULL,
  method_id TEXT NOT NULL,
  method_version INTEGER NOT NULL,
  verifier_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNREVIEWED' CHECK (status IN ('UNREVIEWED','IN_REVIEW','PASSED','FAILED','INCONCLUSIVE','SUPERSEDED')),
  result JSONB NOT NULL DEFAULT '{}'::JSONB,
  evidence_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  policy_version_reference TEXT,
  supersedes_verification_id TEXT,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT gpa_verification_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (verification_id, organization_id, tenant_id),
  FOREIGN KEY (claim_id, organization_id, tenant_id) REFERENCES gpa_claims(claim_id, organization_id, tenant_id),
  FOREIGN KEY (supersedes_verification_id, organization_id, tenant_id) REFERENCES gpa_verification_records(verification_id, organization_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS gpa_verification_records_scope_status_idx
  ON gpa_verification_records (organization_id, tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS gpa_truth_facts (
  truth_fact_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  fact_type TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_reference TEXT NOT NULL,
  claim_id TEXT,
  verification_id TEXT,
  source_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  fact_value JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'CANDIDATE' CHECK (status IN ('CANDIDATE','ACCEPTED','DISPUTED','RETRACTED','SUPERSEDED')),
  provenance JSONB NOT NULL,
  supersedes_truth_fact_id TEXT,
  determined_by TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gpa_truth_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_truth_requires_verification CHECK (status <> 'ACCEPTED' OR verification_id IS NOT NULL),
  UNIQUE (truth_fact_id, organization_id, tenant_id),
  FOREIGN KEY (claim_id, organization_id, tenant_id) REFERENCES gpa_claims(claim_id, organization_id, tenant_id),
  FOREIGN KEY (verification_id, organization_id, tenant_id) REFERENCES gpa_verification_records(verification_id, organization_id, tenant_id),
  FOREIGN KEY (supersedes_truth_fact_id, organization_id, tenant_id) REFERENCES gpa_truth_facts(truth_fact_id, organization_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS gpa_truth_facts_scope_subject_idx
  ON gpa_truth_facts (organization_id, tenant_id, subject_type, subject_reference, created_at DESC);

CREATE TABLE IF NOT EXISTS gpa_reconciliation_cases (
  reconciliation_case_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_reference TEXT NOT NULL,
  competing_source_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  competing_claim_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  conflict_reason TEXT NOT NULL,
  source_authority_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','UNDER_REVIEW','RESOLVED','UNRESOLVED','SUPERSEDED')),
  determination JSONB,
  reviewer_reference TEXT,
  authority_reference TEXT,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT gpa_reconciliation_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS gpa_reconciliation_scope_status_idx
  ON gpa_reconciliation_cases (organization_id, tenant_id, status, created_at DESC);
