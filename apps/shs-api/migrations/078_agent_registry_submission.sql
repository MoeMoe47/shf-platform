CREATE UNIQUE INDEX IF NOT EXISTS studio_agent_package_scope_unique_idx
  ON studio_agent_packages (package_id, organization_id, tenant_id);

CREATE TABLE IF NOT EXISTS agent_registry_submissions (
  submission_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  learner_id TEXT NOT NULL REFERENCES users(user_id),
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  package_id TEXT NOT NULL REFERENCES studio_agent_packages(package_id),
  package_version INTEGER NOT NULL CHECK (package_version > 0),
  package_hash TEXT NOT NULL CHECK (package_hash ~ '^[0-9a-f]{64}$'),
  registry_provider TEXT NOT NULL CHECK (registry_provider = 'local_test_registry'),
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED','UNDER_REVIEW','CHANGES_REQUIRED','ACCEPTED','REJECTED','FAILED','WITHDRAWN')),
  registry_reference TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  failure_code TEXT,
  failure_message TEXT,
  resubmission_of TEXT REFERENCES agent_registry_submissions(submission_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT agent_registry_submission_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT agent_registry_submission_scope_fk FOREIGN KEY (organization_id, learner_id) REFERENCES users(organization_id, user_id),
  CONSTRAINT agent_registry_submission_project_scope_fk FOREIGN KEY (project_id, organization_id, tenant_id) REFERENCES projects(project_id, organization_id, tenant_id),
  CONSTRAINT agent_registry_submission_package_scope_fk FOREIGN KEY (package_id, organization_id, tenant_id) REFERENCES studio_agent_packages(package_id, organization_id, tenant_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS agent_registry_submission_active_identity_idx ON agent_registry_submissions (organization_id, tenant_id, package_id, registry_provider) WHERE status NOT IN ('FAILED','REJECTED','WITHDRAWN');
CREATE INDEX IF NOT EXISTS agent_registry_submission_scope_idx ON agent_registry_submissions (organization_id, tenant_id, learner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_registry_submission_package_idx ON agent_registry_submissions (organization_id, tenant_id, package_id, created_at DESC);
