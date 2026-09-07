CREATE TABLE IF NOT EXISTS gpa_pilot_configurations (
  pilot_configuration_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  agency_organization_reference TEXT NOT NULL,
  pilot_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','CONFIGURING','READY_FOR_VALIDATION','READY_FOR_ACCEPTANCE','ACTIVE','PAUSED','CLOSED')),
  pilot_start DATE,
  pilot_end DATE,
  program_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  provider_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  funding_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  source_system_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  allowed_purposes JSONB NOT NULL DEFAULT '[]'::JSONB,
  required_roles JSONB NOT NULL DEFAULT '[]'::JSONB,
  public_disclosure_profile_reference TEXT,
  readiness_requirements_version TEXT NOT NULL DEFAULT '1',
  created_by TEXT NOT NULL REFERENCES users(user_id),
  approved_by TEXT,
  provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gpa_pilot_configuration_scope CHECK (tenant_id='tenant:'||organization_id)
);
CREATE INDEX IF NOT EXISTS idx_gpa_pilot_configurations_scope ON gpa_pilot_configurations (organization_id, tenant_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_gpa_pilot_configuration_active ON gpa_pilot_configurations (organization_id, tenant_id) WHERE status IN ('READY_FOR_ACCEPTANCE','ACTIVE');
