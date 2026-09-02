-- 064_curriculum_resource_arcade_linkage.sql
--
-- SHF Lesson + Assignment + Curriculum — Phase 4.5D: Canonical Resource,
-- Media, and Learning Arcade Linkage.
--
-- Additive only. Does not edit migrations 059/062/063 or earlier, and
-- does not touch curriculum_courses/units/lessons/releases, assignments,
-- or completion_policies at all.
--
-- Two changes:
--
-- (1) A new canonical Lesson <-> Arcade Activity definition relationship.
--     `arcade_activities` (migration 052) is intentionally GLOBAL — it
--     has no organization_id column (its own header comment says so).
--     This link table is therefore org-scoped on the curriculum-lesson
--     side only; the FK to arcade_activities is a plain reference, not a
--     same-org composite, because there is no org column on that table
--     to compose against. This does NOT replace, deprecate, or require
--     `arcade_activities.lesson_id` — that column is left exactly as-is
--     (still free-text, still zero runtime consumers, confirmed by fresh
--     audit — see the Phase 4.5D report). This table is the real
--     institutional relationship a curriculum importer uses instead.
--
--     This link table asserts DEFINITION linkage only — "this Lesson's
--     curriculum references this Arcade Activity" — never a learner
--     attempt/result/mastery fact. Nothing here is ever read by, or
--     written from, arcade_attempts/arcade_results, and the Completion
--     Policy Engine's ARCADE requirement adapter (requirement-
--     adapters.ts) is untouched — it continues to resolve purely via
--     completion_policy_requirements.target_reference against
--     arcade_results, exactly as before this migration.
--
-- (2) curriculum_import_candidates.candidate_type/created_entity_type
--     gain a new value, ARCADE_LINK — a candidate type representing a
--     proposed Lesson<->Arcade Activity link, distinct from RESOURCE
--     (Step 19 calls for a dedicated relationship, not folding Arcade
--     linkage into the Resource domain).
--
-- Also: curriculum_lesson_resources gains a `sequence` column (it never
-- had one — Fork A's audit of migration 059 confirmed this) so a
-- Lesson's several media resources retain deterministic order, matching
-- how every other parent/child relationship in this domain
-- (units-under-course, lessons-under-unit) already has one.
CREATE TABLE IF NOT EXISTS curriculum_lesson_arcade_activities (
  curriculum_lesson_arcade_activity_id TEXT PRIMARY KEY,
  organization_id       TEXT NOT NULL REFERENCES organizations(organization_id),
  curriculum_lesson_id  TEXT NOT NULL,
  arcade_activity_id    TEXT NOT NULL REFERENCES arcade_activities(arcade_activity_id),
  sequence              INTEGER NOT NULL DEFAULT 1 CHECK (sequence >= 1),
  -- Structured-source provenance: which games[] entry (source file +
  -- id) proposed this link, for the same reason curriculum_resources'
  -- provenance columns exist — traceability back to the source that
  -- asserted the relationship.
  source_reference      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_curriculum_lesson_arcade_activities_id_org UNIQUE (curriculum_lesson_arcade_activity_id, organization_id),
  CONSTRAINT uq_curriculum_lesson_arcade_activities_pair UNIQUE (curriculum_lesson_id, arcade_activity_id),
  CONSTRAINT fk_curriculum_lesson_arcade_activities_lesson_same_org
    FOREIGN KEY (curriculum_lesson_id, organization_id) REFERENCES curriculum_lessons(lesson_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_lesson_arcade_activities_org_lesson
  ON curriculum_lesson_arcade_activities (organization_id, curriculum_lesson_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_lesson_arcade_activities_activity
  ON curriculum_lesson_arcade_activities (arcade_activity_id);

ALTER TABLE curriculum_lesson_resources
  ADD COLUMN IF NOT EXISTS sequence INTEGER NOT NULL DEFAULT 1 CHECK (sequence >= 1);

ALTER TABLE curriculum_import_candidates
  DROP CONSTRAINT IF EXISTS curriculum_import_candidates_candidate_type_check,
  ADD CONSTRAINT curriculum_import_candidates_candidate_type_check
    CHECK (candidate_type IN ('COURSE', 'UNIT', 'LESSON', 'RESOURCE', 'ARCADE_LINK'));

ALTER TABLE curriculum_import_candidates
  DROP CONSTRAINT IF EXISTS curriculum_import_candidates_created_entity_type_check,
  ADD CONSTRAINT curriculum_import_candidates_created_entity_type_check
    CHECK (created_entity_type IS NULL OR created_entity_type IN ('COURSE', 'UNIT', 'LESSON', 'RESOURCE', 'ARCADE_LINK'));
