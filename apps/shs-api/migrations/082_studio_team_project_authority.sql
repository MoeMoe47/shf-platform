-- Studio V1+ Phase 11: durable Studio team authority.
-- This is intentionally separate from legacy staff `teams` and from the
-- generic project-submission team model.
CREATE TABLE IF NOT EXISTS studio_teams (
  studio_team_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS studio_team_members (
  studio_team_membership_id TEXT PRIMARY KEY,
  studio_team_id TEXT NOT NULL REFERENCES studio_teams(studio_team_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('LEAD', 'MEMBER')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REMOVED')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  added_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (studio_team_id, user_id)
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS studio_owner_type TEXT NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS studio_team_id TEXT REFERENCES studio_teams(studio_team_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_owner_type_check') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_studio_owner_type_check CHECK (studio_owner_type IN ('INDIVIDUAL', 'TEAM'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_team_owner_check') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_studio_team_owner_check CHECK ((studio_owner_type = 'TEAM' AND studio_team_id IS NOT NULL) OR (studio_owner_type = 'INDIVIDUAL' AND studio_team_id IS NULL));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS studio_team_active_membership_idx
  ON studio_team_members (studio_team_id, user_id)
  WHERE status = 'ACTIVE' AND left_at IS NULL;
CREATE INDEX IF NOT EXISTS studio_team_scope_idx ON studio_teams (organization_id, tenant_id, status, studio_team_id);
CREATE INDEX IF NOT EXISTS studio_team_member_scope_idx ON studio_team_members (organization_id, tenant_id, user_id, status);
CREATE INDEX IF NOT EXISTS projects_studio_team_scope_idx ON projects (organization_id, tenant_id, studio_team_id, studio_owner_type);
