-- 040_assignment_targeting.sql
-- SHF Calendar Wave 2A.1 — Assignment student-level targeting.
--
-- Audit finding (see the Wave 2A.1 report §2 for full detail): this
-- database has NO canonical Enrollment, Cohort, or student-course
-- membership model. `memberships.team_id` exists but is real STAFF
-- team assignment (seeds/002_seed_teams.sql: "Operations Team", "Review
-- Team", "Leadership Team" — case/program management units), not a
-- student cohort — using it as Cohort would be semantic drift, exactly
-- what this Wave's brief warned against, so it is NOT used here.
-- program_course_assignments / program_specialization_assignments /
-- project_teams (migrations 035/036/038) reference real, unapplied
-- migrations — those tables do not physically exist in this database,
-- so there is no real course/program/project-team membership to check
-- entitlement against either.
--
-- The one canonical, real, populated primitive available is `users`
-- (organization_id is a direct FK, not inferred). This migration adds
-- the smallest correct V1 on top of that: explicit organization-wide
-- targeting, or explicit per-student targeting via a real FK join
-- table. Cohort/course/program targeting is deliberately NOT modeled
-- here — see the report's §3/§15 for why that's BLOCKED, not silently
-- skipped.

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS visibility_scope TEXT;

-- Explicit, one-time backfill for the 3 rows Wave 2A already created —
-- these were seeded as general Curriculum demo content with no
-- per-student targeting concept at all (matching the original
-- DEMO_ASSIGNMENTS fixture they replaced), so 'organization' is the
-- correct, faithful value for them, not a silent/ambiguous default.
UPDATE assignments SET visibility_scope = 'organization' WHERE visibility_scope IS NULL;

ALTER TABLE assignments
  ALTER COLUMN visibility_scope SET NOT NULL,
  ADD CONSTRAINT assignments_visibility_scope_check
    CHECK (visibility_scope IN ('organization', 'targeted'));

-- Real FK join table — student-direct targeting only. No polymorphic
-- target_type/target_id column: a cohort_id or course_id column here
-- would reference a membership concept this database cannot actually
-- check (see above), which would be a fabricated enforcement boundary,
-- not a real one. Explicit FK-per-relationship is safer, per this
-- Wave's own §6 guidance, than a generic polymorphic table with an
-- unenforceable target type.
CREATE TABLE IF NOT EXISTS assignment_targets (
  assignment_target_id  TEXT PRIMARY KEY,
  assignment_id         TEXT NOT NULL REFERENCES assignments(assignment_id),
  user_id                TEXT NOT NULL REFERENCES users(user_id),
  created_by             TEXT NOT NULL REFERENCES users(user_id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_targets_assignment ON assignment_targets(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_targets_user ON assignment_targets(user_id);
