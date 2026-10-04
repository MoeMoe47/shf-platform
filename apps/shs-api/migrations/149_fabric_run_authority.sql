-- AFCC-3 Phase 5: Agent Fabric governed run authority.
--
-- Plans, approval decisions, execution claims and run events share one
-- transactional store so that single-flight execution holds across Fabric
-- replicas. Owned by the Fabric Run Authority; written only by Agent Fabric
-- (services/shf-agent-fabric/fabric/run_authority_pg.py). No SHS domain data.
--
-- Forward-only and additive, like every migration in this directory.
-- No secrets, session tokens, raw exception text or server file paths are stored.

-- Plan Authority: one row per governed plan. `document` holds the full plan
-- (steps, input, policy, agent, creator, approval mirror) in the shape the
-- Fabric plan API has always returned; the columns are the indexed,
-- constrained projection of it and are updated in the same transaction.
CREATE TABLE IF NOT EXISTS fabric_plans (
  plan_id TEXT PRIMARY KEY,
  request_id TEXT,
  correlation_id TEXT,
  status TEXT NOT NULL,
  approval_required BOOLEAN NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  creator_actor_id TEXT,
  creator_verification TEXT,
  tenant_id TEXT,
  organization_id TEXT,
  document JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fabric_plans_status_check CHECK (status IN ('PLANNED', 'APPROVED', 'REJECTED', 'DONE')),
  CONSTRAINT fabric_plans_version_check CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS fabric_plans_scope_idx
  ON fabric_plans (tenant_id, organization_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS fabric_plans_updated_idx
  ON fabric_plans (updated_at DESC);

-- Approval Authority: decisions are final, so at most one per plan.
CREATE TABLE IF NOT EXISTS fabric_plan_decisions (
  decision_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  approver_actor_id TEXT NOT NULL,
  approver JSONB NOT NULL,
  reason TEXT,
  correlation_id TEXT,
  tenant_id TEXT,
  organization_id TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fabric_plan_decisions_plan_fk FOREIGN KEY (plan_id) REFERENCES fabric_plans (plan_id),
  CONSTRAINT fabric_plan_decisions_one_per_plan UNIQUE (plan_id),
  CONSTRAINT fabric_plan_decisions_decision_check CHECK (decision IN ('APPROVED', 'REJECTED'))
);

-- Execution Authority: one claim row per plan. A claim is live while
-- released_at IS NULL; it may be taken over only after lease_expires_at plus
-- the grace period (checked by the writer under the plan row lock).
-- claim_version fences stale executors out of the terminal transaction.
CREATE TABLE IF NOT EXISTS fabric_execution_claims (
  plan_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  claimed_by_actor_id TEXT NOT NULL,
  correlation_id TEXT,
  lease_started_at TIMESTAMPTZ NOT NULL,
  lease_expires_at TIMESTAMPTZ NOT NULL,
  claim_version BIGINT NOT NULL DEFAULT 1,
  released_at TIMESTAMPTZ,
  release_reason TEXT,
  CONSTRAINT fabric_execution_claims_plan_fk FOREIGN KEY (plan_id) REFERENCES fabric_plans (plan_id),
  CONSTRAINT fabric_execution_claims_lease_check CHECK (lease_expires_at > lease_started_at)
);

CREATE INDEX IF NOT EXISTS fabric_execution_claims_run_idx
  ON fabric_execution_claims (run_id);

-- Run Lifecycle Authority: append-only run events. `payload` is the full
-- fabric.run_event.v4 record the read projection already understands.
CREATE TABLE IF NOT EXISTS fabric_run_events (
  event_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  seq BIGINT NOT NULL,
  event_type TEXT NOT NULL,
  to_state TEXT,
  correlation_id TEXT,
  actor_id TEXT,
  reason_code TEXT,
  tenant_id TEXT,
  organization_id TEXT,
  event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL,
  CONSTRAINT fabric_run_events_plan_fk FOREIGN KEY (plan_id) REFERENCES fabric_plans (plan_id),
  CONSTRAINT fabric_run_events_run_seq_unique UNIQUE (run_id, seq)
);

CREATE INDEX IF NOT EXISTS fabric_run_events_plan_idx
  ON fabric_run_events (plan_id, event_at);

CREATE INDEX IF NOT EXISTS fabric_run_events_recent_idx
  ON fabric_run_events (event_at DESC);

CREATE INDEX IF NOT EXISTS fabric_run_events_scope_idx
  ON fabric_run_events (tenant_id, organization_id, event_at DESC);
