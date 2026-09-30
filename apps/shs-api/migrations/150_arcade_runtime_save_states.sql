-- Phase 3B: current resumable runtime state only; this is not outcome truth.
CREATE TABLE IF NOT EXISTS arcade_runtime_save_states (
  session_id TEXT PRIMARY KEY REFERENCES arcade_runtime_sessions(runtime_session_id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision > 0),
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
