-- Phase 2A Secure Live Learning: demo student/instructor users so
-- live_sessions.instructor_id and live_session_join_events.user_id FKs
-- resolve. Auth/permission behavior for these ids is driven separately by
-- the in-memory IdentityRepo (see identity-repo.ts) — this row only
-- satisfies the Postgres foreign key constraints.
INSERT INTO users (
  user_id, organization_id, email, full_name, status, identity_source
) VALUES
('user_student_001', 'org_shf_001', 'student@siliconheartland.org', 'SHF Demo Student', 'active', 'local'),
('user_instructor_001', 'org_shf_001', 'instructor@siliconheartland.org', 'SHF Demo Instructor', 'active', 'local')
ON CONFLICT (user_id) DO NOTHING;
