-- Phase 4B: Mission execution state is separate from Arcade Runtime,
-- Arcade Results, Evidence, Truth Spine, rewards, and Metaverse state.
CREATE TABLE IF NOT EXISTS mission_runtime_sessions (
  mission_runtime_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  mission_id TEXT NOT NULL,
  mission_version INTEGER NOT NULL CHECK (mission_version > 0),
  definition_snapshot JSONB NOT NULL CHECK (jsonb_typeof(definition_snapshot) = 'object'),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','PAUSED','SUCCEEDED','FAILED','ABANDONED','EXPIRED')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  objective_states JSONB NOT NULL CHECK (jsonb_typeof(objective_states) = 'array'),
  stage_states JSONB NOT NULL CHECK (jsonb_typeof(stage_states) = 'array'),
  runtime_state JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(runtime_state) = 'object'),
  arcade_runtime_session_id TEXT REFERENCES arcade_runtime_sessions(runtime_session_id) ON DELETE SET NULL,
  idempotency_key TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS mission_runtime_start_idempotency_uk
  ON mission_runtime_sessions (organization_id, tenant_id, user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS mission_runtime_owner_recent_idx
  ON mission_runtime_sessions (organization_id, tenant_id, user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS mission_runtime_events (
  mission_runtime_event_id UUID PRIMARY KEY,
  mission_runtime_id TEXT NOT NULL REFERENCES mission_runtime_sessions(mission_runtime_id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  event_type TEXT NOT NULL CHECK (char_length(event_type) BETWEEN 1 AND 128),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  occurred_at TIMESTAMPTZ NOT NULL,
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mission_runtime_id, sequence)
);

CREATE INDEX IF NOT EXISTS mission_runtime_events_order_idx
  ON mission_runtime_events (mission_runtime_id, sequence ASC);
