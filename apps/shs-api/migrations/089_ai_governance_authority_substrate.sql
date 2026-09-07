-- Phase 1: Governed AI Authority Substrate.
-- This migration creates authority records only. It does not introduce
-- autonomous execution, MCP, model routing, prompt scanning, or Truth facts.

CREATE TABLE IF NOT EXISTS ai_delegated_authorities (
  delegation_id TEXT PRIMARY KEY,
  principal_user_id TEXT NOT NULL REFERENCES users(user_id),
  agent_identifier TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  resource_scope JSONB NOT NULL,
  allowed_actions TEXT[] NOT NULL,
  forbidden_actions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  autonomy_profile TEXT NOT NULL DEFAULT 'LEVEL_1_RECOMMEND'
    CHECK (autonomy_profile IN ('LEVEL_0_OBSERVE','LEVEL_1_RECOMMEND','LEVEL_2_DRAFT','LEVEL_3_APPROVAL_REQUIRED','LEVEL_4_BOUNDED_AUTONOMOUS','LEVEL_5_HIGH_AUTONOMY')),
  model_provider_constraint TEXT,
  model_identifier_constraint TEXT,
  restricted_resource_access BOOLEAN NOT NULL DEFAULT FALSE,
  allow_redelegation BOOLEAN NOT NULL DEFAULT FALSE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT REFERENCES users(user_id),
  revocation_reason TEXT,
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT ai_delegated_authority_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT ai_delegated_authority_finite_window CHECK (expires_at > valid_from),
  CONSTRAINT ai_delegated_authority_nonempty_actions CHECK (array_length(allowed_actions, 1) > 0),
  CONSTRAINT ai_delegated_authority_no_action_overlap CHECK (NOT (allowed_actions && forbidden_actions)),
  CONSTRAINT ai_delegated_authority_resource_scope_object CHECK (jsonb_typeof(resource_scope) = 'object'),
  CONSTRAINT ai_delegated_authority_revocation_consistent CHECK (
    (revoked_at IS NULL AND revoked_by IS NULL)
    OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS ai_delegated_authority_scope_idx
  ON ai_delegated_authorities (organization_id, tenant_id, principal_user_id, agent_identifier, expires_at DESC);
CREATE INDEX IF NOT EXISTS ai_delegated_authority_active_idx
  ON ai_delegated_authorities (organization_id, tenant_id, agent_identifier, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS ai_resource_classifications (
  classification_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('PUBLIC','INTERNAL','SENSITIVE','RESTRICTED')),
  classification_reason TEXT,
  classified_by TEXT NOT NULL REFERENCES users(user_id),
  superseded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT ai_resource_classification_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_resource_classification_current_idx
  ON ai_resource_classifications (organization_id, tenant_id, resource_type, resource_id)
  WHERE superseded_at IS NULL;
CREATE INDEX IF NOT EXISTS ai_resource_classification_scope_idx
  ON ai_resource_classifications (organization_id, tenant_id, classification, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_approved_models (
  model_policy_id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(organization_id),
  tenant_id TEXT,
  provider_identifier TEXT NOT NULL,
  model_identifier TEXT NOT NULL,
  display_name TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('ACTIVE','DEPRECATED','BLOCKED','RETIRED')),
  approval_status TEXT NOT NULL CHECK (approval_status IN ('APPROVED','BLOCKED')),
  classification_ceiling TEXT NOT NULL DEFAULT 'INTERNAL'
    CHECK (classification_ceiling IN ('PUBLIC','INTERNAL','SENSITIVE','RESTRICTED')),
  capability_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retires_at TIMESTAMPTZ,
  created_by TEXT REFERENCES users(user_id),
  updated_by TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT ai_approved_model_scope_consistent CHECK (
    (organization_id IS NULL AND tenant_id IS NULL)
    OR (organization_id IS NOT NULL AND tenant_id = 'tenant:' || organization_id)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_approved_model_scope_unique_idx
  ON ai_approved_models (COALESCE(organization_id, 'GLOBAL'), COALESCE(tenant_id, 'GLOBAL'), provider_identifier, model_identifier);
CREATE INDEX IF NOT EXISTS ai_approved_model_lookup_idx
  ON ai_approved_models (provider_identifier, model_identifier, lifecycle_status, approval_status);

CREATE TABLE IF NOT EXISTS ai_agent_sessions (
  session_id TEXT PRIMARY KEY,
  agent_identifier TEXT NOT NULL,
  acting_for_user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  delegation_id TEXT NOT NULL REFERENCES ai_delegated_authorities(delegation_id),
  declared_purpose TEXT NOT NULL,
  autonomy_profile TEXT NOT NULL,
  model_provider TEXT,
  model_identifier TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','CLOSED','EXPIRED','REVOKED','DENIED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  close_reason TEXT,
  security_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT ai_agent_session_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT ai_agent_session_finite_window CHECK (expires_at > started_at),
  CONSTRAINT ai_agent_session_close_consistent CHECK (
    (status = 'ACTIVE' AND closed_at IS NULL)
    OR (status <> 'ACTIVE' AND closed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS ai_agent_session_scope_idx
  ON ai_agent_sessions (organization_id, tenant_id, acting_for_user_id, agent_identifier, started_at DESC);
CREATE INDEX IF NOT EXISTS ai_agent_session_delegation_idx
  ON ai_agent_sessions (organization_id, tenant_id, delegation_id, status);

-- The canonical SHF organization is seeded separately by
-- seeds/001_seed_organization.sql. Keep clean migration replay independent
-- of optional/demo seed data, matching migration 084's service-catalog
-- bootstrap pattern. The FK remains authoritative when the seed exists.
INSERT INTO service_catalog (
  service_id, service_key, name, description, category, status,
  provider_organization_id, audience, requires_relationship_type, agreement_requirement
)
SELECT seed.*
FROM (VALUES (
  'svc_ai_governance',
  'ai_governance',
  'AI Governance Authority',
  'Delegated AI authority, resource classification, governed agent sessions, and approved model catalog foundation.',
  'SHARED_TECHNOLOGY',
  'ACTIVE',
  'org_shf_001',
  'NETWORK_ORGANIZATION',
  'NETWORK_MEMBER_OF',
  'NO_AGREEMENT_REQUIRED'
)) AS seed(service_id, service_key, name, description, category, status, provider_organization_id, audience, requires_relationship_type, agreement_requirement)
WHERE EXISTS (
  SELECT 1 FROM organizations WHERE organization_id = seed.provider_organization_id
)
ON CONFLICT (service_key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    status = 'ACTIVE',
    updated_at = NOW();
