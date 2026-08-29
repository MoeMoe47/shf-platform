-- Phase 26: generic learner specialization requests, separate from assignment.
CREATE TABLE IF NOT EXISTS program_specialization_requests (
  request_id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  program_id TEXT NOT NULL REFERENCES programs(program_id),
  requested_specialization_id TEXT NOT NULL,
  grade SMALLINT NOT NULL CHECK (grade IN (11, 12)),
  stage TEXT NOT NULL CHECK (stage = 'PREPARE_PROVE'),
  request_type TEXT NOT NULL CHECK (request_type IN ('PRIMARY', 'CHANGE')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'DECLINED', 'SUPERSEDED')),
  learner_rationale TEXT,
  staff_note TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by_user_id TEXT REFERENCES users(user_id),
  resulting_assignment_id TEXT REFERENCES program_specialization_assignments(assignment_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, request_id),
  CHECK (reviewed_at IS NULL OR reviewed_by_user_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS program_specialization_pending_primary_request_idx
  ON program_specialization_requests (organization_id, learner_id, program_id)
  WHERE request_type = 'PRIMARY' AND status = 'PENDING';

CREATE INDEX IF NOT EXISTS program_specialization_requests_scope_idx
  ON program_specialization_requests (tenant_id, organization_id, learner_id, program_id, status);
