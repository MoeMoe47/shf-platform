-- Phase 7: revision-bound QA runs. QA is separate from review, delivery,
-- Evidence, completion, and reporting authority.
CREATE TABLE IF NOT EXISTS studio_qa_runs (
  qa_run_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  project_type TEXT NOT NULL CHECK (project_type IN ('WEBSITE', 'AI_AGENT')),
  workspace_revision INTEGER NOT NULL CHECK (workspace_revision >= 0),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'PASSED', 'FAILED', 'ERROR')),
  ruleset_version TEXT NOT NULL,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  findings_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT studio_qa_runs_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS studio_qa_runs_scope_idx
  ON studio_qa_runs (organization_id, tenant_id, project_id, workspace_revision, created_at DESC);

CREATE INDEX IF NOT EXISTS studio_qa_runs_project_latest_idx
  ON studio_qa_runs (project_id, workspace_revision, created_at DESC);
