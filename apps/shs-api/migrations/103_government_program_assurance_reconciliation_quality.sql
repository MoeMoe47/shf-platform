-- Government Program Assurance Phase 6: reconciliation, data quality, and
-- entity-resolution foundations. These records preserve source competition and
-- never replace Organization, Person, Source Authority, or Truth ownership.

ALTER TABLE gpa_reconciliation_cases
  ADD COLUMN IF NOT EXISTS conflict_type TEXT,
  ADD COLUMN IF NOT EXISTS conflicting_record_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS current_authority_ranking JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS materiality TEXT NOT NULL DEFAULT 'NON_MATERIAL',
  ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS assigned_reviewer TEXT,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS resolution_method TEXT,
  ADD COLUMN IF NOT EXISTS rationale TEXT,
  ADD COLUMN IF NOT EXISTS supersedes_case_id TEXT,
  ADD COLUMN IF NOT EXISTS downstream_impact_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::JSONB;
ALTER TABLE gpa_reconciliation_cases DROP CONSTRAINT IF EXISTS gpa_reconciliation_cases_status_check;
ALTER TABLE gpa_reconciliation_cases ADD CONSTRAINT gpa_reconciliation_cases_status_check
  CHECK (status IN ('OPEN','TRIAGE','UNDER_REVIEW','NEEDS_INFORMATION','READY_FOR_DECISION','RESOLVED','UNRESOLVED','SUPERSEDED','CLOSED'));
CREATE INDEX IF NOT EXISTS gpa_reconciliation_queue_idx ON gpa_reconciliation_cases (organization_id, tenant_id, status, severity, materiality, opened_at);

CREATE TABLE IF NOT EXISTS gpa_data_quality_rules (
  rule_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  source_system_id TEXT,
  data_domain TEXT,
  record_type TEXT,
  dimension TEXT NOT NULL CHECK (dimension IN ('COMPLETENESS','VALIDITY','UNIQUENESS','CONSISTENCY','TIMELINESS','REFERENTIAL_INTEGRITY','SOURCE_AUTHORITY','FRESHNESS')),
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
  logic_reference TEXT NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
  owner_reference TEXT,
  approval_reference TEXT,
  provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (rule_id, version),
  CONSTRAINT gpa_quality_rule_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_quality_rule_window_valid CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX IF NOT EXISTS gpa_quality_rules_scope_idx ON gpa_data_quality_rules (organization_id, tenant_id, source_system_id, dimension, status, effective_from);

CREATE TABLE IF NOT EXISTS gpa_data_quality_evaluations (
  quality_evaluation_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  source_system_id TEXT,
  subject_type TEXT NOT NULL,
  subject_reference TEXT NOT NULL,
  dimension TEXT NOT NULL,
  rule_id TEXT,
  rule_version INTEGER,
  state TEXT NOT NULL CHECK (state IN ('PASS','WARNING','FAIL','UNKNOWN','NOT_APPLICABLE')),
  score NUMERIC CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  reason_codes JSONB NOT NULL DEFAULT '[]'::JSONB,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evaluated_by TEXT NOT NULL REFERENCES users(user_id),
  provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT gpa_quality_evaluation_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE INDEX IF NOT EXISTS gpa_quality_evaluations_scope_idx ON gpa_data_quality_evaluations (organization_id, tenant_id, subject_type, subject_reference, dimension, evaluated_at DESC);

CREATE TABLE IF NOT EXISTS gpa_entity_resolution_cases (
  resolution_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('ORGANIZATION','PROVIDER','PARTICIPANT','PERSON')),
  source_system_id TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  candidate_entity_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  match_method TEXT NOT NULL CHECK (match_method IN ('DETERMINISTIC','MANUAL','PROBABILISTIC')),
  match_attributes JSONB NOT NULL DEFAULT '{}'::JSONB,
  confidence NUMERIC CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  status TEXT NOT NULL DEFAULT 'UNRESOLVED' CHECK (status IN ('UNRESOLVED','CANDIDATE','MATCHED','REJECTED','AMBIGUOUS','MERGE_REVIEW_REQUIRED','SUPERSEDED')),
  reviewer_reference TEXT,
  determination JSONB,
  provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT gpa_entity_resolution_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE INDEX IF NOT EXISTS gpa_entity_resolution_scope_idx ON gpa_entity_resolution_cases (organization_id, tenant_id, entity_type, status, created_at DESC);

CREATE TABLE IF NOT EXISTS gpa_duplicate_candidates (
  duplicate_candidate_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  left_reference TEXT NOT NULL,
  right_reference TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('POSSIBLE_DUPLICATE','LIKELY_DUPLICATE','CONFIRMED_DUPLICATE','NOT_DUPLICATE')),
  reconciliation_case_id TEXT,
  evidence_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gpa_duplicate_candidate_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (organization_id, tenant_id, subject_type, left_reference, right_reference)
);
CREATE INDEX IF NOT EXISTS gpa_duplicate_candidates_scope_idx ON gpa_duplicate_candidates (organization_id, tenant_id, classification, subject_type);

CREATE TABLE IF NOT EXISTS gpa_schema_observations (
  observation_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  source_system_id TEXT NOT NULL,
  observed_schema_version TEXT NOT NULL,
  observed_signature TEXT NOT NULL,
  expected_mapping_version TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  drift_classification TEXT NOT NULL CHECK (drift_classification IN ('NONE','NONBREAKING','BREAKING')),
  affected_mapping_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  remediation_reference TEXT,
  provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  CONSTRAINT gpa_schema_observation_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE TABLE IF NOT EXISTS gpa_rejected_records (
  rejected_record_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  source_system_id TEXT NOT NULL,
  source_record_id TEXT,
  batch_reference TEXT,
  rule_id TEXT,
  failure_reason TEXT NOT NULL,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  remediation_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (remediation_status IN ('OPEN','IN_REVIEW','RESOLVED','DISMISSED')),
  provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  CONSTRAINT gpa_rejected_record_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);
