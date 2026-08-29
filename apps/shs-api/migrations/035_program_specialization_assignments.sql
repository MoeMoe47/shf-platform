-- Phase 25: generic, tenant-scoped educational specialization assignments.
CREATE TABLE IF NOT EXISTS program_specialization_assignments (
  assignment_id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  program_id TEXT NOT NULL REFERENCES programs(program_id),
  specialization_id TEXT NOT NULL,
  grade SMALLINT NOT NULL CHECK (grade IN (11, 12)),
  stage TEXT NOT NULL CHECK (stage = 'PREPARE_PROVE'),
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('PRIMARY', 'SECONDARY')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE', 'TRANSFERRED', 'COMPLETED')),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  assigned_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  assignment_source TEXT NOT NULL CHECK (assignment_source IN ('LEARNER_SELECTION', 'INSTRUCTOR_ASSIGNMENT', 'PROGRAM_ASSIGNMENT', 'ADVISOR_CHANGE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, assignment_id),
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE UNIQUE INDEX IF NOT EXISTS program_specialization_active_primary_idx
  ON program_specialization_assignments (organization_id, learner_id, program_id)
  WHERE assignment_type = 'PRIMARY' AND status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS program_specialization_assignments_scope_idx
  ON program_specialization_assignments (tenant_id, organization_id, learner_id, program_id, status);
