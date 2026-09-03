CREATE UNIQUE INDEX IF NOT EXISTS studio_agent_package_project_scope_unique_idx
  ON projects (project_id, organization_id, tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS studio_agent_package_delivery_project_scope_unique_idx
  ON studio_delivery_records (delivery_record_id, project_id, organization_id, tenant_id);

CREATE TABLE IF NOT EXISTS studio_agent_packages (
  package_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  learner_id TEXT NOT NULL REFERENCES users(user_id),
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  delivery_record_id TEXT NOT NULL REFERENCES studio_delivery_records(delivery_record_id),
  workspace_revision INTEGER NOT NULL CHECK (workspace_revision > 0),
  project_type TEXT NOT NULL CHECK (project_type = 'AI_AGENT'),
  package_version INTEGER NOT NULL CHECK (package_version > 0),
  standard_version TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  package_json JSONB NOT NULL,
  package_hash TEXT NOT NULL CHECK (package_hash ~ '^[0-9a-f]{64}$'),
  validation_status TEXT NOT NULL CHECK (validation_status IN ('VALID','INVALID')),
  validation_results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT studio_agent_package_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT studio_agent_package_learner_scope_fk FOREIGN KEY (organization_id, learner_id) REFERENCES users(organization_id, user_id),
  CONSTRAINT studio_agent_package_project_scope_fk FOREIGN KEY (project_id, organization_id, tenant_id) REFERENCES projects(project_id, organization_id, tenant_id),
  CONSTRAINT studio_agent_package_delivery_scope_fk FOREIGN KEY (delivery_record_id, project_id, organization_id, tenant_id) REFERENCES studio_delivery_records(delivery_record_id, project_id, organization_id, tenant_id),
  CONSTRAINT studio_agent_package_source_revision CHECK ((package_json->'provenance'->>'workspaceRevision')::integer = workspace_revision)
);

CREATE UNIQUE INDEX IF NOT EXISTS studio_agent_package_identity_idx
  ON studio_agent_packages (organization_id, tenant_id, project_id, delivery_record_id, workspace_revision, standard_version);
CREATE INDEX IF NOT EXISTS studio_agent_package_scope_idx
  ON studio_agent_packages (organization_id, tenant_id, learner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS studio_agent_package_project_idx
  ON studio_agent_packages (organization_id, tenant_id, project_id, workspace_revision DESC);
