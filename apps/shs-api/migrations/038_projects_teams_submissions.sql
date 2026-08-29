-- Phase 30: generic educational project/team/submission foundation.
CREATE TABLE IF NOT EXISTS projects (
  project_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  program_id TEXT REFERENCES programs(program_id),
  course_id TEXT,
  title TEXT NOT NULL,
  project_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS project_teams (
  team_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('COLLABORATIVE_MODE', 'INDIVIDUAL_INTEGRATED_MODE')),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS project_team_members (
  membership_id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES project_teams(team_id),
  learner_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  specialization_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE (team_id, learner_id)
);
CREATE TABLE IF NOT EXISTS project_submissions (
  submission_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  team_id TEXT NOT NULL REFERENCES project_teams(team_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  submitted_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  version INTEGER NOT NULL CHECK (version > 0),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  artifact_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED', 'NEEDS_REVISION', 'ACCEPTED')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, version)
);
CREATE INDEX IF NOT EXISTS project_scope_idx ON projects (tenant_id, organization_id, project_id);
CREATE INDEX IF NOT EXISTS project_team_scope_idx ON project_teams (tenant_id, organization_id, project_id);
CREATE INDEX IF NOT EXISTS project_submission_scope_idx ON project_submissions (tenant_id, organization_id, project_id, team_id);
