-- U6A bounded program-completion authority.
-- Completion facts are distinct from issued certificates and are evaluated
-- from trusted program-owned requirements by the application service.

CREATE TABLE IF NOT EXISTS program_completion_records (
  program_completion_id TEXT PRIMARY KEY,
  learner_user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  canonical_program_reference TEXT NOT NULL,
  requirements_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'ELIGIBLE_FOR_COMPLETION', 'COMPLETED', 'BLOCKED')),
  evaluated_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  requirements_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  missing_requirements_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_references_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_versions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  authority_version TEXT NOT NULL,
  completion_hash TEXT NOT NULL CHECK (completion_hash ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, tenant_id, learner_user_id, canonical_program_reference, requirements_version)
);

CREATE INDEX IF NOT EXISTS program_completion_records_scope_idx
  ON program_completion_records (organization_id, tenant_id, learner_user_id, canonical_program_reference, evaluated_at DESC);
