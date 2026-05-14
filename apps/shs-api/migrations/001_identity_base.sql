-- 001_identity_base.sql

CREATE TABLE IF NOT EXISTS organizations (
  organization_id TEXT PRIMARY KEY,
  legal_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  org_type TEXT NOT NULL,
  status TEXT NOT NULL,
  primary_domain TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  status TEXT NOT NULL,
  identity_source TEXT NOT NULL,
  external_subject_id TEXT,
  timezone TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP,
  UNIQUE (organization_id, email)
);

CREATE TABLE IF NOT EXISTS teams (
  team_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  name TEXT NOT NULL,
  team_type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS roles (
  role_id TEXT PRIMARY KEY,
  organization_id TEXT,
  role_name TEXT NOT NULL,
  role_scope_type TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_permission_id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(role_id),
  permission_name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (role_id, permission_name)
);

CREATE TABLE IF NOT EXISTS memberships (
  membership_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  team_id TEXT REFERENCES teams(team_id),
  role_id TEXT NOT NULL REFERENCES roles(role_id),
  status TEXT NOT NULL,
  effective_from TIMESTAMP NOT NULL,
  effective_to TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
