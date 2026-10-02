-- Phase 4E: minimized operational provenance for bounded Mission Director decisions.
-- Rows are operational audit data, not verified evidence or Truth Spine truth.
-- No runtime-session foreign key: provenance must outlive runtime fixture cleanup.
CREATE TABLE IF NOT EXISTS mission_director_decisions (
  director_decision_id UUID PRIMARY KEY,
  organization_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  mission_runtime_session_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  mission_version INTEGER NOT NULL CHECK (mission_version > 0),
  expected_runtime_revision INTEGER NOT NULL CHECK (expected_runtime_revision > 0),
  observed_runtime_revision INTEGER NOT NULL CHECK (observed_runtime_revision > 0),
  capability TEXT NOT NULL CHECK (capability = 'missionDirector'),
  idempotency_key TEXT NOT NULL CHECK (char_length(idempotency_key) BETWEEN 1 AND 160),
  proposal JSONB NOT NULL CHECK (jsonb_typeof(proposal) = 'object' AND octet_length(proposal::text) <= 8192),
  decision_status TEXT NOT NULL CHECK (decision_status IN ('APPLIED', 'NO_OP', 'REJECTED', 'FAILED')),
  rejection_reason TEXT CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 128),
  executor_kind TEXT NOT NULL CHECK (executor_kind IN ('DETERMINISTIC', 'FIXTURE')),
  provider_execution_ref TEXT CHECK (provider_execution_ref IS NULL OR char_length(provider_execution_ref) <= 256),
  policy_version TEXT NOT NULL CHECK (char_length(policy_version) BETWEEN 1 AND 64),
  context_digest TEXT NOT NULL CHECK (context_digest ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mission_director_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT mission_director_reason_matches_status CHECK (
    (decision_status IN ('REJECTED', 'FAILED')) = (rejection_reason IS NOT NULL)
  ),
  CONSTRAINT mission_director_idempotency_uk UNIQUE (organization_id, tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS mission_director_decisions_runtime_idx
  ON mission_director_decisions (organization_id, tenant_id, mission_runtime_session_id, created_at DESC);

CREATE OR REPLACE FUNCTION prevent_mission_director_decision_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Mission Director decisions are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_director_decisions_append_only
  BEFORE UPDATE OR DELETE ON mission_director_decisions
  FOR EACH ROW EXECUTE FUNCTION prevent_mission_director_decision_mutation();
