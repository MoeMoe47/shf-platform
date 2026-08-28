ALTER TABLE report_artifacts
  ADD COLUMN IF NOT EXISTS generation_idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS report_artifacts_generation_idempotency_idx
  ON report_artifacts (tenant_id, organization_id, generation_idempotency_key)
  WHERE generation_idempotency_key IS NOT NULL;
