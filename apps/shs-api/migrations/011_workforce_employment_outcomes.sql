-- Canonical employment-start authority. Submission is not verification.
CREATE TABLE IF NOT EXISTS workforce_employment_outcomes (
  outcome_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  participant_ref TEXT NOT NULL,
  program_id TEXT,
  outcome_type TEXT NOT NULL CHECK (outcome_type = 'EMPLOYMENT_STARTED'),
  employment_started_at TIMESTAMPTZ NOT NULL,
  lifecycle_status TEXT NOT NULL DEFAULT 'verification_pending'
    CHECK (lifecycle_status IN ('submitted', 'verification_pending', 'verified', 'rejected', 'withdrawn')),
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'withdrawn')),
  verification_source_type TEXT,
  verification_reference TEXT,
  evidence_hash TEXT,
  verified_at TIMESTAMPTZ,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK ((lifecycle_status = 'verified' AND verification_status = 'verified')
      OR lifecycle_status <> 'verified'),
  CHECK ((lifecycle_status IN ('rejected', 'withdrawn') AND verification_status = lifecycle_status)
      OR lifecycle_status NOT IN ('rejected', 'withdrawn')),
  CHECK ((lifecycle_status = 'verified' AND verification_source_type IS NOT NULL AND verification_reference IS NOT NULL)
      OR lifecycle_status <> 'verified')
);

CREATE INDEX IF NOT EXISTS idx_workforce_employment_outcomes_scope
  ON workforce_employment_outcomes (tenant_id, organization_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_workforce_employment_outcomes_participant
  ON workforce_employment_outcomes (tenant_id, organization_id, participant_ref, employment_started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workforce_employment_outcomes_program
  ON workforce_employment_outcomes (tenant_id, organization_id, program_id, employment_started_at DESC);

ALTER TABLE workforce_employment_outcomes
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
