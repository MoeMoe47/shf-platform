-- Government Program Assurance Phase 5: bounded references and lineage over
-- existing Funding, Organization, Program, service, and outcome authorities.
CREATE TABLE IF NOT EXISTS gpa_funding_references (
  funding_reference_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  canonical_record_type TEXT NOT NULL CHECK (canonical_record_type IN ('FUNDING_SOURCE','GRANT','AWARD','AGREEMENT','CONTRACT','OBLIGATION','PAYMENT','EXPENDITURE','INVOICE')),
  canonical_record_id TEXT NOT NULL,
  funder_organization_reference TEXT,
  recipient_organization_reference TEXT,
  provider_organization_reference TEXT,
  program_reference TEXT,
  jurisdiction_reference TEXT,
  amount NUMERIC,
  currency TEXT,
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'REPORTED' CHECK (status IN ('REPORTED','DOCUMENTED','ALLOWABLE','VERIFIED','SUPERSEDED','RETRACTED')),
  source_system_id TEXT,
  source_record_id TEXT,
  provenance_reference TEXT,
  supersedes_reference_id TEXT,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE (funding_reference_id, organization_id, tenant_id),
  UNIQUE (canonical_record_type, canonical_record_id, organization_id, tenant_id),
  CONSTRAINT gpa_funding_reference_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_funding_reference_period_valid CHECK (period_end IS NULL OR period_start IS NULL OR period_end >= period_start)
);
CREATE INDEX IF NOT EXISTS gpa_funding_refs_provider_idx ON gpa_funding_references (organization_id, tenant_id, provider_organization_reference, canonical_record_type);
CREATE INDEX IF NOT EXISTS gpa_funding_refs_program_idx ON gpa_funding_references (organization_id, tenant_id, program_reference, period_start);

CREATE TABLE IF NOT EXISTS gpa_funding_lineage_edges (
  lineage_edge_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  from_type TEXT NOT NULL,
  from_reference TEXT NOT NULL,
  to_type TEXT NOT NULL,
  to_reference TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('FUNDS','AWARDS','AGREES','OBLIGATES','PAYS','EXPENDS','DELIVERS','SERVES','PRODUCES','CLAIMS','VERIFIES','CALCULATES','PROMOTES','DIRECT','ALLOCATED','AGGREGATED','SHARED_COST','ASSOCIATED','ATTRIBUTED','VERIFIED')),
  amount NUMERIC,
  currency TEXT,
  allocation_method_reference TEXT,
  period_start DATE,
  period_end DATE,
  source_system_id TEXT,
  source_record_id TEXT,
  provenance_reference TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUPERSEDED','RETRACTED','RECONCILIATION_REQUIRED')),
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT gpa_funding_edge_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (organization_id, tenant_id, from_type, from_reference, to_type, to_reference, relationship_type, source_record_id)
);
CREATE INDEX IF NOT EXISTS gpa_funding_edges_from_idx ON gpa_funding_lineage_edges (organization_id, tenant_id, from_type, from_reference, status);
CREATE INDEX IF NOT EXISTS gpa_funding_edges_to_idx ON gpa_funding_lineage_edges (organization_id, tenant_id, to_type, to_reference, status);

CREATE TABLE IF NOT EXISTS gpa_provider_assurance_projections (
  projection_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  provider_organization_reference TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary JSONB NOT NULL,
  source_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  provenance JSONB NOT NULL,
  UNIQUE (organization_id, tenant_id, provider_organization_reference)
);

CREATE TABLE IF NOT EXISTS gpa_program_assurance_projections (
  projection_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  program_reference TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary JSONB NOT NULL,
  source_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  provenance JSONB NOT NULL,
  UNIQUE (organization_id, tenant_id, program_reference)
);
