-- Phase 6: durable student work state for the Studio builder boundary.
-- This is deliberately separate from submissions, QA, review, delivery,
-- Evidence, and completion. One workspace belongs to one canonical project.
CREATE TABLE IF NOT EXISTS studio_builder_workspaces (
  workspace_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE REFERENCES projects(project_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  project_type TEXT NOT NULL CHECK (project_type IN ('WEBSITE', 'AI_AGENT')),
  work_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT studio_builder_workspace_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS studio_builder_workspace_scope_idx
  ON studio_builder_workspaces (organization_id, tenant_id, project_id);
