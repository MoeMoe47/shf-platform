-- Phase 12: durable Studio revision lineage around the existing workspace CAS.
-- The mutable workspace remains the current working state; this table stores
-- immutable, actor-attributed snapshots for each accepted save boundary.
CREATE TABLE IF NOT EXISTS studio_project_revisions (
  revision_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  parent_revision_id TEXT REFERENCES studio_project_revisions(revision_id),
  status TEXT NOT NULL DEFAULT 'WORKING' CHECK (status IN ('WORKING', 'SUBMITTED', 'SUPERSEDED', 'FINALIZED')),
  project_type TEXT NOT NULL CHECK (project_type IN ('WEBSITE', 'AI_AGENT')),
  work_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key TEXT,
  CONSTRAINT studio_project_revision_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (project_id, revision_number),
  UNIQUE (project_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS studio_project_revision_scope_idx
  ON studio_project_revisions (organization_id, tenant_id, project_id, revision_number DESC);

ALTER TABLE studio_builder_workspaces
  ADD COLUMN IF NOT EXISTS current_revision_id TEXT REFERENCES studio_project_revisions(revision_id);

ALTER TABLE studio_qa_runs
  ADD COLUMN IF NOT EXISTS studio_revision_id TEXT REFERENCES studio_project_revisions(revision_id);

ALTER TABLE studio_review_submissions
  ADD COLUMN IF NOT EXISTS studio_revision_id TEXT REFERENCES studio_project_revisions(revision_id);

ALTER TABLE studio_delivery_records
  ADD COLUMN IF NOT EXISTS studio_revision_id TEXT REFERENCES studio_project_revisions(revision_id);
