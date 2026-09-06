-- Phase 4: BOS Conductor Controlled Orchestration.
-- Conductor coordinates interpretation, planning, and simulations only.
-- It does not execute operational actions, MCP, external calls, or Truth writes.

CREATE TABLE IF NOT EXISTS bos_conductor_requests (
  conductor_request_id TEXT PRIMARY KEY,
  principal_user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  goal TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CREATED','ANALYZING','PLANNING','SIMULATING','APPROVAL_REQUIRED','BLOCKED','READY','COMPLETED','FAILED')),
  source_session_id TEXT REFERENCES ai_agent_sessions(session_id),
  requested_operation_ref TEXT,
  interpretation_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  unresolved_questions_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  risk_summary_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  result_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  failure_reason TEXT,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT bos_conductor_request_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT bos_conductor_request_completed_consistent CHECK (
    (status IN ('APPROVAL_REQUIRED','BLOCKED','READY','COMPLETED','FAILED') AND completed_at IS NOT NULL)
    OR (status IN ('CREATED','ANALYZING','PLANNING','SIMULATING') AND completed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS bos_conductor_request_scope_idx
  ON bos_conductor_requests (organization_id, tenant_id, principal_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bos_conductor_request_status_idx
  ON bos_conductor_requests (organization_id, tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS bos_conductor_tasks (
  conductor_task_id TEXT PRIMARY KEY,
  conductor_request_id TEXT NOT NULL REFERENCES bos_conductor_requests(conductor_request_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  dependency_task_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  description TEXT NOT NULL,
  capability TEXT NOT NULL CHECK (capability IN ('READ_RESOURCE','ANALYZE_DOCUMENT','SUMMARIZE','GENERATE_REPORT_DRAFT','PROPOSE_WORKFLOW_ACTION','PROPOSE_MESSAGE','PROPOSE_DEPLOYMENT','SIMULATE_RELEASE','QUERY_VERIFIED_OUTCOMES')),
  candidate_agent_identifier TEXT,
  resource_refs_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  model_provider TEXT,
  model_identifier TEXT,
  simulation_required BOOLEAN NOT NULL DEFAULT TRUE,
  simulation_id TEXT REFERENCES ai_agent_simulations(simulation_id),
  approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  approval_reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('PLANNED','SIMULATION_REQUESTED','READY','APPROVAL_REQUIRED','BLOCKED','DENIED','FAILED')),
  decision_code TEXT,
  explanation TEXT,
  expected_output TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT bos_conductor_task_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT bos_conductor_task_unique_sequence UNIQUE (conductor_request_id, sequence)
);

CREATE INDEX IF NOT EXISTS bos_conductor_task_scope_idx
  ON bos_conductor_tasks (organization_id, tenant_id, conductor_request_id, sequence);
CREATE INDEX IF NOT EXISTS bos_conductor_task_simulation_idx
  ON bos_conductor_tasks (organization_id, tenant_id, simulation_id);

ALTER TABLE ai_agent_simulations
  ADD COLUMN IF NOT EXISTS conductor_request_id TEXT REFERENCES bos_conductor_requests(conductor_request_id);

CREATE INDEX IF NOT EXISTS ai_agent_simulation_conductor_idx
  ON ai_agent_simulations (organization_id, tenant_id, conductor_request_id, created_at DESC);

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
  'SIMULATED'::TEXT AS activity_kind,
  s.conductor_request_id
FROM ai_agent_simulations s
LEFT JOIN ai_agent_simulation_proposed_actions a
  ON a.simulation_id = s.simulation_id
GROUP BY s.simulation_id;
