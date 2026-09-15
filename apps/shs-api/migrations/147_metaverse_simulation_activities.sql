-- MET-13: Activities, Simulations + District Depth.
-- Bounded runtime/session persistence for metaverse simulation activities
-- only. The simulation catalog itself (task steps, objectives, retry
-- policy, evidence/assessment boundary, team mode, district/facility
-- placement) is a declarative in-code registry (see
-- apps/shs-api/src/domain/metaverse/simulations/registry/simulation-registry.ts),
-- exactly like the MET-2 city registry. This migration only persists
-- runtime progress so a learner can resume a simulation, and does not
-- create a second assignment, curriculum, assessment, mission, evidence,
-- credential, career, or team-membership authority.
--
-- Completion here is an operational fact only (see
-- simulation-evidence-adapter.ts): it can describe itself as an evidence
-- candidate, but it never sets a verified/mastery flag. Team membership is
-- read from the canonical studio_team_members table (082) and never
-- self-declared by the client.

CREATE TABLE IF NOT EXISTS metaverse_simulation_sessions (
  session_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  learner_user_id TEXT NOT NULL REFERENCES users(user_id),
  simulation_id TEXT NOT NULL,
  district_id TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  simulation_type TEXT NOT NULL,
  participation_mode TEXT NOT NULL CHECK (participation_mode IN ('INDIVIDUAL', 'TEAM')),
  team_session_ref TEXT,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
  current_step_index INTEGER NOT NULL DEFAULT 0,
  completed_step_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  responses_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  retry_count INTEGER NOT NULL DEFAULT 0,
  retry_status TEXT NOT NULL DEFAULT 'NONE' CHECK (retry_status IN ('NONE', 'AVAILABLE', 'BLOCKED', 'AWAITING_INSTRUCTOR')),
  completion_result JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS metaverse_simulation_session_learner_idx
  ON metaverse_simulation_sessions (organization_id, tenant_id, learner_user_id, simulation_id);

-- Only one in-progress attempt per learner/simulation at a time; retries
-- reuse this row (increment retry_count) rather than forking new rows,
-- so retry-policy limits cannot be bypassed by starting a fresh session.
CREATE UNIQUE INDEX IF NOT EXISTS metaverse_simulation_session_active_uk
  ON metaverse_simulation_sessions (organization_id, tenant_id, learner_user_id, simulation_id)
  WHERE status = 'IN_PROGRESS';

CREATE TABLE IF NOT EXISTS metaverse_simulation_artifacts (
  artifact_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES metaverse_simulation_sessions(session_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN (
    'TEXT_REFLECTION', 'CONFIG_SUBMISSION', 'DESIGN_NOTE', 'LINK_REFERENCE', 'STRUCTURED_RESPONSE'
  )),
  step_id TEXT,
  content_json JSONB NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS metaverse_simulation_artifact_session_idx
  ON metaverse_simulation_artifacts (session_id, organization_id, tenant_id);
