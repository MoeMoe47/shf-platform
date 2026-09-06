-- Phase 2: Agent Input Security / Prompt-Injection Gateway.
-- This records security scans, findings, review decisions, quarantine, and
-- context-admission decisions. It does not execute agents, tools, MCP, or LLMs.

CREATE TABLE IF NOT EXISTS ai_input_security_scans (
  scan_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_ref TEXT,
  content_type TEXT,
  content_sha256 TEXT,
  scanner_provider TEXT NOT NULL,
  scanner_version TEXT NOT NULL,
  scan_status TEXT NOT NULL CHECK (scan_status IN ('NOT_SCANNED','SCANNING','CLEAR','SUSPICIOUS','BLOCKED','QUARANTINED','REVIEW_REQUIRED','SCANNER_UNAVAILABLE')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('NONE','LOW','MEDIUM','HIGH','CRITICAL','UNKNOWN')),
  finding_count INTEGER NOT NULL DEFAULT 0 CHECK (finding_count >= 0),
  decision TEXT NOT NULL CHECK (decision IN ('ALLOW','ALLOW_WITH_WARNING','REQUIRE_REVIEW','QUARANTINE','BLOCK')),
  review_required BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_by TEXT NOT NULL REFERENCES users(user_id),
  scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT ai_input_security_scan_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS ai_input_security_scan_scope_idx
  ON ai_input_security_scans (organization_id, tenant_id, resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_input_security_scan_status_idx
  ON ai_input_security_scans (organization_id, tenant_id, scan_status, risk_level, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_input_security_findings (
  finding_id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES ai_input_security_scans(scan_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('DIRECT_PROMPT_INJECTION','INDIRECT_PROMPT_INJECTION','SYSTEM_POLICY_OVERRIDE','TOOL_USE_MANIPULATION','DATA_EXFILTRATION','CROSS_AGENT_MANIPULATION','EXTERNAL_ACTION_COERCION','OBFUSCATION_HIDDEN_INSTRUCTION','APPROVAL_BYPASS','PRIVILEGE_ESCALATION_INSTRUCTION')),
  severity TEXT NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  confidence TEXT NOT NULL CHECK (confidence IN ('LOW','MEDIUM','HIGH')),
  decision_code TEXT NOT NULL,
  excerpt TEXT,
  start_offset INTEGER,
  end_offset INTEGER,
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_input_security_finding_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS ai_input_security_finding_scope_idx
  ON ai_input_security_findings (organization_id, tenant_id, resource_type, resource_id, category, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_input_security_finding_scan_idx
  ON ai_input_security_findings (scan_id, severity);

CREATE TABLE IF NOT EXISTS ai_input_security_reviews (
  review_id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES ai_input_security_scans(scan_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVE_ADMISSION','REJECT','QUARANTINE','REQUEST_REMEDIATION')),
  rationale TEXT,
  reviewed_by TEXT NOT NULL REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_input_security_review_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS ai_input_security_review_scope_idx
  ON ai_input_security_reviews (organization_id, tenant_id, scan_id, reviewed_at DESC);

CREATE TABLE IF NOT EXISTS ai_context_admission_decisions (
  admission_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  scan_id TEXT REFERENCES ai_input_security_scans(scan_id),
  session_id TEXT REFERENCES ai_agent_sessions(session_id),
  delegation_id TEXT REFERENCES ai_delegated_authorities(delegation_id),
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  resource_classification TEXT NOT NULL CHECK (resource_classification IN ('PUBLIC','INTERNAL','SENSITIVE','RESTRICTED')),
  intended_use TEXT NOT NULL,
  model_provider TEXT,
  model_identifier TEXT,
  admitted BOOLEAN NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('ALLOW','ALLOW_WITH_WARNING','REQUIRE_REVIEW','QUARANTINE','BLOCK')),
  decision_code TEXT NOT NULL,
  warning_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  security_finding_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  evaluated_by TEXT NOT NULL REFERENCES users(user_id),
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT ai_context_admission_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS ai_context_admission_scope_idx
  ON ai_context_admission_decisions (organization_id, tenant_id, resource_type, resource_id, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS ai_context_admission_decision_idx
  ON ai_context_admission_decisions (organization_id, tenant_id, admitted, decision, decision_code, evaluated_at DESC);
