-- Durable claim-population governance. Truth claim payloads remain owned by
-- Agent Fabric; these tables store only scoped governance references.
CREATE TABLE IF NOT EXISTS truth_public_population_authority_events (
  authority_event_id TEXT PRIMARY KEY,
  authority_id TEXT NOT NULL,
  authority_type TEXT NOT NULL CHECK (authority_type IN ('SHF_PRIVACY_DATA_GOVERNANCE_AUTHORITY', 'PUBLIC_AGGREGATE_POPULATION_APPROVAL_AUTHORITY')),
  authority_reference TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  parent_authority_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  actor_user_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL CHECK (version > 0)
);
CREATE INDEX IF NOT EXISTS idx_truth_population_authority_current
  ON truth_public_population_authority_events (authority_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_truth_population_active_authority
  ON truth_public_population_authority_events (authority_id) WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS truth_public_population_signoff_events (
  signoff_event_id TEXT PRIMARY KEY,
  signoff_id TEXT NOT NULL,
  truth_claim_id TEXT NOT NULL,
  truth_version INTEGER NOT NULL CHECK (truth_version > 0),
  predicate TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  authority_id TEXT NOT NULL,
  signoff_type TEXT NOT NULL CHECK (signoff_type = 'PUBLIC_AGGREGATE_POPULATION_APPROVAL'),
  institutional_authority_reference TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('APPROVED', 'REVOKED')),
  actor_user_id TEXT NOT NULL,
  reason TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL CHECK (version > 0)
);
CREATE INDEX IF NOT EXISTS idx_truth_population_signoff_claim
  ON truth_public_population_signoff_events (truth_claim_id, truth_version, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_truth_population_active_signoff
  ON truth_public_population_signoff_events (truth_claim_id, truth_version) WHERE status = 'APPROVED';

CREATE TABLE IF NOT EXISTS truth_public_population_eligibility_events (
  eligibility_event_id TEXT PRIMARY KEY,
  eligibility_id TEXT NOT NULL,
  truth_claim_id TEXT NOT NULL,
  truth_version INTEGER NOT NULL CHECK (truth_version > 0),
  predicate TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  authority_id TEXT NOT NULL,
  signoff_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PUBLIC_POPULATION_ELIGIBLE', 'PUBLIC_POPULATION_REVOKED')),
  actor_user_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  version INTEGER NOT NULL CHECK (version > 0)
);
CREATE INDEX IF NOT EXISTS idx_truth_population_eligibility_claim
  ON truth_public_population_eligibility_events (truth_claim_id, truth_version, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_truth_population_active_eligibility
  ON truth_public_population_eligibility_events (truth_claim_id, truth_version) WHERE status = 'PUBLIC_POPULATION_ELIGIBLE';

CREATE TABLE IF NOT EXISTS truth_public_population_governance_events (
  governance_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  actor_user_id TEXT NOT NULL,
  event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_truth_population_governance_audit
  ON truth_public_population_governance_events (organization_id, created_at DESC);
