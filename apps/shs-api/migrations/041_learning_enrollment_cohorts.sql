-- SHF Learning Ecosystem Phase 1 — canonical Cohort + Enrollment foundation.
-- Additive only. Teams remain organizational units; cohort rosters derive
-- only from enrollments.cohort_id.

CREATE UNIQUE INDEX IF NOT EXISTS users_org_user_unique_idx
  ON users (organization_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS programs_org_program_unique_idx
  ON programs (organization_id, program_id);

CREATE TABLE IF NOT EXISTS cohorts (
  cohort_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (organization_id, cohort_id),
  CONSTRAINT cohorts_program_same_org_fk
    FOREIGN KEY (organization_id, program_id) REFERENCES programs(organization_id, program_id),
  CONSTRAINT cohorts_tenant_matches_org
    CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT cohorts_valid_dates
    CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE TABLE IF NOT EXISTS cohort_staff (
  cohort_staff_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  cohort_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('INSTRUCTOR', 'ADMINISTRATOR')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cohort_staff_cohort_same_org_fk
    FOREIGN KEY (organization_id, cohort_id) REFERENCES cohorts(organization_id, cohort_id),
  CONSTRAINT cohort_staff_user_same_org_fk
    FOREIGN KEY (organization_id, user_id) REFERENCES users(organization_id, user_id),
  CONSTRAINT cohort_staff_tenant_matches_org
    CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS cohort_staff_active_role_idx
  ON cohort_staff (organization_id, cohort_id, user_id, role)
  WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS enrollments (
  enrollment_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  learner_user_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  cohort_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'WITHDRAWN', 'CANCELLED')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  updated_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (organization_id, enrollment_id),
  CONSTRAINT enrollments_learner_same_org_fk
    FOREIGN KEY (organization_id, learner_user_id) REFERENCES users(organization_id, user_id),
  CONSTRAINT enrollments_program_same_org_fk
    FOREIGN KEY (organization_id, program_id) REFERENCES programs(organization_id, program_id),
  CONSTRAINT enrollments_cohort_same_org_fk
    FOREIGN KEY (organization_id, cohort_id) REFERENCES cohorts(organization_id, cohort_id),
  CONSTRAINT enrollments_tenant_matches_org
    CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT enrollments_valid_dates
    CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS enrollments_active_program_idx
  ON enrollments (organization_id, learner_user_id, program_id)
  WHERE status IN ('PENDING', 'ACTIVE');

CREATE INDEX IF NOT EXISTS cohorts_scope_idx
  ON cohorts (tenant_id, organization_id, program_id, status, starts_at);

CREATE INDEX IF NOT EXISTS enrollments_learner_scope_idx
  ON enrollments (tenant_id, organization_id, learner_user_id, status);

CREATE INDEX IF NOT EXISTS enrollments_program_scope_idx
  ON enrollments (tenant_id, organization_id, program_id, status);

CREATE INDEX IF NOT EXISTS enrollments_cohort_scope_idx
  ON enrollments (tenant_id, organization_id, cohort_id, status);

INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT permission_id, role_id, permission_name
FROM (
  VALUES
    ('rp_phase1_learning_cohort_view_student', 'role_student', 'cohort.view'),
    ('rp_phase1_learning_enrollment_view_student', 'role_student', 'enrollment.view'),
    ('rp_phase1_learning_cohort_view_instructor', 'role_instructor', 'cohort.view'),
    ('rp_phase1_learning_enrollment_view_instructor', 'role_instructor', 'enrollment.view'),
    ('rp_phase1_learning_cohort_manage_org_admin', 'role_org_admin', 'cohort.manage'),
    ('rp_phase1_learning_enrollment_manage_org_admin', 'role_org_admin', 'enrollment.manage')
) AS requested(permission_id, role_id, permission_name)
WHERE EXISTS (SELECT 1 FROM roles WHERE roles.role_id = requested.role_id)
ON CONFLICT (role_permission_id) DO NOTHING;
