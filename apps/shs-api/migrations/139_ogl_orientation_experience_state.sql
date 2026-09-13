-- OGL-3: durable experience state only. This table is not workflow,
-- acknowledgment, Evidence, Truth, or entitlement state.
CREATE TABLE IF NOT EXISTS ogl_orientation_experience_state (
  experience_state_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  orientation_id TEXT NOT NULL,
  orientation_version INTEGER NOT NULL CHECK (orientation_version > 0),
  tour_id TEXT,
  tour_version INTEGER CHECK (tour_version IS NULL OR tour_version > 0),
  status TEXT NOT NULL CHECK (status IN ('OFFERED','STARTED','PAUSED','SKIPPED','DISMISSED','COMPLETED')),
  current_step_id TEXT,
  last_route TEXT,
  last_destination_id TEXT,
  first_offered_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  whats_changed_seen_at TIMESTAMPTZ,
  replay_count INTEGER NOT NULL DEFAULT 0 CHECK (replay_count >= 0),
  CONSTRAINT ogl_orientation_experience_scope CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS ogl_orientation_experience_scope_idx
  ON ogl_orientation_experience_state (user_id, organization_id, tenant_id, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ogl_orientation_experience_identity_idx
  ON ogl_orientation_experience_state (user_id, organization_id, tenant_id, orientation_id, orientation_version, COALESCE(tour_id, ''), COALESCE(tour_version, 0));
