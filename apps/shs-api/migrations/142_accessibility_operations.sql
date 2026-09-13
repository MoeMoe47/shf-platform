-- AX-6: bounded accessibility operations and human support state.
-- Audit history remains in the canonical append-only audit_events table.
CREATE TABLE IF NOT EXISTS accessibility_operation_issues (
  issue_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id), tenant_id TEXT NOT NULL,
  source_type TEXT NOT NULL, source_id TEXT, source_route TEXT, experience TEXT, category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL','SERIOUS','MODERATE','MINOR','INFO')),
  origin TEXT NOT NULL CHECK (origin IN ('AX5_AUTOMATED','AX5_HUMAN_REVIEW','USER_REPORT','COMPANION_ESCALATION','STAFF_REPORT','REGRESSION','EXTERNAL_AUDIT')),
  finding_id TEXT, reported_by_user_id TEXT REFERENCES users(user_id), owner_user_id TEXT REFERENCES users(user_id),
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','TRIAGED','ASSIGNED','IN_REMEDIATION','READY_FOR_RETEST','RETESTING','VERIFIED','RESOLVED','CLOSED','BLOCKED','REGRESSION')),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('URGENT','HIGH','NORMAL','LOW')),
  description TEXT NOT NULL, impact TEXT, remediation_notes TEXT,
  retest_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (retest_status IN ('NOT_REQUIRED','READY','RUNNING','PASSED','FAILED')),
  verification_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (verification_status IN ('NOT_REQUIRED','REQUIRED','PENDING','COMPLETED','FAILED')),
  source_revision TEXT, privacy_classification TEXT NOT NULL DEFAULT 'INTERNAL', version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), resolved_at TIMESTAMPTZ, closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT accessibility_operation_issue_scope CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (organization_id, tenant_id, finding_id, source_route, source_id)
);
CREATE INDEX IF NOT EXISTS accessibility_operation_issue_queue_idx ON accessibility_operation_issues (organization_id, tenant_id, status, priority, updated_at DESC);

CREATE TABLE IF NOT EXISTS accessibility_support_requests (
  support_request_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id), tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(user_id), route_context TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN ('ACCESS_BARRIER','ASSISTIVE_TECH_HELP','ALTERNATIVE_FORMAT_HELP','CONTENT_ACCESS_HELP','LIVE_SESSION_ACCESS','ACCOMMODATION_PROCESS_HELP','OTHER_ACCESSIBILITY_SUPPORT')),
  summary TEXT NOT NULL, consent_to_share_context BOOLEAN NOT NULL DEFAULT FALSE, shared_context_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ASSIGNED','IN_PROGRESS','WAITING_ON_USER','ROUTED','RESOLVED','CLOSED','CANCELLED')),
  assigned_owner_user_id TEXT REFERENCES users(user_id), route TEXT CHECK (route IS NULL OR route IN ('ACCESSIBILITY_OPERATIONS','ACCOMMODATION_WORKFLOW','CONTENT_OWNER','TECHNICAL_SUPPORT','LIVE_LEARNING_SUPPORT')),
  resolution_type TEXT, linked_issue_id TEXT REFERENCES accessibility_operation_issues(issue_id), linked_accommodation_case_id TEXT REFERENCES accessibility_accommodation_cases(accommodation_case_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), resolved_at TIMESTAMPTZ,
  CONSTRAINT accessibility_support_request_scope CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE INDEX IF NOT EXISTS accessibility_support_request_queue_idx ON accessibility_support_requests (organization_id, tenant_id, status, updated_at DESC);
