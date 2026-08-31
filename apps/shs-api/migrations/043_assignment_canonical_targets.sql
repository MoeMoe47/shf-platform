-- SHF Learning Ecosystem Phase 2 — canonical Assignment targeting.
-- Additive reconciliation of assignment_targets with Enrollment/Cohort/Program
-- entitlement. Existing direct-user targets become LEARNER targets. Existing
-- organization-wide assignments receive explicit ORGANIZATION target rows so
-- student visibility never depends on a null/implicit target.

ALTER TABLE assignments
  ADD CONSTRAINT assignments_organization_assignment_key UNIQUE (organization_id, assignment_id);

ALTER TABLE assignment_targets
  ADD COLUMN IF NOT EXISTS organization_id TEXT,
  ADD COLUMN IF NOT EXISTS target_type TEXT,
  ADD COLUMN IF NOT EXISTS cohort_id TEXT,
  ADD COLUMN IF NOT EXISTS program_id TEXT;

ALTER TABLE assignment_targets
  ALTER COLUMN user_id DROP NOT NULL;

UPDATE assignment_targets t
SET organization_id = a.organization_id,
    target_type = COALESCE(t.target_type, 'LEARNER')
FROM assignments a
WHERE a.assignment_id = t.assignment_id
  AND (t.organization_id IS NULL OR t.target_type IS NULL);

INSERT INTO assignment_targets (
  assignment_target_id,
  assignment_id,
  organization_id,
  target_type,
  created_by,
  created_at
)
SELECT
  'atgt_org_' || md5(a.assignment_id),
  a.assignment_id,
  a.organization_id,
  'ORGANIZATION',
  a.created_by,
  NOW()
FROM assignments a
WHERE a.visibility_scope = 'organization'
  AND NOT EXISTS (
    SELECT 1
    FROM assignment_targets t
    WHERE t.assignment_id = a.assignment_id
      AND t.target_type = 'ORGANIZATION'
  );

ALTER TABLE assignment_targets
  ALTER COLUMN organization_id SET NOT NULL,
  ALTER COLUMN target_type SET NOT NULL;

ALTER TABLE assignment_targets
  ADD CONSTRAINT assignment_targets_target_type_check
    CHECK (target_type IN ('LEARNER', 'COHORT', 'PROGRAM', 'ORGANIZATION')),
  ADD CONSTRAINT assignment_targets_exact_target_check
    CHECK (
      (target_type = 'LEARNER' AND user_id IS NOT NULL AND cohort_id IS NULL AND program_id IS NULL)
      OR (target_type = 'COHORT' AND user_id IS NULL AND cohort_id IS NOT NULL AND program_id IS NULL)
      OR (target_type = 'PROGRAM' AND user_id IS NULL AND cohort_id IS NULL AND program_id IS NOT NULL)
      OR (target_type = 'ORGANIZATION' AND user_id IS NULL AND cohort_id IS NULL AND program_id IS NULL)
    ),
  ADD CONSTRAINT assignment_targets_assignment_same_org_fk
    FOREIGN KEY (organization_id, assignment_id) REFERENCES assignments(organization_id, assignment_id),
  ADD CONSTRAINT assignment_targets_user_same_org_fk
    FOREIGN KEY (organization_id, user_id) REFERENCES users(organization_id, user_id),
  ADD CONSTRAINT assignment_targets_cohort_same_org_fk
    FOREIGN KEY (organization_id, cohort_id) REFERENCES cohorts(organization_id, cohort_id),
  ADD CONSTRAINT assignment_targets_program_same_org_fk
    FOREIGN KEY (organization_id, program_id) REFERENCES programs(organization_id, program_id);

CREATE UNIQUE INDEX IF NOT EXISTS assignment_targets_unique_learner_idx
  ON assignment_targets (assignment_id, user_id)
  WHERE target_type = 'LEARNER';

CREATE UNIQUE INDEX IF NOT EXISTS assignment_targets_unique_cohort_idx
  ON assignment_targets (assignment_id, cohort_id)
  WHERE target_type = 'COHORT';

CREATE UNIQUE INDEX IF NOT EXISTS assignment_targets_unique_program_idx
  ON assignment_targets (assignment_id, program_id)
  WHERE target_type = 'PROGRAM';

CREATE UNIQUE INDEX IF NOT EXISTS assignment_targets_unique_organization_idx
  ON assignment_targets (assignment_id)
  WHERE target_type = 'ORGANIZATION';

CREATE INDEX IF NOT EXISTS assignment_targets_entitlement_idx
  ON assignment_targets (organization_id, target_type, user_id, cohort_id, program_id);
