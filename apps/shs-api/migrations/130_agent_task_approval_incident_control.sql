-- SYS-6E: generic task approval coordination and bounded security events.
-- This does not enable production side effects or replace domain approvals.

CREATE TABLE IF NOT EXISTS ai_agent_task_proposed_actions (
  proposed_action_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES ai_agent_tasks(task_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  owning_domain TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  parameter_hash TEXT NOT NULL,
  consequence_class TEXT NOT NULL CHECK (consequence_class IN ('READ_ONLY','REVERSIBLE_CHANGE','EXTERNAL_SIDE_EFFECT','CONSEQUENTIAL_HIGH_RISK')),
  side_effect_class TEXT NOT NULL,
  action_fingerprint TEXT NOT NULL,
  task_action_hash TEXT NOT NULL,
  policy_version TEXT,
  requested_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, tenant_id, task_id),
  UNIQUE (organization_id, tenant_id, action_fingerprint),
  CONSTRAINT ai_agent_task_action_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE TABLE IF NOT EXISTS ai_agent_task_approval_requests (
  approval_request_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES ai_agent_tasks(task_id),
  proposed_action_id TEXT NOT NULL REFERENCES ai_agent_task_proposed_actions(proposed_action_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  action_fingerprint TEXT NOT NULL,
  required_permission TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','DENIED','CANCELLED','EXPIRED','INVALIDATED')),
  requested_by TEXT NOT NULL REFERENCES users(user_id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, tenant_id, task_id, action_fingerprint),
  CONSTRAINT ai_agent_task_approval_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_task_approvals_pending
  ON ai_agent_task_approval_requests (organization_id, tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_task_approvals_task
  ON ai_agent_task_approval_requests (organization_id, tenant_id, task_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_agent_task_approval_decisions (
  approval_decision_id TEXT PRIMARY KEY,
  approval_request_id TEXT NOT NULL REFERENCES ai_agent_task_approval_requests(approval_request_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED','DENIED')),
  action_fingerprint TEXT NOT NULL,
  approver_user_id TEXT NOT NULL REFERENCES users(user_id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (approval_request_id, action_fingerprint, approver_user_id)
);

CREATE TABLE IF NOT EXISTS ai_governance_security_events (
  security_event_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  task_id TEXT REFERENCES ai_agent_tasks(task_id),
  session_id TEXT REFERENCES ai_agent_sessions(session_id),
  agent_identity_id TEXT REFERENCES ai_agent_identities(agent_identity_id),
  actor_user_id TEXT REFERENCES users(user_id),
  approval_request_id TEXT REFERENCES ai_agent_task_approval_requests(approval_request_id),
  policy_reference TEXT,
  action_fingerprint TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_governance_event_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_governance_events_scope
  ON ai_governance_security_events (organization_id, tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_governance_events_task
  ON ai_governance_security_events (organization_id, tenant_id, task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_governance_events_severity
  ON ai_governance_security_events (organization_id, tenant_id, severity, status, created_at DESC);
