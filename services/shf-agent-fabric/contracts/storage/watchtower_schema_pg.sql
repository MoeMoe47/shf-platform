-- SHF Watchtower Postgres schema (append-only mindset)
-- Truth source: Postgres
-- Immutable audit archive: nightly JSONL export (object storage later)
-- Key authority: KMS/Secret Manager (not in this schema)

CREATE TABLE IF NOT EXISTS watchtower_snapshots (
  id               BIGSERIAL PRIMARY KEY,
  created_utc      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  program_id       TEXT NOT NULL,
  risk_band        TEXT NOT NULL,
  quarantined      BOOLEAN NOT NULL,
  watchtower_action TEXT NOT NULL,
  quarantine_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,

  rank_score_01    DOUBLE PRECISION,
  health_01        DOUBLE PRECISION,
  delta_score_01   DOUBLE PRECISION,
  trend_band       TEXT,

  -- Chain fields (hash-chaining)
  prev_hash        TEXT,
  row_hash         TEXT NOT NULL,
  chain_hash       TEXT NOT NULL,

  -- JSON payload for forward-compat
  payload          JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_watchtower_snapshots_program_time
  ON watchtower_snapshots (program_id, created_utc DESC);

CREATE INDEX IF NOT EXISTS idx_watchtower_snapshots_chain
  ON watchtower_snapshots (chain_hash);

-- Attestations: store what was signed + signature + key id (kid)
-- Append-only: do NOT update existing rows; insert new rows
CREATE TABLE IF NOT EXISTS watchtower_attestations (
  id              BIGSERIAL PRIMARY KEY,
  created_utc     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  root_hash       TEXT NOT NULL,

  -- payload + signature (store exact bytes used for signing)
  payload_json    JSONB NOT NULL,
  signature_hex   TEXT NOT NULL,
  kid             TEXT NOT NULL,

  -- “root proof” sampling for auditors (top N tips)
  proof_tips_json JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- optional metadata
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_watchtower_attestations_time
  ON watchtower_attestations (created_utc DESC);

CREATE INDEX IF NOT EXISTS idx_watchtower_attestations_root
  ON watchtower_attestations (root_hash);

CREATE INDEX IF NOT EXISTS idx_watchtower_attestations_kid
  ON watchtower_attestations (kid);
