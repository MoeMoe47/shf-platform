-- 060_assignment_curriculum_release_binding.sql
--
-- SHF Lesson + Assignment + Curriculum — Phase 3: binds the existing
-- canonical `assignments` table (migration 039/040/043) to an immutable
-- Curriculum Release (migration 059) without touching either historical
-- migration. All new columns are nullable — every pre-existing assignment
-- (which used the free-text `course_id`/`lesson_id` columns, or neither)
-- remains valid and unaffected.
--
-- A composite (release_id, organization_id) unique is added to
-- curriculum_releases first: migration 059 only gave it a bare PK on
-- release_id (globally unique already, so this is trivially satisfiable),
-- which is not enough to compose a same-organization FK from assignments.

ALTER TABLE curriculum_releases
  ADD CONSTRAINT curriculum_releases_id_org_unique UNIQUE (release_id, organization_id);

ALTER TABLE assignments
  ADD COLUMN curriculum_release_id   TEXT,
  ADD COLUMN assigned_content_type   TEXT CHECK (assigned_content_type IN ('COURSE', 'UNIT', 'LESSON')),
  -- COURSE: NULL (the whole release, already identified by
  --   curriculum_release_id -> curriculum_releases.course_id).
  -- UNIT: the unit's stable_key (unique within its course).
  -- LESSON: "<unitStableKey>:<lessonStableKey>" — a lesson's stable_key
  --   is only unique within its own unit, so the compound form is
  --   required to locate it unambiguously inside a release snapshot.
  -- Resolved against the immutable release SNAPSHOT (JSONB), never
  -- against the live, mutable curriculum_units/curriculum_lessons rows —
  -- see assignment-entitlement-service.ts. This is what makes assignment
  -- content binding release-intrinsic rather than dependent on content
  -- that could later be archived/edited in the live draft tables.
  ADD COLUMN assigned_content_id     TEXT;

ALTER TABLE assignments
  ADD CONSTRAINT assignments_release_same_org_fk
    FOREIGN KEY (curriculum_release_id, organization_id)
    REFERENCES curriculum_releases(release_id, organization_id);

-- All-or-nothing content binding; when present, UNIT/LESSON additionally
-- require the compound content id. Institutional-curriculum-only
-- assignments never partially bind (e.g. a release with no type, or a
-- type with no release).
ALTER TABLE assignments
  ADD CONSTRAINT assignments_content_binding_check
  CHECK (
    (curriculum_release_id IS NULL AND assigned_content_type IS NULL AND assigned_content_id IS NULL)
    OR (assigned_content_type = 'COURSE' AND curriculum_release_id IS NOT NULL AND assigned_content_id IS NULL)
    OR (assigned_content_type IN ('UNIT', 'LESSON') AND curriculum_release_id IS NOT NULL AND assigned_content_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_assignments_curriculum_release
  ON assignments (curriculum_release_id)
  WHERE curriculum_release_id IS NOT NULL;

-- No new index needed for reading curriculum_lesson_completions: its own
-- migration (031/045) already carries a UNIQUE (organization_id, user_id,
-- curriculum_id, lesson_id) constraint, which already is the lookup
-- index Phase 3's derived-progress join needs. Phase 2's static-content
-- importer set curriculum_courses.stable_key =
-- <curriculumId>.toLowerCase() and curriculum_lessons.stable_key =
-- <lesson filename> — the exact identifiers that table already stores
-- for imported content, so the join is a direct match with no schema
-- change required on either side.
