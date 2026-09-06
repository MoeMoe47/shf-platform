-- Phase 7 remediation: bounded ARAG work-order policy authority.
-- This is the executable policy contract consumed by ARAG-1. It does not
-- replace Identity, AI Governance, Studio QA/Review, Deployment, Evidence,
-- or Truth Spine ownership.

CREATE TABLE IF NOT EXISTS arag_work_order_policies (
  policy_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  work_order_reference TEXT NOT NULL,
  policy_version INTEGER NOT NULL CHECK (policy_version > 0),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RETIRED','REVOKED')),
  effective_from TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  allowed_project_ids JSONB NOT NULL DEFAULT '[]'::JSONB,
  allowed_repository_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  allowed_provider_keys JSONB NOT NULL DEFAULT '[]'::JSONB,
  allowed_target_environments JSONB NOT NULL DEFAULT '[]'::JSONB,
  permitted_actor_user_ids JSONB NOT NULL DEFAULT '[]'::JSONB,
  permitted_actor_roles JSONB NOT NULL DEFAULT '[]'::JSONB,
  prohibited_actions JSONB NOT NULL DEFAULT '[]'::JSONB,
  required_evidence JSONB NOT NULL DEFAULT '[]'::JSONB,
  required_qa_status TEXT NOT NULL DEFAULT 'PASSED',
  required_review_status TEXT NOT NULL DEFAULT 'APPROVED',
  required_simulation_status TEXT NOT NULL DEFAULT 'COMPLETED',
  required_approval BOOLEAN NOT NULL DEFAULT TRUE,
  policy_provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT arag_policy_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT arag_policy_window CHECK (expires_at IS NULL OR expires_at > effective_from),
  UNIQUE (organization_id, tenant_id, work_order_reference, policy_version)
);

CREATE INDEX IF NOT EXISTS arag_policy_active_scope_idx
  ON arag_work_order_policies (organization_id, tenant_id, work_order_reference, status, policy_version DESC);

ALTER TABLE arag_release_requests
  ADD COLUMN IF NOT EXISTS authority_purpose TEXT,
  ADD COLUMN IF NOT EXISTS model_provider TEXT,
  ADD COLUMN IF NOT EXISTS model_identifier TEXT,
  ADD COLUMN IF NOT EXISTS policy_version INTEGER,
  ADD COLUMN IF NOT EXISTS policy_provenance JSONB NOT NULL DEFAULT '{}'::JSONB;

ALTER TABLE arag_release_approvals
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS arag_release_approval_active_idx
  ON arag_release_approvals (release_request_id, subject_hash, decision, expires_at);
