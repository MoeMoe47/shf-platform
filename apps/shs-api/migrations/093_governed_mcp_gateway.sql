-- Phase 5: governed MCP gateway. Discovery and invocation remain simulation-only.
-- Server metadata is descriptive; authority remains in AI Governance.

CREATE TABLE IF NOT EXISTS mcp_servers (
  mcp_server_id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(organization_id),
  tenant_id TEXT,
  display_name TEXT NOT NULL,
  provider_identifier TEXT NOT NULL,
  endpoint_reference TEXT NOT NULL,
  transport_type TEXT NOT NULL CHECK (transport_type IN ('STDIO','SSE','STREAMABLE_HTTP','INERT')),
  trust_status TEXT NOT NULL CHECK (trust_status IN ('LOCAL_CONFIGURED','ADMIN_APPROVED','UNVERIFIED')),
  lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('PENDING','APPROVED','ACTIVE','DISABLED','REVOKED')),
  credential_reference TEXT,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  approved_by TEXT REFERENCES users(user_id),
  approved_at TIMESTAMPTZ,
  disabled_by TEXT REFERENCES users(user_id),
  disabled_at TIMESTAMPTZ,
  revoked_by TEXT REFERENCES users(user_id),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT mcp_server_scope_consistent CHECK ((organization_id IS NULL AND tenant_id IS NULL) OR (organization_id IS NOT NULL AND tenant_id = 'tenant:' || organization_id))
);

CREATE INDEX IF NOT EXISTS mcp_server_scope_idx ON mcp_servers (organization_id, tenant_id, lifecycle_status, created_at DESC);

CREATE TABLE IF NOT EXISTS mcp_tools (
  mcp_tool_id TEXT PRIMARY KEY,
  mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(mcp_server_id),
  tool_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  input_schema_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  output_schema_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  side_effect_class TEXT NOT NULL CHECK (side_effect_class IN ('READ_ONLY','PROPOSED_WRITE','COMMUNICATION','DESTRUCTIVE','DEPLOYMENT','SECURITY_SENSITIVE','FINANCIAL')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW','MODERATE','HIGH','CRITICAL')),
  required_approval_profile TEXT NOT NULL DEFAULT 'NONE',
  discovery_version TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE (mcp_server_id, tool_key)
);

CREATE INDEX IF NOT EXISTS mcp_tool_server_idx ON mcp_tools (mcp_server_id, enabled, side_effect_class);

CREATE TABLE IF NOT EXISTS mcp_resources (
  mcp_resource_id TEXT PRIMARY KEY,
  mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(mcp_server_id),
  resource_uri TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  media_type TEXT,
  external_classification_hint TEXT,
  bos_classification TEXT CHECK (bos_classification IS NULL OR bos_classification IN ('PUBLIC','INTERNAL','SENSITIVE','RESTRICTED')),
  organization_id TEXT,
  tenant_id TEXT,
  provenance_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (mcp_server_id, resource_uri),
  CONSTRAINT mcp_resource_scope_consistent CHECK ((organization_id IS NULL AND tenant_id IS NULL) OR (organization_id IS NOT NULL AND tenant_id = 'tenant:' || organization_id))
);

CREATE INDEX IF NOT EXISTS mcp_resource_server_idx ON mcp_resources (mcp_server_id, enabled, resource_type);

CREATE TABLE IF NOT EXISTS mcp_tool_policies (
  mcp_tool_policy_id TEXT PRIMARY KEY,
  mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(mcp_server_id),
  mcp_tool_id TEXT NOT NULL REFERENCES mcp_tools(mcp_tool_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  agent_identifier TEXT,
  purpose TEXT,
  allowed BOOLEAN NOT NULL DEFAULT FALSE,
  classification_ceiling TEXT NOT NULL DEFAULT 'INTERNAL' CHECK (classification_ceiling IN ('PUBLIC','INTERNAL','SENSITIVE','RESTRICTED')),
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mcp_tool_policy_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (organization_id, tenant_id, mcp_tool_id, agent_identifier, purpose)
);

CREATE INDEX IF NOT EXISTS mcp_tool_policy_scope_idx ON mcp_tool_policies (organization_id, tenant_id, mcp_server_id, mcp_tool_id, allowed);

CREATE TABLE IF NOT EXISTS mcp_invocations (
  mcp_invocation_id TEXT PRIMARY KEY,
  mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(mcp_server_id),
  mcp_tool_id TEXT REFERENCES mcp_tools(mcp_tool_id),
  mcp_resource_id TEXT REFERENCES mcp_resources(mcp_resource_id),
  simulation_id TEXT REFERENCES ai_agent_simulations(simulation_id),
  conductor_request_id TEXT REFERENCES bos_conductor_requests(conductor_request_id),
  session_id TEXT REFERENCES ai_agent_sessions(session_id),
  delegation_id TEXT REFERENCES ai_delegated_authorities(delegation_id),
  principal_user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  requested_action TEXT NOT NULL,
  side_effect_class TEXT NOT NULL,
  authority_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  authority_code TEXT,
  policy_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  policy_code TEXT,
  classification TEXT,
  security_code TEXT,
  approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('SIMULATED','DENIED','SECURITY_DENIED','APPROVAL_REQUIRED')),
  input_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  provenance_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mcp_invocation_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS mcp_invocation_scope_idx ON mcp_invocations (organization_id, tenant_id, created_at DESC);

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
  ARRAY_REMOVE(ARRAY_AGG(DISTINCT m.mcp_tool_id), NULL) AS mcp_tool_ids
FROM ai_agent_simulations s
LEFT JOIN ai_agent_simulation_proposed_actions a ON a.simulation_id = s.simulation_id
LEFT JOIN mcp_invocations m ON m.simulation_id = s.simulation_id
GROUP BY s.simulation_id;
