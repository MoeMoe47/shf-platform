-- Studio Phase 2: durable handoff metadata on the canonical projects table.
-- This is additive: generic Project rows remain valid and Studio does not
-- create a competing project identity or lifecycle table.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS studio_origin TEXT,
  ADD COLUMN IF NOT EXISTS studio_origin_reference_id TEXT,
  ADD COLUMN IF NOT EXISTS studio_learner_id TEXT,
  ADD COLUMN IF NOT EXISTS studio_project_type TEXT,
  ADD COLUMN IF NOT EXISTS studio_destination TEXT,
  ADD COLUMN IF NOT EXISTS studio_assignment_id TEXT,
  ADD COLUMN IF NOT EXISTS studio_curriculum_release_id TEXT,
  ADD COLUMN IF NOT EXISTS studio_completion_policy_id TEXT,
  ADD COLUMN IF NOT EXISTS studio_status TEXT,
  ADD COLUMN IF NOT EXISTS studio_qa_status TEXT,
  ADD COLUMN IF NOT EXISTS studio_review_status TEXT,
  ADD COLUMN IF NOT EXISTS studio_delivery_status TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_origin_check') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_origin_check CHECK (studio_origin IS NULL OR studio_origin IN ('ASSIGNMENT', 'STUDENT_IDEA', 'PROGRAMMATIC')); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_type_check') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_type_check CHECK (studio_project_type IS NULL OR studio_project_type IN ('WEBSITE', 'AI_AGENT')); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_destination_check') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_destination_check CHECK (studio_destination IS NULL OR studio_destination IN ('STUDENT', 'COMMERCIAL')); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_required_fields_check') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_required_fields_check CHECK (studio_origin IS NULL OR (studio_learner_id IS NOT NULL AND studio_project_type IS NOT NULL AND studio_destination IS NOT NULL AND studio_status IS NOT NULL AND studio_qa_status IS NOT NULL AND studio_review_status IS NOT NULL AND studio_delivery_status IS NOT NULL)); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_tenant_matches_org') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_tenant_matches_org CHECK (studio_origin IS NULL OR tenant_id = 'tenant:' || organization_id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_status_check') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_status_check CHECK (studio_status IS NULL OR studio_status IN ('DRAFT', 'PLANNING', 'BUILDING', 'READY_FOR_CHECK', 'CHANGES_REQUIRED', 'READY_FOR_REVIEW', 'APPROVED', 'DELIVERY_READY', 'DELIVERED')); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_qa_status_check') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_qa_status_check CHECK (studio_qa_status IS NULL OR studio_qa_status IN ('NOT_RUN', 'IN_PROGRESS', 'PASSED', 'FAILED')); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_review_status_check') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_review_status_check CHECK (studio_review_status IS NULL OR studio_review_status IN ('NOT_REQUESTED', 'PENDING', 'CHANGES_REQUIRED', 'APPROVED')); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_delivery_status_check') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_delivery_status_check CHECK (studio_delivery_status IS NULL OR studio_delivery_status IN ('NOT_READY', 'READY', 'DELIVERED')); END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_assignment_fk') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_assignment_fk FOREIGN KEY (studio_assignment_id) REFERENCES assignments(assignment_id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_learner_fk') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_learner_fk FOREIGN KEY (organization_id, studio_learner_id) REFERENCES users(organization_id, user_id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_release_org_fk') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_release_org_fk FOREIGN KEY (studio_curriculum_release_id, organization_id) REFERENCES curriculum_releases(release_id, organization_id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_policy_org_fk') THEN ALTER TABLE projects ADD CONSTRAINT projects_studio_policy_org_fk FOREIGN KEY (studio_completion_policy_id, organization_id) REFERENCES completion_policies(policy_id, organization_id); END IF;
END $$;

CREATE INDEX IF NOT EXISTS projects_studio_scope_idx
  ON projects (organization_id, tenant_id, studio_assignment_id, project_id)
  WHERE studio_origin IS NOT NULL;
CREATE INDEX IF NOT EXISTS projects_studio_learner_idx
  ON projects (organization_id, tenant_id, studio_learner_id, project_id)
  WHERE studio_origin IS NOT NULL;

CREATE TABLE IF NOT EXISTS studio_handoffs (
  handoff_id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(project_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  learner_id TEXT NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('ASSIGNMENT', 'STUDENT_IDEA', 'PROGRAMMATIC')),
  project_type TEXT NOT NULL CHECK (project_type IN ('WEBSITE', 'AI_AGENT')),
  destination TEXT NOT NULL CHECK (destination IN ('STUDENT', 'COMMERCIAL')),
  assignment_id TEXT REFERENCES assignments(assignment_id),
  enrollment_id TEXT,
  cohort_id TEXT,
  program_id TEXT,
  course_id TEXT,
  unit_key TEXT,
  lesson_key TEXT,
  curriculum_release_id TEXT,
  completion_policy_id TEXT,
  reviewer_id TEXT REFERENCES users(user_id),
  due_at TIMESTAMPTZ,
  requirements_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT studio_handoffs_assignment_origin_check CHECK ((origin = 'ASSIGNMENT' AND assignment_id IS NOT NULL AND curriculum_release_id IS NOT NULL) OR (origin <> 'ASSIGNMENT' AND assignment_id IS NULL)),
  CONSTRAINT studio_handoffs_student_idea_check CHECK (origin <> 'STUDENT_IDEA' OR completion_policy_id IS NULL),
  CONSTRAINT studio_handoffs_project_type_destination_check CHECK (destination IN ('STUDENT', 'COMMERCIAL')),
  CONSTRAINT studio_handoffs_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT studio_handoffs_project_unique_fk UNIQUE (project_id),
  CONSTRAINT studio_handoffs_learner_same_org_fk FOREIGN KEY (organization_id, learner_id) REFERENCES users(organization_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS studio_handoffs_assignment_idempotency_idx
  ON studio_handoffs (organization_id, tenant_id, learner_id, assignment_id, project_type)
  WHERE assignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS studio_handoffs_scope_idx
  ON studio_handoffs (organization_id, tenant_id, learner_id, created_at DESC);
