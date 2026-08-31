-- 039_assignments.sql
-- SHF Calendar Wave 2A — canonical Assignment domain. Mirrors the Phase 2A
-- Live Learning migration's shape/conventions (006_live_learning.sql):
-- organization-scoped, nullable optional linkage columns rather than hard
-- FKs to models that don't exist yet (no course/lesson catalog table in
-- this schema), status as a plain column.
--
-- Deliberately does NOT include a submission/completion table. No
-- submission/grading infrastructure exists anywhere in this repository
-- today (confirmed by audit) — inventing one here would fabricate
-- institutional completion truth the Calendar (or this migration) has no
-- business owning. V1 scope is due-date projection only; "Submitted" /
-- "Completed" states are intentionally NOT modeled until a real
-- submission domain exists to own them.
--
-- Additive only — creates one new table, touches nothing else.

CREATE TABLE IF NOT EXISTS assignments (
  assignment_id      TEXT PRIMARY KEY,
  organization_id    TEXT NOT NULL REFERENCES organizations(organization_id),
  cohort_id          TEXT,
  course_id          TEXT,
  lesson_id          TEXT,
  title              TEXT NOT NULL,
  description        TEXT,
  assignment_type    TEXT NOT NULL DEFAULT 'assignment',
  created_by         TEXT NOT NULL REFERENCES users(user_id),
  available_at       TIMESTAMPTZ,
  due_at             TIMESTAMPTZ NOT NULL,
  closes_at          TIMESTAMPTZ,
  status             TEXT NOT NULL DEFAULT 'published',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version            INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_assignments_org ON assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due ON assignments(due_at);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_cohort ON assignments(cohort_id);
