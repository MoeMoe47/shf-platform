-- Phase 8: Studio human review. This is distinct from legacy project
-- submissions, whose accepted event feeds the verified-evidence pipeline.
CREATE TABLE IF NOT EXISTS studio_review_submissions (
  review_submission_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  project_type TEXT NOT NULL CHECK (project_type IN ('WEBSITE', 'AI_AGENT')),
  workspace_revision INTEGER NOT NULL CHECK (workspace_revision > 0),
  qa_run_id TEXT NOT NULL REFERENCES studio_qa_runs(qa_run_id),
  submitted_work_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED')),
  submitted_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT studio_review_submission_project_revision_unique UNIQUE (project_id, workspace_revision),
  CONSTRAINT studio_review_submission_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS studio_review_submission_scope_idx
  ON studio_review_submissions (organization_id, tenant_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS studio_review_submission_revision_idx
  ON studio_review_submissions (project_id, workspace_revision, created_at DESC);

CREATE TABLE IF NOT EXISTS studio_review_decisions (
  review_decision_id TEXT PRIMARY KEY,
  review_submission_id TEXT NOT NULL UNIQUE REFERENCES studio_review_submissions(review_submission_id),
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'CHANGES_REQUESTED')),
  feedback TEXT NOT NULL DEFAULT '',
  reviewed_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT studio_review_decision_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS studio_review_decision_scope_idx
  ON studio_review_decisions (organization_id, tenant_id, project_id, created_at DESC);
