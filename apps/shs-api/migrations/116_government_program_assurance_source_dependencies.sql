-- Wave 2H: derived source-to-assurance-scope dependencies.
-- This is a scoped dependency projection, not a source, provider, or program authority.
CREATE TABLE IF NOT EXISTS gpa_source_assurance_dependencies (
  dependency_id TEXT PRIMARY KEY,
  source_system_id TEXT NOT NULL REFERENCES gpa_source_systems(source_system_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  provider_reference TEXT,
  program_reference TEXT,
  service_reference TEXT,
  effective_from DATE,
  effective_to DATE,
  provenance_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gpa_source_dependency_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT gpa_source_dependency_scope_required CHECK (provider_reference IS NOT NULL OR program_reference IS NOT NULL),
  CONSTRAINT gpa_source_dependency_window_valid CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from),
  UNIQUE (source_system_id, organization_id, tenant_id, provider_reference, program_reference, service_reference)
);

CREATE INDEX IF NOT EXISTS gpa_source_dependency_provider_idx
  ON gpa_source_assurance_dependencies (organization_id, tenant_id, provider_reference, source_system_id);
CREATE INDEX IF NOT EXISTS gpa_source_dependency_program_idx
  ON gpa_source_assurance_dependencies (organization_id, tenant_id, program_reference, source_system_id);
