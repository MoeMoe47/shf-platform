-- Phase 7: ARAG-1 release assurance and governed release boundary.
-- These records govern release decisions; Studio, Deployment, Evidence, and
-- Truth Spine remain their canonical owners.

CREATE TABLE IF NOT EXISTS arag_release_requests (
  release_request_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  delivery_record_id TEXT NOT NULL REFERENCES studio_delivery_records(delivery_record_id),
  workspace_revision INTEGER NOT NULL CHECK (workspace_revision > 0),
  package_hash TEXT NOT NULL,
  repository_reference TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  target_environment TEXT NOT NULL,
  requested_by TEXT NOT NULL REFERENCES users(user_id),
  acting_agent_identifier TEXT,
  agent_session_id TEXT REFERENCES ai_agent_sessions(session_id),
  delegation_id TEXT REFERENCES ai_delegated_authorities(delegation_id),
  work_order_reference TEXT NOT NULL,
  policy_decision TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (policy_decision IN ('UNKNOWN','ALLOW','DENY')),
  qa_run_id TEXT NOT NULL REFERENCES studio_qa_runs(qa_run_id),
  review_submission_id TEXT NOT NULL REFERENCES studio_review_submissions(review_submission_id),
  review_decision_id TEXT NOT NULL REFERENCES studio_review_decisions(review_decision_id),
  simulation_id TEXT NOT NULL REFERENCES ai_agent_simulations(simulation_id),
  subject_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED','VALIDATING','BLOCKED','QA_REQUIRED','REVIEW_REQUIRED','APPROVAL_REQUIRED','SIMULATION_REQUIRED','ASSURANCE_READY','AUTHORIZED','RELEASING','RELEASED','FAILED','ROLLBACK_REQUIRED','ROLLED_BACK','CANCELLED')),
  blocking_codes JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT arag_release_request_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT arag_release_request_subject_unique CHECK (length(subject_hash) >= 32)
);

CREATE INDEX IF NOT EXISTS arag_release_request_scope_idx ON arag_release_requests (organization_id, tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS arag_release_request_subject_idx ON arag_release_requests (organization_id, tenant_id, project_id, workspace_revision, subject_hash);

CREATE TABLE IF NOT EXISTS arag_release_approvals (
  approval_id TEXT PRIMARY KEY,
  release_request_id TEXT NOT NULL REFERENCES arag_release_requests(release_request_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  subject_hash TEXT NOT NULL,
  approver_user_id TEXT NOT NULL REFERENCES users(user_id),
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
  rationale TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT arag_approval_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE INDEX IF NOT EXISTS arag_release_approval_scope_idx ON arag_release_approvals (organization_id, tenant_id, release_request_id, created_at DESC);

CREATE TABLE IF NOT EXISTS arag_release_authorizations (
  authorization_id TEXT PRIMARY KEY,
  release_request_id TEXT NOT NULL REFERENCES arag_release_requests(release_request_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  subject_hash TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  target_environment TEXT NOT NULL,
  authorized_by TEXT NOT NULL REFERENCES users(user_id),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT arag_authorization_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT arag_authorization_window CHECK (expires_at > valid_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS arag_release_authorization_active_idx ON arag_release_authorizations (release_request_id) WHERE used_at IS NULL AND revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS arag_release_results (
  release_result_id TEXT PRIMARY KEY,
  release_request_id TEXT NOT NULL REFERENCES arag_release_requests(release_request_id),
  authorization_id TEXT REFERENCES arag_release_authorizations(authorization_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  provider_release_id TEXT,
  target_environment TEXT NOT NULL,
  subject_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('RELEASED','FAILED','ROLLBACK_REQUIRED','ROLLED_BACK','ROLLBACK_FAILED')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  failure_code TEXT,
  failure_message TEXT,
  rollback_available BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_status TEXT,
  response_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT arag_release_result_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE INDEX IF NOT EXISTS arag_release_result_scope_idx ON arag_release_results (organization_id, tenant_id, release_request_id, created_at DESC);

CREATE TABLE IF NOT EXISTS arag_assurance_packets (
  packet_id TEXT PRIMARY KEY,
  release_request_id TEXT NOT NULL REFERENCES arag_release_requests(release_request_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  packet_version INTEGER NOT NULL DEFAULT 1,
  packet_hash TEXT NOT NULL,
  packet_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT arag_packet_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (release_request_id, packet_version)
);
CREATE INDEX IF NOT EXISTS arag_packet_scope_idx ON arag_assurance_packets (organization_id, tenant_id, release_request_id, created_at DESC);
