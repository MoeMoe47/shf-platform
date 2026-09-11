-- SYS-6B: durable bounded Agent Fabric identity and pre-execution task state.
-- This migration does not add a worker or production side-effect path.

CREATE TABLE IF NOT EXISTS ai_agent_identities (
  agent_identity_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  agent_identifier TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED','REVOKED')),
  allowed_mode TEXT NOT NULL DEFAULT 'LIMITED' CHECK (allowed_mode IN ('OFF','LIMITED','ON')),
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  UNIQUE (organization_id, tenant_id, agent_identifier)
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_identities_scope_status
  ON ai_agent_identities (organization_id, tenant_id, status, agent_identifier);

CREATE TABLE IF NOT EXISTS ai_agent_tasks (
  task_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES ai_agent_sessions(session_id),
  agent_identity_id TEXT NOT NULL REFERENCES ai_agent_identities(agent_identity_id),
  delegation_id TEXT NOT NULL REFERENCES ai_delegated_authorities(delegation_id),
  principal_user_id TEXT NOT NULL REFERENCES users(user_id),
  task_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  requested_action TEXT NOT NULL,
  resource_scope JSONB NOT NULL DEFAULT '{"resources":[],"all":false}'::jsonb,
  tool_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  input_hash TEXT NOT NULL,
  action_hash TEXT NOT NULL,
  consequence_class TEXT NOT NULL CHECK (consequence_class IN ('READ_ONLY','REVERSIBLE_CHANGE','EXTERNAL_SIDE_EFFECT','CONSEQUENTIAL_HIGH_RISK')),
  policy_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','VALIDATED','AUTHORIZED','WAITING_APPROVAL','READY','PAUSED','CANCELLED','REVOKED','FAILED','COMPLETED')),
  idempotency_key TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  terminal_at TIMESTAMPTZ,
  CONSTRAINT ai_agent_tasks_input_bound CHECK (pg_column_size(input_snapshot) <= 32768),
  UNIQUE (organization_id, tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_tasks_session_status
  ON ai_agent_tasks (organization_id, tenant_id, session_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_tasks_agent_status
  ON ai_agent_tasks (organization_id, tenant_id, agent_identity_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_tasks_delegation
  ON ai_agent_tasks (organization_id, tenant_id, delegation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_agent_task_attempts (
  attempt_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES ai_agent_tasks(task_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  provider_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('FAILED','CANCELLED','REVOKED','RECORDED')),
  error_class TEXT,
  result_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL REFERENCES users(user_id),
  UNIQUE (task_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_task_attempts_task
  ON ai_agent_task_attempts (organization_id, tenant_id, task_id, sequence);
