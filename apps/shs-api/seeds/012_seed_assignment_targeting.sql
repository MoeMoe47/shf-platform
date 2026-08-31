-- SHF Calendar Wave 2A.1 — DEV/TEST SEED DATA ONLY.
--
-- user_no_assignment_001 already exists as an in-memory identity
-- (src/domain/identity/repo/identity-repo.ts, roles: ["student"]) —
-- its own name signals it was built for exactly this scenario. This
-- gives it a real Postgres row so it can participate in real FK-backed
-- assignment_targets checks, matching users.organization_id === the
-- other seeded student (real cross-student isolation, same org).
INSERT INTO users (
  user_id, organization_id, email, full_name, status, identity_source
) VALUES
  ('user_no_assignment_001', 'org_shf_001', 'no-assignment@siliconheartland.org', 'SHF Demo Student (No Targeted Assignment)', 'active', 'local')
ON CONFLICT (user_id) DO NOTHING;

-- One example of real per-student targeting, not just organization-wide:
-- visible only to user_student_001, never to user_no_assignment_001.
INSERT INTO assignments (
  assignment_id, organization_id, cohort_id, course_id, lesson_id,
  title, description, assignment_type, visibility_scope, created_by,
  available_at, due_at, closes_at, status
) VALUES
  ('asmt_seed_targeted_1', 'org_shf_001', NULL, NULL, NULL,
   'Makeup Assessment', 'Individually assigned makeup assessment.', 'assignment', 'targeted', 'user_instructor_001',
   NOW(), NOW() + INTERVAL '6 days', NULL, 'published')
ON CONFLICT (assignment_id) DO NOTHING;

INSERT INTO assignment_targets (assignment_target_id, assignment_id, organization_id, target_type, user_id, created_by)
VALUES ('atgt_seed_1', 'asmt_seed_targeted_1', 'org_shf_001', 'LEARNER', 'user_student_001', 'user_instructor_001')
ON CONFLICT (assignment_id, user_id) DO NOTHING;
