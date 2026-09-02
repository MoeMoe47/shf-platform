-- Phase 9: exact approved Studio revision finalization. This is not public
-- deployment, Evidence, completion, Portfolio, credentials, or ClientOps.
CREATE TABLE IF NOT EXISTS studio_delivery_records (
  delivery_record_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  submission_id TEXT NOT NULL UNIQUE REFERENCES studio_review_submissions(review_submission_id),
  review_decision_id TEXT NOT NULL REFERENCES studio_review_decisions(review_decision_id),
  qa_run_id TEXT NOT NULL REFERENCES studio_qa_runs(qa_run_id),
  workspace_revision INTEGER NOT NULL CHECK (workspace_revision > 0),
  project_type TEXT NOT NULL CHECK (project_type IN ('WEBSITE', 'AI_AGENT')),
  destination TEXT NOT NULL CHECK (destination IN ('STUDENT', 'COMMERCIAL')),
  status TEXT NOT NULL CHECK (status IN ('FINALIZED', 'FAILED')),
  requested_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_by_user_id TEXT REFERENCES users(user_id),
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT studio_delivery_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT studio_delivery_finalized_fields CHECK ((status = 'FINALIZED' AND finalized_by_user_id IS NOT NULL AND finalized_at IS NOT NULL) OR status = 'FAILED')
);

CREATE INDEX IF NOT EXISTS studio_delivery_scope_idx
  ON studio_delivery_records (organization_id, tenant_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS studio_delivery_revision_idx
  ON studio_delivery_records (project_id, workspace_revision, created_at DESC);
