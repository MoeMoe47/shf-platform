-- SYS-5C: release orchestration around the canonical Studio artifact and
-- existing provider-neutral website deployment authority.
ALTER TABLE studio_delivery_records ADD COLUMN IF NOT EXISTS artifact_id TEXT REFERENCES studio_build_artifacts(artifact_id);
CREATE INDEX IF NOT EXISTS studio_delivery_artifact_idx ON studio_delivery_records (organization_id, tenant_id, artifact_id);

CREATE TABLE IF NOT EXISTS studio_release_requests (
  release_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  artifact_id TEXT NOT NULL REFERENCES studio_build_artifacts(artifact_id),
  review_submission_id TEXT NOT NULL REFERENCES studio_review_submissions(review_submission_id),
  qa_run_id TEXT NOT NULL REFERENCES studio_qa_runs(qa_run_id),
  delivery_record_id TEXT NOT NULL REFERENCES studio_delivery_records(delivery_record_id),
  target TEXT NOT NULL CHECK (target IN ('TEST')),
  provider_key TEXT NOT NULL CHECK (provider_key IN ('local_mock')),
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','AUTHORIZED','RELEASING','RELEASED','FAILED','CANCELLED')),
  gate_decision TEXT NOT NULL CHECK (gate_decision IN ('ALLOW','DENY','BLOCKED')),
  gate_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  requested_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  provider_deployment_id TEXT,
  content_hash TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  CONSTRAINT studio_release_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT studio_release_scope_fk FOREIGN KEY (project_id, organization_id, tenant_id) REFERENCES projects(project_id, organization_id, tenant_id),
  UNIQUE (organization_id, tenant_id, idempotency_key),
  UNIQUE (release_id, organization_id, tenant_id)
);
CREATE INDEX IF NOT EXISTS studio_release_project_idx ON studio_release_requests (organization_id, tenant_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS studio_release_artifact_idx ON studio_release_requests (organization_id, tenant_id, artifact_id, created_at DESC);

CREATE TABLE IF NOT EXISTS studio_release_attempts (
  attempt_id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES studio_release_requests(release_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  artifact_id TEXT NOT NULL REFERENCES studio_build_artifacts(artifact_id),
  content_hash TEXT NOT NULL,
  provider_key TEXT NOT NULL CHECK (provider_key IN ('local_mock')),
  status TEXT NOT NULL CHECK (status IN ('RELEASING','RELEASED','FAILED')),
  provider_deployment_id TEXT,
  error_code TEXT,
  error_message TEXT,
  idempotency_key TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (release_id, attempt_number),
  UNIQUE (release_id, idempotency_key),
  CONSTRAINT studio_release_attempt_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT studio_release_attempt_scope_fk FOREIGN KEY (release_id, organization_id, tenant_id) REFERENCES studio_release_requests(release_id, organization_id, tenant_id)
);
CREATE INDEX IF NOT EXISTS studio_release_attempt_lookup_idx ON studio_release_attempts (organization_id, tenant_id, release_id, attempt_number);
