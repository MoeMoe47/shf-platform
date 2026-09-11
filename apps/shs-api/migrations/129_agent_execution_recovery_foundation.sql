-- SYS-6C: durable governed execution coordination for bounded safe work.
-- This does not enable production side effects or create a worker fleet.

CREATE TABLE IF NOT EXISTS ai_agent_workers (
  worker_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  worker_identifier TEXT NOT NULL,
  execution_mode TEXT NOT NULL DEFAULT 'TEST_SAFE' CHECK (execution_mode IN ('TEST_SAFE','SIMULATION')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  registered_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, tenant_id, worker_identifier),
  CONSTRAINT ai_agent_worker_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_workers_scope_status
  ON ai_agent_workers (organization_id, tenant_id, status, worker_identifier);

ALTER TABLE ai_agent_tasks
  DROP CONSTRAINT IF EXISTS ai_agent_tasks_status_check;
ALTER TABLE ai_agent_tasks
  ADD CONSTRAINT ai_agent_tasks_status_check CHECK (status IN ('REQUESTED','VALIDATED','AUTHORIZED','WAITING_APPROVAL','READY','RUNNING','PAUSED','CANCELLED','REVOKED','FAILED','COMPLETED'));

ALTER TABLE ai_agent_task_attempts
  DROP CONSTRAINT IF EXISTS ai_agent_task_attempts_status_check;
ALTER TABLE ai_agent_task_attempts
  ADD CONSTRAINT ai_agent_task_attempts_status_check CHECK (status IN ('PENDING','CLAIMED','RUNNING','SUCCEEDED','FAILED','CANCELLED','REVOKED','EXPIRED','RECORDED'));
ALTER TABLE ai_agent_task_attempts
  ADD COLUMN IF NOT EXISTS worker_id TEXT REFERENCES ai_agent_workers(worker_id),
  ADD COLUMN IF NOT EXISTS execution_mode TEXT NOT NULL DEFAULT 'TEST_SAFE' CHECK (execution_mode IN ('TEST_SAFE','SIMULATION')),
  ADD COLUMN IF NOT EXISTS lease_acquired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS heartbeat_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checkpoint JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS retryable BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS policy_binding_hash TEXT,
  ADD COLUMN IF NOT EXISTS action_binding_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_ai_agent_attempts_lease
  ON ai_agent_task_attempts (organization_id, tenant_id, status, lease_expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_agent_attempts_worker
  ON ai_agent_task_attempts (organization_id, tenant_id, worker_id, status, sequence DESC);
