-- SHF Ecosystem Phase 12 — External Calendar Integration: private ICS/
-- webcal subscription feed tokens.
--
-- This table stores no institutional truth and no third-party secret. It
-- exists only so a learner's private `/calendar/feed.ics?token=...` URL
-- can be verified without a session cookie (external calendar clients —
-- Google Calendar, Outlook, Apple Calendar — cannot send this app's
-- session auth when polling a subscribed feed URL).
--
-- Security model mirrors the existing, already-audited session-token
-- pattern in production-identity-repo.ts exactly: a high-entropy opaque
-- token is generated once and shown to the user a single time; only its
-- SHA-256 hash is ever persisted. This is standard practice for a
-- self-issued bearer credential the app both creates and verifies (no
-- reversibility is ever needed, unlike a third-party OAuth refresh token
-- that must later be replayed back to that provider — no such reversible-
-- encryption/KMS infrastructure exists anywhere in this codebase, which is
-- exactly why Phase 12 does not implement Google/Microsoft OAuth token
-- storage — see docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md).
--
-- Exactly one row per learner, ever — regenerating UPDATEs this same row
-- in place (new token_hash, revoked_at reset to NULL) rather than
-- inserting a second row, so "one active feed URL per learner" is a
-- structural guarantee, not an application-level convention.
CREATE TABLE IF NOT EXISTS calendar_feed_tokens (
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_feed_tokens_lookup ON calendar_feed_tokens(token_hash) WHERE revoked_at IS NULL;
