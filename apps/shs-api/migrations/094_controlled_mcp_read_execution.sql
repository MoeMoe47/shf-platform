-- Phase 6A: controlled read-only MCP execution.
-- External responses remain untrusted and are admitted only after Input Security.

ALTER TABLE mcp_invocations
  ADD COLUMN IF NOT EXISTS execution_mode TEXT NOT NULL DEFAULT 'SIMULATED'
    CHECK (execution_mode IN ('SIMULATED','REAL_READ'));

ALTER TABLE mcp_invocations
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS response_status INTEGER,
  ADD COLUMN IF NOT EXISTS result_admission_status TEXT
    CHECK (result_admission_status IS NULL OR result_admission_status IN ('RECEIVED','SCANNING','ADMITTED','BLOCKED','QUARANTINED','REVIEW_REQUIRED','FAILED')),
  ADD COLUMN IF NOT EXISTS provenance_reference TEXT;

ALTER TABLE mcp_tool_policies
  ADD COLUMN IF NOT EXISTS live_read_allowed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE mcp_invocations DROP CONSTRAINT IF EXISTS mcp_invocations_status_check;
ALTER TABLE mcp_invocations
  ADD CONSTRAINT mcp_invocations_status_check CHECK (status IN ('SIMULATED','DENIED','SECURITY_DENIED','APPROVAL_REQUIRED','REAL_READ'));

CREATE TABLE IF NOT EXISTS mcp_read_results (
  mcp_read_result_id TEXT PRIMARY KEY,
  mcp_invocation_id TEXT NOT NULL REFERENCES mcp_invocations(mcp_invocation_id),
  mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(mcp_server_id),
  mcp_tool_id TEXT NOT NULL REFERENCES mcp_tools(mcp_tool_id),
  mcp_resource_id TEXT REFERENCES mcp_resources(mcp_resource_id),
  principal_user_id TEXT NOT NULL REFERENCES users(user_id),
  agent_identifier TEXT,
  session_id TEXT REFERENCES ai_agent_sessions(session_id),
  delegation_id TEXT REFERENCES ai_delegated_authorities(delegation_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  source_identity TEXT NOT NULL,
  content_type TEXT,
  response_sha256 TEXT NOT NULL,
  response_bytes INTEGER NOT NULL DEFAULT 0,
  response_status INTEGER,
  security_scan_id TEXT REFERENCES ai_input_security_scans(scan_id),
  context_admission_id TEXT REFERENCES ai_context_admission_decisions(admission_id),
  admission_status TEXT NOT NULL CHECK (admission_status IN ('RECEIVED','SCANNING','ADMITTED','BLOCKED','QUARANTINED','REVIEW_REQUIRED','FAILED')),
  failure_code TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provenance_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT mcp_read_result_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS mcp_read_result_scope_idx
  ON mcp_read_results (organization_id, tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS mcp_read_result_invocation_idx
  ON mcp_read_results (mcp_invocation_id, created_at DESC);

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
  s.conductor_request_id,
  COUNT(m.mcp_invocation_id)::INTEGER AS mcp_invocation_count,
  ARRAY_REMOVE(ARRAY_AGG(DISTINCT m.mcp_server_id), NULL) AS mcp_server_ids,
  ARRAY_REMOVE(ARRAY_AGG(DISTINCT m.mcp_tool_id), NULL) AS mcp_tool_ids,
  COUNT(mr.mcp_read_result_id)::INTEGER AS real_read_count,
  ARRAY_REMOVE(ARRAY_AGG(DISTINCT mr.mcp_server_id), NULL) AS real_read_server_ids,
  ARRAY_REMOVE(ARRAY_AGG(DISTINCT mr.mcp_tool_id), NULL) AS real_read_tool_ids,
  ARRAY_REMOVE(ARRAY_AGG(DISTINCT mr.admission_status), NULL) AS real_read_admission_statuses
FROM ai_agent_simulations s
LEFT JOIN ai_agent_simulation_proposed_actions a ON a.simulation_id = s.simulation_id
LEFT JOIN mcp_invocations m ON m.simulation_id = s.simulation_id
LEFT JOIN mcp_read_results mr ON mr.session_id = s.session_id
GROUP BY s.simulation_id;
