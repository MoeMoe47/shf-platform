-- Phase 30: generic course participation, distinct from specialization assignment.
CREATE TABLE IF NOT EXISTS program_course_assignments (
  assignment_id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  program_id TEXT NOT NULL REFERENCES programs(program_id),
  course_id TEXT NOT NULL,
  grade SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 12),
  stage TEXT NOT NULL CHECK (stage = 'PREPARE_PROVE'),
  specialization_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'TRANSFERRED')),
  assigned_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, assignment_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS program_course_active_assignment_idx
  ON program_course_assignments (organization_id, learner_id, tenant_id, program_id, course_id)
  WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS program_course_assignment_scope_idx
  ON program_course_assignments (tenant_id, organization_id, learner_id, program_id, status);
