-- Shared operational rate-limit state. This is not institutional Truth.
CREATE TABLE IF NOT EXISTS rate_limit_windows (
  limiter_key TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  window_seconds INTEGER NOT NULL CHECK (window_seconds > 0),
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (limiter_key, window_started_at)
);

CREATE INDEX IF NOT EXISTS rate_limit_windows_expiry_idx
  ON rate_limit_windows (expires_at);
