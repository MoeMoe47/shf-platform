-- OGL-6: bounded presentation overlays and experience telemetry.
-- These tables are not workflow, acknowledgment, Evidence, Truth, or domain state.
CREATE TABLE IF NOT EXISTS ogl_orientation_versions (
  orientation_version_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  orientation_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  lifecycle TEXT NOT NULL CHECK (lifecycle IN ('DRAFT','REVIEW','ACTIVE','SUPERSEDED','ARCHIVED')),
  presentation_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  change_summary TEXT NOT NULL CHECK (char_length(change_summary) <= 1000),
  reorientation_policy TEXT NOT NULL DEFAULT 'OPTIONAL',
  supersedes_version INTEGER,
  created_by_user_id TEXT NOT NULL,
  reviewed_by_user_id TEXT,
  published_by_user_id TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, tenant_id, orientation_id, version)
);
CREATE UNIQUE INDEX IF NOT EXISTS ogl_orientation_one_active_version
  ON ogl_orientation_versions (organization_id, tenant_id, orientation_id)
  WHERE lifecycle = 'ACTIVE';
CREATE TABLE IF NOT EXISTS ogl_authoring_events (
  event_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('orientation.draft_created','orientation.draft_updated','orientation.reviewed','orientation.published','orientation.superseded','orientation.archived')),
  orientation_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ogl_telemetry_events (
  event_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  actor_user_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('guidance_center.opened','guidance_center.closed','guidance_section.opened','guidance_tour.started','guidance_tour.resumed','guidance_document.opened','guidance_companion.opened','guidance_next_action.opened','guidance_whats_changed.opened','guidance_accessible_guide.opened','tour.started','tour.step_viewed','tour.completed','tour.dismissed','target.missing','target.timeout')),
  destination_id TEXT,
  orientation_id TEXT,
  status_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ogl_telemetry_scope_time ON ogl_telemetry_events (organization_id, tenant_id, created_at);
