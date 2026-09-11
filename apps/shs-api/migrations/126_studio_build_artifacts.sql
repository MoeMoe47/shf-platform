-- SYS-5B: immutable materialized output for an exact Studio workspace revision.
-- Metadata/manifest authority is separate from deployment storage and Evidence.
CREATE UNIQUE INDEX IF NOT EXISTS projects_scope_unique_idx
  ON projects (project_id, organization_id, tenant_id);

CREATE TABLE IF NOT EXISTS studio_build_artifacts (
  artifact_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  workspace_id TEXT REFERENCES studio_builder_workspaces(workspace_id),
  workspace_revision INTEGER NOT NULL CHECK (workspace_revision > 0),
  studio_revision_id TEXT REFERENCES studio_project_revisions(revision_id),
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('WORKSPACE_MATERIALIZATION')),
  manifest_json JSONB NOT NULL,
  content_hash TEXT NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT studio_build_artifact_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT studio_build_artifact_manifest_bounded CHECK (pg_column_size(manifest_json) <= 300000),
  CONSTRAINT studio_build_artifact_scope_fk FOREIGN KEY (project_id, organization_id, tenant_id)
    REFERENCES projects(project_id, organization_id, tenant_id),
  UNIQUE (project_id, workspace_revision)
);

CREATE INDEX IF NOT EXISTS studio_build_artifact_scope_idx
  ON studio_build_artifacts (organization_id, tenant_id, project_id, workspace_revision DESC);
CREATE INDEX IF NOT EXISTS studio_build_artifact_revision_idx
  ON studio_build_artifacts (organization_id, tenant_id, studio_revision_id);

ALTER TABLE studio_qa_runs ADD COLUMN IF NOT EXISTS artifact_id TEXT REFERENCES studio_build_artifacts(artifact_id);
ALTER TABLE studio_review_submissions ADD COLUMN IF NOT EXISTS artifact_id TEXT REFERENCES studio_build_artifacts(artifact_id);

CREATE INDEX IF NOT EXISTS studio_qa_runs_artifact_idx ON studio_qa_runs (organization_id, tenant_id, artifact_id);
CREATE INDEX IF NOT EXISTS studio_review_submissions_artifact_idx ON studio_review_submissions (organization_id, tenant_id, artifact_id);
