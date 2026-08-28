-- Auth0 identity links and SHS-owned browser sessions.
CREATE TABLE IF NOT EXISTS identity_provider_links (
  identity_link_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  internal_identity_id TEXT NOT NULL REFERENCES users(user_id),
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_authenticated_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (provider, provider_subject)
);

CREATE INDEX IF NOT EXISTS idx_identity_provider_links_identity
  ON identity_provider_links(internal_identity_id);

CREATE TABLE IF NOT EXISTS shs_identity_sessions (
  session_id TEXT PRIMARY KEY,
  session_token_hash TEXT NOT NULL UNIQUE,
  internal_identity_id TEXT NOT NULL REFERENCES users(user_id),
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_shs_identity_sessions_active
  ON shs_identity_sessions(session_token_hash, expires_at)
  WHERE revoked_at IS NULL;

