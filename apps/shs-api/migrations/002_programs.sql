-- 002_programs.sql

CREATE TABLE IF NOT EXISTS programs (
  program_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  name TEXT NOT NULL,
  program_type TEXT NOT NULL,
  status TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  owner_team_id TEXT REFERENCES teams(team_id),
  metadata_json JSONB,
  created_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
