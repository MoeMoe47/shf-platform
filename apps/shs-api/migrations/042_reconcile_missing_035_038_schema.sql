-- SHF Database Phase 1.1 — reconcile shs_dev baseline ledger rows for
-- migrations 035-038 with missing physical schema.
--
-- The affected historical migrations were recorded with runner_version
-- baseline-1 in shs_dev, so their SQL was not executed there. This repair is
-- additive and creates the current canonical objects only when absent.

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

CREATE TABLE IF NOT EXISTS projects (
  project_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  program_id TEXT REFERENCES programs(program_id),
  course_id TEXT,
  title TEXT NOT NULL,
  project_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_teams (
  team_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('COLLABORATIVE_MODE', 'INDIVIDUAL_INTEGRATED_MODE')),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_team_members (
  membership_id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES project_teams(team_id),
  learner_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  specialization_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE (team_id, learner_id)
);

CREATE TABLE IF NOT EXISTS project_submissions (
  submission_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id),
  team_id TEXT NOT NULL REFERENCES project_teams(team_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  submitted_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  version INTEGER NOT NULL CHECK (version > 0),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  artifact_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED', 'NEEDS_REVISION', 'ACCEPTED')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, version)
);

CREATE INDEX IF NOT EXISTS project_scope_idx ON projects (tenant_id, organization_id, project_id);
CREATE INDEX IF NOT EXISTS project_team_scope_idx ON project_teams (tenant_id, organization_id, project_id);
CREATE INDEX IF NOT EXISTS project_submission_scope_idx ON project_submissions (tenant_id, organization_id, project_id, team_id);
