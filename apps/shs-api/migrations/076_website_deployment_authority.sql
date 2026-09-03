-- V1+ Phase 4: provider-neutral Website deployment authority.
-- This table records publication state only; Studio delivery remains authoritative
-- for QA, review, finalization, and exact revision eligibility.
CREATE UNIQUE INDEX IF NOT EXISTS studio_delivery_scope_unique_idx
  ON studio_delivery_records (delivery_record_id, organization_id, tenant_id);

CREATE TABLE IF NOT EXISTS website_deployment_records (
  deployment_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  learner_id TEXT NOT NULL REFERENCES users(user_id),
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  delivery_record_id TEXT NOT NULL REFERENCES studio_delivery_records(delivery_record_id),
  workspace_revision INTEGER NOT NULL CHECK (workspace_revision > 0),
  project_type TEXT NOT NULL CHECK (project_type = 'WEBSITE'),
  provider_key TEXT NOT NULL CHECK (provider_key IN ('local_mock')),
  target TEXT NOT NULL DEFAULT 'TEST' CHECK (target IN ('TEST')),
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','QUEUED','DEPLOYING','LIVE','FAILED','SUPERSEDED','UNPUBLISHED')),
  provider_deployment_id TEXT,
  live_url TEXT,
  package_hash TEXT NOT NULL,
  failure_code TEXT,
  failure_message TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  superseded_at TIMESTAMPTZ,
  unpublished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT website_deployment_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT website_deployment_learner_scope_fk FOREIGN KEY (organization_id, learner_id)
    REFERENCES users(organization_id, user_id),
  CONSTRAINT website_deployment_delivery_scope_fk FOREIGN KEY (delivery_record_id, organization_id, tenant_id)
    REFERENCES studio_delivery_records(delivery_record_id, organization_id, tenant_id),
  CONSTRAINT website_deployment_status_fields CHECK (
    (status = 'LIVE' AND provider_deployment_id IS NOT NULL AND deployed_at IS NOT NULL)
    OR (status <> 'LIVE')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS website_deployment_active_identity_idx
  ON website_deployment_records (organization_id, tenant_id, project_id, delivery_record_id, workspace_revision, provider_key, target)
  WHERE status NOT IN ('FAILED','SUPERSEDED','UNPUBLISHED');

CREATE INDEX IF NOT EXISTS website_deployment_scope_idx
  ON website_deployment_records (organization_id, tenant_id, learner_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS website_deployment_project_idx
  ON website_deployment_records (organization_id, tenant_id, project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS website_deployment_delivery_idx
  ON website_deployment_records (organization_id, tenant_id, delivery_record_id, workspace_revision);
