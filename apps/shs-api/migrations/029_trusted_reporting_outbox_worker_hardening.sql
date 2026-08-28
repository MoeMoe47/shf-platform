-- Durable worker ownership and bounded delivery recovery for the integration outbox.
ALTER TABLE integration_outbox
  ADD COLUMN IF NOT EXISTS lease_owner TEXT,
  ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lease_reclaimed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS failure_classification TEXT,
  ADD COLUMN IF NOT EXISTS quarantined_at TIMESTAMPTZ;

ALTER TABLE integration_outbox
  DROP CONSTRAINT IF EXISTS integration_outbox_delivery_status_check;

ALTER TABLE integration_outbox
  ADD CONSTRAINT integration_outbox_delivery_status_check
  CHECK (delivery_status IN ('PENDING','DELIVERING','DELIVERED','RETRYABLE','FAILED_FINAL','QUARANTINED'));

CREATE INDEX IF NOT EXISTS integration_outbox_lease_idx
  ON integration_outbox (delivery_status, lease_expires_at, created_at);

CREATE INDEX IF NOT EXISTS integration_outbox_backlog_idx
  ON integration_outbox (delivery_status, next_attempt_at, created_at)
  WHERE delivery_status IN ('PENDING', 'RETRYABLE');
