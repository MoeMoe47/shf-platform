-- SHF Calendar Wave 2A — DEV/TEST SEED DATA ONLY, not a production
-- record. Mirrors demoFixtures.js's own "relative to NOW(), not a
-- hardcoded date" philosophy so this never silently becomes stale demo
-- data. Same organization/instructor already seeded by
-- 010_seed_live_learning_users.sql, so this lines up with the existing
-- Live Learning demo identity rather than inventing a parallel one.
-- visibility_scope: 'organization' — these three are general curriculum
-- content, matching the original DEMO_ASSIGNMENTS fixture they replaced
-- (everyone in the org sees them). See migrations/040_assignment_targeting.sql.
INSERT INTO assignments (
  assignment_id, organization_id, cohort_id, course_id, lesson_id,
  title, description, assignment_type, visibility_scope, created_by,
  available_at, due_at, closes_at, status
) VALUES
  ('asmt_seed_reflection_1', 'org_shf_001', NULL, NULL, NULL,
   'Lesson 3 Reflection', 'Short written reflection on Lesson 3.', 'reflection', 'organization', 'user_instructor_001',
   NOW() - INTERVAL '3 days', NOW() + INTERVAL '2 days', NULL, 'published'),
  ('asmt_seed_quiz_2', 'org_shf_001', NULL, NULL, NULL,
   'Quiz 2', 'Module 1 knowledge check.', 'quiz', 'organization', 'user_instructor_001',
   NOW() - INTERVAL '1 day', NOW() + INTERVAL '4 days', NULL, 'published'),
  ('asmt_seed_artifact_1', 'org_shf_001', NULL, NULL, NULL,
   'Portfolio Artifact', 'Upload one artifact for your portfolio checkpoint.', 'artifact', 'organization', 'user_instructor_001',
   NOW(), NOW() + INTERVAL '10 days', NULL, 'published')
ON CONFLICT (assignment_id) DO NOTHING;
