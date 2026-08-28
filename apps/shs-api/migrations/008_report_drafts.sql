-- 008_report_drafts.sql

CREATE TABLE IF NOT EXISTS report_drafts (
  report_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  updated_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  report_type TEXT NOT NULL,
  report_title TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  brand_mode TEXT NOT NULL,
  visibility TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL DEFAULT 'draft' CHECK (lifecycle_status IN ('draft', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  draft_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_draft_revisions (
  revision_id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES report_drafts(report_id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  version INTEGER NOT NULL CHECK (version > 0),
  snapshot_json JSONB NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (report_id, version)
);

CREATE INDEX IF NOT EXISTS idx_report_drafts_scope
  ON report_drafts (tenant_id, organization_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_draft_revisions_scope
  ON report_draft_revisions (tenant_id, organization_id, report_id, version DESC);
