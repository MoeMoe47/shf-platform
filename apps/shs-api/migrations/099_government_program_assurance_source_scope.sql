-- Government Program Assurance Phase 2: source and scope foundation.
-- These tables register external authority and access conditions. They do
-- not copy source records, create Truth, or store provider credentials.

CREATE TABLE IF NOT EXISTS gpa_jurisdictions (
  jurisdiction_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  jurisdiction_type TEXT NOT NULL CHECK (jurisdiction_type IN ('FEDERAL','STATE','COUNTY','MUNICIPALITY','DISTRICT','AUTHORITY','MULTI_COUNTY','MULTI_STATE')),
  canonical_name TEXT NOT NULL,
  state_country_code TEXT,
  geographic_reference TEXT,
  parent_jurisdiction_id TEXT,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT','ACTIVE','SUSPENDED','RETIRED')),
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provenance_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT gpa_jurisdiction_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_jurisdiction_window_valid CHECK (effective_to IS NULL OR effective_to > effective_from),
  UNIQUE (jurisdiction_id, organization_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS gpa_jurisdictions_scope_idx
  ON gpa_jurisdictions (organization_id, tenant_id, jurisdiction_type, status);

ALTER TABLE gpa_jurisdictions
  DROP CONSTRAINT IF EXISTS gpa_jurisdiction_parent_fk;
ALTER TABLE gpa_jurisdictions
  ADD CONSTRAINT gpa_jurisdiction_parent_fk
  FOREIGN KEY (parent_jurisdiction_id) REFERENCES gpa_jurisdictions(jurisdiction_id);

CREATE TABLE IF NOT EXISTS gpa_source_systems (
  source_system_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  provider_vendor TEXT,
  source_owner_reference TEXT NOT NULL,
  jurisdiction_id TEXT,
  environment TEXT NOT NULL CHECK (environment IN ('DEVELOPMENT','TEST','STAGING','PRODUCTION')),
  system_type TEXT NOT NULL,
  data_domains JSONB NOT NULL DEFAULT '[]'::JSONB,
  record_types JSONB NOT NULL DEFAULT '[]'::JSONB,
  authority_role TEXT NOT NULL DEFAULT 'SOURCE_SYSTEM',
  authority_precedence INTEGER NOT NULL DEFAULT 0 CHECK (authority_precedence >= 0),
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','SUSPENDED','RETIRED')),
  data_classification TEXT NOT NULL DEFAULT 'INTERNAL' CHECK (data_classification IN ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED','HIGHLY_RESTRICTED')),
  integration_mode TEXT NOT NULL CHECK (integration_mode IN ('API','WEBHOOK','SFTP','SECURE_FILE','CSV','XLSX','JSON','DATABASE_READ','EVENT_STREAM','DOCUMENT_INGESTION')),
  credential_reference TEXT,
  last_verified_metadata_at TIMESTAMPTZ,
  provenance_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gpa_source_system_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_source_system_window_valid CHECK (effective_to IS NULL OR effective_to > effective_from),
  UNIQUE (source_system_id, organization_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS gpa_source_systems_scope_status_idx
  ON gpa_source_systems (organization_id, tenant_id, status, environment);

ALTER TABLE gpa_source_systems
  DROP CONSTRAINT IF EXISTS gpa_source_system_jurisdiction_fk;
ALTER TABLE gpa_source_systems
  ADD CONSTRAINT gpa_source_system_jurisdiction_fk
  FOREIGN KEY (jurisdiction_id) REFERENCES gpa_jurisdictions(jurisdiction_id);

ALTER TABLE gpa_source_authorities
  ADD COLUMN IF NOT EXISTS jurisdiction_id TEXT,
  ADD COLUMN IF NOT EXISTS authority_role TEXT NOT NULL DEFAULT 'DESIGNATED_SOURCE',
  ADD COLUMN IF NOT EXISTS data_classification TEXT NOT NULL DEFAULT 'INTERNAL' CHECK (data_classification IN ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED','HIGHLY_RESTRICTED'));

ALTER TABLE gpa_source_authorities
  DROP CONSTRAINT IF EXISTS gpa_source_authority_source_system_fk;
ALTER TABLE gpa_source_authorities
  ADD CONSTRAINT gpa_source_authority_source_system_fk
  FOREIGN KEY (source_system_id, organization_id, tenant_id)
  REFERENCES gpa_source_systems(source_system_id, organization_id, tenant_id);

CREATE TABLE IF NOT EXISTS gpa_purposes (
  purpose_id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RETIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gpa_purposes (purpose_id, canonical_name, description)
VALUES
  ('PROGRAM_MONITORING', 'Program Monitoring', 'Monitor delivery and performance of an authorized program.'),
  ('CLAIM_VERIFICATION', 'Claim Verification', 'Evaluate a bounded institutional claim.'),
  ('PAYMENT_VALIDATION', 'Payment Validation', 'Validate an authorized payment or obligation.'),
  ('AUDIT', 'Audit', 'Conduct an authorized audit or audit preparation.'),
  ('COMPLIANCE_REVIEW', 'Compliance Review', 'Evaluate compliance with an applicable requirement.'),
  ('PROVIDER_ASSURANCE', 'Provider Assurance', 'Evaluate an authorized provider relationship.'),
  ('PERFORMANCE_REPORTING', 'Performance Reporting', 'Prepare authorized internal performance reporting.'),
  ('PUBLIC_REPORTING', 'Public Reporting', 'Prepare an authorized public reporting output.'),
  ('INVESTIGATION', 'Investigation', 'Conduct an authorized restricted investigation.')
ON CONFLICT (purpose_id) DO UPDATE SET canonical_name = EXCLUDED.canonical_name, description = EXCLUDED.description, status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS gpa_data_use_policies (
  policy_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  source_system_id TEXT,
  source_class TEXT,
  allowed_purposes JSONB NOT NULL DEFAULT '[]'::JSONB,
  allowed_actions JSONB NOT NULL DEFAULT '[]'::JSONB,
  allowed_action_classes JSONB NOT NULL DEFAULT '["READ"]'::JSONB,
  allowed_data_domains JSONB NOT NULL DEFAULT '[]'::JSONB,
  allowed_record_types JSONB NOT NULL DEFAULT '[]'::JSONB,
  allowed_fields JSONB NOT NULL DEFAULT '[]'::JSONB,
  jurisdiction_id TEXT,
  legal_basis_reference TEXT,
  agreement_reference TEXT,
  requires_legal_basis BOOLEAN NOT NULL DEFAULT TRUE,
  requires_agreement BOOLEAN NOT NULL DEFAULT FALSE,
  classification_ceiling TEXT NOT NULL DEFAULT 'INTERNAL' CHECK (classification_ceiling IN ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED','HIGHLY_RESTRICTED')),
  retention_rule_reference TEXT,
  redisclosure_rule TEXT,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','EXPIRED','REVOKED','RETIRED')),
  approved_by TEXT REFERENCES users(user_id),
  provenance_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (policy_id, version),
  CONSTRAINT gpa_data_use_policy_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_data_use_policy_window_valid CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE INDEX IF NOT EXISTS gpa_data_use_policies_scope_status_idx
  ON gpa_data_use_policies (organization_id, tenant_id, status, effective_from DESC);

CREATE TABLE IF NOT EXISTS gpa_source_provenance (
  provenance_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  source_system_id TEXT NOT NULL REFERENCES gpa_source_systems(source_system_id),
  source_record_id TEXT NOT NULL,
  connector_id TEXT,
  connector_version TEXT,
  jurisdiction_id TEXT,
  retrieved_at TIMESTAMPTZ NOT NULL,
  source_timestamp TIMESTAMPTZ,
  batch_event_id TEXT,
  transformation_reference TEXT,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('VALID','INVALID','REJECTED','PENDING')),
  rejected_reason TEXT,
  data_use_policy_id TEXT,
  data_use_policy_version INTEGER,
  actor_service_identity TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  provenance_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gpa_source_provenance_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (organization_id, tenant_id, source_system_id, source_record_id, retrieved_at)
);

CREATE INDEX IF NOT EXISTS gpa_source_provenance_lookup_idx
  ON gpa_source_provenance (organization_id, tenant_id, source_system_id, source_record_id, retrieved_at DESC);

CREATE TABLE IF NOT EXISTS gpa_semantic_mappings (
  mapping_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  source_system_id TEXT NOT NULL REFERENCES gpa_source_systems(source_system_id),
  external_field TEXT NOT NULL,
  canonical_concept TEXT NOT NULL,
  transformation TEXT,
  validation_rule TEXT,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  owner_reference TEXT NOT NULL,
  approval_reference TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (mapping_id, version),
  CONSTRAINT gpa_semantic_mapping_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_semantic_mapping_window_valid CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE TABLE IF NOT EXISTS gpa_source_health (
  source_system_id TEXT PRIMARY KEY REFERENCES gpa_source_systems(source_system_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  last_successful_sync TIMESTAMPTZ,
  last_attempted_sync TIMESTAMPTZ,
  freshness_threshold_seconds INTEGER CHECK (freshness_threshold_seconds IS NULL OR freshness_threshold_seconds > 0),
  stale_after TIMESTAMPTZ,
  current_freshness_state TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (current_freshness_state IN ('UNKNOWN','FRESH','STALE','DEGRADED')),
  last_schema_verification TIMESTAMPTZ,
  authentication_state TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (authentication_state IN ('UNKNOWN','VALID','EXPIRED','REVOKED','FAILED')),
  degraded_state TEXT NOT NULL DEFAULT 'HEALTHY' CHECK (degraded_state IN ('HEALTHY','DEGRADED','UNAVAILABLE')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gpa_source_health_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE TABLE IF NOT EXISTS gpa_source_access_decisions (
  access_decision_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  principal_reference TEXT NOT NULL,
  requesting_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  source_system_id TEXT NOT NULL REFERENCES gpa_source_systems(source_system_id),
  program_reference TEXT,
  jurisdiction_id TEXT,
  purpose_id TEXT NOT NULL REFERENCES gpa_purposes(purpose_id),
  action_class TEXT NOT NULL CHECK (action_class IN ('READ','WRITE','ACTION')),
  action TEXT NOT NULL,
  data_domain TEXT NOT NULL,
  record_type TEXT NOT NULL,
  requested_fields JSONB NOT NULL DEFAULT '[]'::JSONB,
  requested_classification TEXT NOT NULL CHECK (requested_classification IN ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED','HIGHLY_RESTRICTED')),
  policy_id TEXT,
  policy_version INTEGER,
  decision TEXT NOT NULL CHECK (decision IN ('ALLOW','DENY')),
  reason_code TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT gpa_source_access_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS gpa_source_access_decisions_scope_idx
  ON gpa_source_access_decisions (organization_id, tenant_id, decided_at DESC, decision);
