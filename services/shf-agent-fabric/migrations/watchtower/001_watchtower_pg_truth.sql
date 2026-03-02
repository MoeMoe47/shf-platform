-- Watchtower Postgres Truth Schema (append-only)
-- Safe to apply multiple times if you manage migrations externally; this file is scaffold.

BEGIN;

CREATE TABLE IF NOT EXISTS watchtower_snapshots (
  id              BIGSERIAL PRIMARY KEY,
  created_utc     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  program_id      TEXT NOT NULL,
  risk_band       TEXT NOT NULL,
  quarantined     BOOLEAN NOT NULL,
  watchtower_action TEXT NOT NULL,
  quarantine_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,

  rank_score_01   DOUBLE PRECISION,
  health_01       DOUBLE PRECISION,
  delta_score_01  DOUBLE PRECISION,
  trend_band      TEXT,

  -- hash-chain fields
  prev_hash       TEXT,
  row_hash        TEXT NOT NULL,
  chain_hash      TEXT NOT NULL,

  -- optional windowing labels
  window_days     INTEGER,
  baseline_weeks  INTEGER
);

CREATE INDEX IF NOT EXISTS ix_watchtower_snapshots_program_time
  ON watchtower_snapshots (program_id, created_utc DESC);

CREATE INDEX IF NOT EXISTS ix_watchtower_snapshots_chain_hash
  ON watchtower_snapshots (chain_hash);

-- Attestations: append-only rows (root proofs)
CREATE TABLE IF NOT EXISTS watchtower_attestations (
  id              BIGSERIAL PRIMARY KEY,
  created_utc     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kid             TEXT NOT NULL,
  payload         JSONB NOT NULL,
  sig             TEXT NOT NULL,
  root_hash       TEXT NOT NULL,
  proof_tips      JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS ix_watchtower_attestations_created
  ON watchtower_attestations (created_utc DESC);

CREATE INDEX IF NOT EXISTS ix_watchtower_attestations_root
  ON watchtower_attestations (root_hash);

-- Enforce append-only: block UPDATE/DELETE
CREATE OR REPLACE FUNCTION _watchtower_block_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'watchtower tables are append-only (mutation blocked)';
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_block_watchtower_snapshots_mutation'
  ) THEN
    CREATE TRIGGER tr_block_watchtower_snapshots_mutation
    BEFORE UPDATE OR DELETE ON watchtower_snapshots
    FOR EACH ROW EXECUTE FUNCTION _watchtower_block_mutation();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_block_watchtower_attestations_mutation'
  ) THEN
    CREATE TRIGGER tr_block_watchtower_attestations_mutation
    BEFORE UPDATE OR DELETE ON watchtower_attestations
    FOR EACH ROW EXECUTE FUNCTION _watchtower_block_mutation();
  END IF;
END $$;

COMMIT;
