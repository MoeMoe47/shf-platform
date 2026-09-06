-- Phase 3: Agent Simulation + Activity Ledger Foundation.
-- This records simulated plans and proposed actions only. It does not execute
-- tools, MCP, external calls, deployments, permissions, or domain writes.

CREATE TABLE IF NOT EXISTS ai_agent_simulations (
  simulation_id TEXT PRIMARY KEY,
  agent_identifier TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES ai_agent_sessions(session_id),
  delegation_id TEXT NOT NULL REFERENCES ai_delegated_authorities(delegation_id),
  principal_user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  goal TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CREATED','PLANNING','POLICY_EVALUATION','APPROVAL_REQUIRED','READY','DENIED','FAILED','COMPLETED')),
  requested_model_provider TEXT,
  requested_model_identifier TEXT,
  context_admission_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT ai_agent_simulation_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT ai_agent_simulation_completed_consistent CHECK (
    (status IN ('READY','DENIED','FAILED','COMPLETED','APPROVAL_REQUIRED') AND completed_at IS NOT NULL)
    OR (status IN ('CREATED','PLANNING','POLICY_EVALUATION') AND completed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS ai_agent_simulation_scope_idx
  ON ai_agent_simulations (organization_id, tenant_id, principal_user_id, agent_identifier, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_agent_simulation_session_idx
  ON ai_agent_simulations (organization_id, tenant_id, session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_agent_simulation_plan_steps (
  plan_step_id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL REFERENCES ai_agent_simulations(simulation_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  step_type TEXT NOT NULL CHECK (step_type IN ('READ_RESOURCE','PROPOSE_WRITE','PROPOSE_EXTERNAL_ACTION','PROPOSE_MESSAGE','PROPOSE_DEPLOYMENT','APPROVAL_CHECK','POLICY_CHECK','CONTEXT_CHECK')),
  description TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  requested_action TEXT,
  tool_type TEXT,
  tool_reference TEXT,
  model_provider TEXT,
  model_identifier TEXT,
  required_permission TEXT,
  required_delegation_scope JSONB NOT NULL DEFAULT '{}'::JSONB,
  classification_requirement TEXT,
  approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  expected_output TEXT,
  status TEXT NOT NULL CHECK (status IN ('PLANNED','READY','DENIED','APPROVAL_REQUIRED','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT ai_agent_plan_step_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT ai_agent_plan_step_unique_sequence UNIQUE (simulation_id, sequence)
);

CREATE INDEX IF NOT EXISTS ai_agent_plan_step_scope_idx
  ON ai_agent_simulation_plan_steps (organization_id, tenant_id, simulation_id, sequence);

CREATE TABLE IF NOT EXISTS ai_agent_simulation_proposed_actions (
  action_id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL REFERENCES ai_agent_simulations(simulation_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  action_type TEXT NOT NULL CHECK (action_type IN ('READ','WRITE','EXTERNAL_CALL','MESSAGE_SEND','DEPLOYMENT','PERMISSION_CHANGE','DELEGATION_CHANGE','RELEASE','WORKFLOW_TRANSITION')),
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  tool_type TEXT,
  tool_reference TEXT,
  proposed_operation TEXT NOT NULL,
  proposed_payload_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  proposed_write_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW','MODERATE','HIGH','CRITICAL')),
  authority_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  authority_code TEXT,
  policy_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  policy_code TEXT,
  security_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  security_code TEXT,
  approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  approval_type TEXT,
  approval_reason TEXT,
  predicted_side_effect TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PROPOSED','READY','DENIED','APPROVAL_REQUIRED','WRITE_PREVENTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT ai_agent_proposed_action_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT ai_agent_proposed_action_unique_sequence UNIQUE (simulation_id, sequence)
);

CREATE INDEX IF NOT EXISTS ai_agent_proposed_action_scope_idx
  ON ai_agent_simulation_proposed_actions (organization_id, tenant_id, simulation_id, sequence);
CREATE INDEX IF NOT EXISTS ai_agent_proposed_action_status_idx
  ON ai_agent_simulation_proposed_actions (organization_id, tenant_id, status, risk_level, created_at DESC);

CREATE OR REPLACE VIEW ai_agent_activity_ledger AS
SELECT
  s.simulation_id,
  s.session_id,
  s.delegation_id,
  s.agent_identifier,
  s.principal_user_id,
  s.organization_id,
  s.tenant_id,
  s.goal,
  s.purpose,
  s.status,
  s.requested_model_provider,
  s.requested_model_identifier,
  s.context_admission_ids,
  COUNT(a.action_id)::INTEGER AS proposed_action_count,
  COUNT(a.action_id) FILTER (WHERE a.status = 'DENIED')::INTEGER AS denied_action_count,
  COUNT(a.action_id) FILTER (WHERE a.approval_required)::INTEGER AS approval_required_count,
  ARRAY_REMOVE(ARRAY_AGG(DISTINCT a.security_code), NULL) AS security_codes,
  ARRAY_REMOVE(ARRAY_AGG(DISTINCT a.authority_code), NULL) AS authority_codes,
  s.started_at,
  s.completed_at,
  s.created_at,
  'SIMULATED'::TEXT AS activity_kind
FROM ai_agent_simulations s
LEFT JOIN ai_agent_simulation_proposed_actions a
  ON a.simulation_id = s.simulation_id
GROUP BY s.simulation_id;
