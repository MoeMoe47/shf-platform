-- Wave 2C trusted reporting outbox.
-- This is a database-backed development contract; deployment still requires
-- the approved migration runner, backup/restore policy, and monitoring.
CREATE TABLE IF NOT EXISTS integration_outbox (
  outbox_event_id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  originating_actor_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  idempotency_key TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('PENDING','DELIVERING','DELIVERED','RETRYABLE','FAILED_FINAL')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at TIMESTAMPTZ NOT NULL,
  last_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  last_error TEXT,
  destination TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, producer_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS integration_outbox_pending_idx
  ON integration_outbox (delivery_status, next_attempt_at, created_at);
