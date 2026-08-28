-- 009_grant_binders.sql

CREATE TABLE IF NOT EXISTS grant_binders (
  binder_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  title TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL DEFAULT 'draft' CHECK (lifecycle_status IN ('draft')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grant_binders_scope
  ON grant_binders (tenant_id, organization_id, updated_at DESC);
