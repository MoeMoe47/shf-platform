-- SHF Ecosystem Phase 12.1 — External Account Security foundation.
--
-- This migration adds the secure storage this app needs to later connect
-- a learner's Google or Microsoft account (Phase 12.2), without yet
-- implementing any provider-specific Calendar behavior. Two tables:
--
-- external_account_connections — one row per (organization, user,
-- provider). Access/refresh tokens are never stored in plaintext; each is
-- an AES-256-GCM envelope (ciphertext + iv + auth_tag) plus the key
-- version it was encrypted under, decrypted only via
-- src/security/external-secret-cipher.ts. This is a genuinely reversible
-- secret (must be replayed back to the provider), unlike the one-way
-- hashed tokens this app issues to itself (session tokens, calendar feed
-- tokens) — see that file's own header for why this is the first
-- reversible-encryption table in this codebase.
--
-- oauth_authorization_states — short-lived, one-time OAuth
-- state/PKCE-verifier records. Mirrors the calendar_feed_tokens security
-- idiom for the state value itself (self-issued and self-verified by this
-- app, so only its SHA-256 hash is persisted — never the raw state). The
-- PKCE verifier is different: it must be replayed back to the provider's
-- token endpoint after the callback, so it is stored via the same
-- reversible envelope as the OAuth tokens above, not hashed.
CREATE TABLE IF NOT EXISTS external_account_connections (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  provider_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REAUTH_REQUIRED', 'REVOKED')),
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  access_token_ciphertext TEXT,
  access_token_iv TEXT,
  access_token_auth_tag TEXT,
  refresh_token_ciphertext TEXT,
  refresh_token_iv TEXT,
  refresh_token_auth_tag TEXT,
  token_key_version TEXT,
  access_token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_refreshed_at TIMESTAMPTZ,
  reauth_required_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_external_account_connections_actor
  ON external_account_connections(organization_id, user_id);

CREATE TABLE IF NOT EXISTS oauth_authorization_states (
  id TEXT PRIMARY KEY,
  state_hash TEXT NOT NULL UNIQUE,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  return_path TEXT NOT NULL,
  pkce_verifier_ciphertext TEXT NOT NULL,
  pkce_verifier_iv TEXT NOT NULL,
  pkce_verifier_auth_tag TEXT NOT NULL,
  pkce_verifier_key_version TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_authorization_states_lookup
  ON oauth_authorization_states(state_hash) WHERE consumed_at IS NULL;
