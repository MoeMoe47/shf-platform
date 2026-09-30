-- Phase 3A: Arcade runtime continuity only. Runtime sessions are not
-- Attempts, Results, mastery, Evidence, Truth Spine facts, or rewards.
CREATE TABLE IF NOT EXISTS arcade_runtime_sessions (
  runtime_session_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  experience_id TEXT NOT NULL CHECK (char_length(experience_id) BETWEEN 1 AND 160),
  arcade_activity_id TEXT REFERENCES arcade_activities(arcade_activity_id),
  family TEXT NOT NULL CHECK (family IN ('learning', 'classic')),
  session_type TEXT NOT NULL CHECK (session_type IN ('game', 'simulation', 'mission', 'challenge', 'practice')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED', 'EXPIRED')),
  idempotency_key TEXT CHECK (idempotency_key IS NULL OR char_length(idempotency_key) BETWEEN 1 AND 160),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK (tenant_id = 'tenant:' || organization_id),
  CHECK (family = 'learning' OR arcade_activity_id IS NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS arcade_runtime_session_idempotency_uk
  ON arcade_runtime_sessions (organization_id, tenant_id, user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS arcade_runtime_session_owner_recent_idx
  ON arcade_runtime_sessions (organization_id, tenant_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS arcade_runtime_session_activity_idx
  ON arcade_runtime_sessions (organization_id, tenant_id, arcade_activity_id, created_at DESC)
  WHERE arcade_activity_id IS NOT NULL;
