-- Phase 8 — Credential authority integration.
-- Additive only: migration 051 remains the canonical credential ledger.
-- These fields make the institutional basis of an issuance durable without
-- allowing Studio, Portfolio, Deployment, or Registry to write credentials.

ALTER TABLE learner_credentials
  ADD COLUMN IF NOT EXISTS credential_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS issuance_key TEXT,
  ADD COLUMN IF NOT EXISTS provenance_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS verification_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS learner_credentials_issuance_key_unique
  ON learner_credentials (issuance_key)
  WHERE issuance_key IS NOT NULL AND status = 'ISSUED';

CREATE INDEX IF NOT EXISTS learner_credentials_verification_hash_idx
  ON learner_credentials (verification_hash)
  WHERE verification_hash IS NOT NULL;

ALTER TABLE learner_credentials
  ADD CONSTRAINT learner_credentials_credential_version_positive
  CHECK (credential_version > 0);
