-- U6D Universal Program Completion Definition Authority.
-- Definitions are program-owned configuration; they are not credential or
-- reporting records. Requirements are stored as a validated snapshot so an
-- active definition can never be rewritten in place.

CREATE TABLE IF NOT EXISTS program_completion_definitions (
  definition_id TEXT PRIMARY KEY,
  canonical_program_reference TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'RETIRED')),
  completion_mode TEXT NOT NULL CHECK (completion_mode IN ('ALL_OF', 'ONE_OF')),
  requirements_json JSONB NOT NULL,
  authority_reference TEXT NOT NULL,
  definition_hash TEXT NOT NULL,
  effective_from TIMESTAMPTZ,
  effective_until TIMESTAMPTZ,
  created_by_user_id TEXT REFERENCES users(user_id),
  activated_by_user_id TEXT REFERENCES users(user_id),
  retired_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_program_completion_definition_version
    UNIQUE (organization_id, tenant_id, canonical_program_reference, version),
  CONSTRAINT ck_program_completion_definition_effective_window
    CHECK (effective_until IS NULL OR effective_from IS NULL OR effective_until > effective_from)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_program_completion_definition_active
  ON program_completion_definitions (organization_id, tenant_id, canonical_program_reference)
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_program_completion_definition_lookup
  ON program_completion_definitions (organization_id, tenant_id, canonical_program_reference, status);

ALTER TABLE program_completion_records
  ADD COLUMN IF NOT EXISTS completion_definition_id TEXT,
  ADD COLUMN IF NOT EXISTS completion_definition_version TEXT,
  ADD COLUMN IF NOT EXISTS requirements_snapshot_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_program_completion_definition_record
  ON program_completion_records (organization_id, tenant_id, canonical_program_reference, completion_definition_id, completion_definition_version);
