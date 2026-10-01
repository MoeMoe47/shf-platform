-- Phase 3C: minimized operational runtime observations, not outcomes or evidence.
CREATE TABLE IF NOT EXISTS arcade_runtime_events (
  runtime_event_id UUID PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES arcade_runtime_sessions(runtime_session_id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'SESSION_STARTED', 'SESSION_RESUMED', 'SESSION_PAUSED', 'CHECKPOINT_REACHED',
    'LEVEL_STARTED', 'LEVEL_COMPLETED', 'INTERACTION', 'SESSION_COMPLETED', 'SESSION_ABANDONED'
  )),
  occurred_at TIMESTAMPTZ NOT NULL,
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, sequence)
);

CREATE INDEX IF NOT EXISTS arcade_runtime_events_session_order_idx
  ON arcade_runtime_events (session_id, sequence ASC);
