-- Outcomes Core (Postgres)
-- Namespaced under migrations/outcomes to avoid collisions with watchtower migrations.

CREATE TABLE IF NOT EXISTS programs (
  program_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  org_name TEXT,
  payout_destination JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participants (
  participant_id TEXT PRIMARY KEY,
  external_ref TEXT,
  pii_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outcome_types (
  outcome_type TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  definition TEXT NOT NULL,
  evidence_requirements JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outcome_submissions (
  submission_id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  participant_id TEXT NOT NULL REFERENCES participants(participant_id),
  program_id TEXT NOT NULL REFERENCES programs(program_id),
  outcome_type TEXT NOT NULL REFERENCES outcome_types(outcome_type),
  artifact_ids JSONB NOT NULL,
  evidence_root_hash TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  notes TEXT
);
