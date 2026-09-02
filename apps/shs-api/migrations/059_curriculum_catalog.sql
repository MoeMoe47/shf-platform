-- 059_curriculum_catalog.sql
--
-- SHF Lesson + Assignment + Curriculum Ingestion — Phase 2: Curriculum
-- Catalog, Versioning, Review, Approval, and Publishing.
--
-- Builds directly on Phase 1's source_assets/source_document_versions
-- (migration 058) without altering them. Adds the canonical instructional
-- structure Phase 1 explicitly deferred: Course -> Unit -> Lesson, a
-- Curriculum Resource that may reference Source Asset/Source Document
-- Version provenance, and an immutable Curriculum Release snapshot.
--
-- This is a SEPARATE domain from `apps/shs-api/src/domain/curriculum/`
-- (curriculum_lesson_completions, migrations 031/045) — that domain
-- tracks learner completion against free-text curriculum/lesson ids; this
-- migration introduces the actual canonical catalog those ids can
-- eventually reference. No existing table is altered.
--
-- Lifecycle lives on curriculum_courses only: DRAFT -> IN_REVIEW ->
-- APPROVED -> PUBLISHED -> RETIRED. Units/Lessons/Resources use a simpler
-- ACTIVE/ARCHIVED status (soft-disable within a draft, never hard
-- delete, preserving institutional history). A course is only editable
-- (course/unit/lesson writes accepted) while status = 'DRAFT' — see the
-- service layer's own enforcement; this migration only encodes the valid
-- status values.
--
-- Publishing snapshots the course + its ACTIVE units/lessons/resource
-- references into curriculum_releases.snapshot (JSONB) with a server-
-- computed SHA-256 over the canonicalized content. A release row is
-- immutable by construction (enforced by a BEFORE UPDATE trigger below,
-- not just application code) except for the REVOKED-style status/retire
-- fields. Editing curriculum after publication requires an explicit
-- reopen-to-DRAFT action; it never mutates an existing release. A new
-- publish action creates the next version_number for the same course.
--
-- No diagnosis, accommodation, personal-preference, Truth Spine,
-- Operational Event, or Evidence field or link exists anywhere here.

CREATE TABLE IF NOT EXISTS curriculum_courses (
  course_id          TEXT PRIMARY KEY,
  organization_id    TEXT NOT NULL REFERENCES organizations(organization_id),
  stable_key         TEXT NOT NULL,
  title              TEXT NOT NULL,
  short_description  TEXT,
  full_description   TEXT,
  status             TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'RETIRED')),
  estimated_duration_minutes INTEGER CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  updated_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  revision           INTEGER NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_curriculum_courses_org_key UNIQUE (organization_id, stable_key),
  CONSTRAINT uq_curriculum_courses_id_org UNIQUE (course_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_courses_org_status
  ON curriculum_courses (organization_id, status);

CREATE TABLE IF NOT EXISTS curriculum_units (
  unit_id            TEXT PRIMARY KEY,
  organization_id    TEXT NOT NULL REFERENCES organizations(organization_id),
  course_id          TEXT NOT NULL,
  stable_key         TEXT NOT NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  sequence           INTEGER NOT NULL CHECK (sequence >= 1),
  status             TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  revision           INTEGER NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_curriculum_units_course_key UNIQUE (course_id, stable_key),
  CONSTRAINT uq_curriculum_units_id_org UNIQUE (unit_id, organization_id),
  CONSTRAINT fk_curriculum_units_course_same_org
    FOREIGN KEY (course_id, organization_id) REFERENCES curriculum_courses(course_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_units_course_sequence
  ON curriculum_units (course_id, sequence);

CREATE TABLE IF NOT EXISTS curriculum_lessons (
  lesson_id          TEXT PRIMARY KEY,
  organization_id    TEXT NOT NULL REFERENCES organizations(organization_id),
  unit_id            TEXT NOT NULL,
  stable_key         TEXT NOT NULL,
  title              TEXT NOT NULL,
  summary            TEXT,
  objectives         JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_duration_minutes INTEGER CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0),
  sequence           INTEGER NOT NULL CHECK (sequence >= 1),
  status             TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  revision           INTEGER NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_curriculum_lessons_unit_key UNIQUE (unit_id, stable_key),
  CONSTRAINT uq_curriculum_lessons_id_org UNIQUE (lesson_id, organization_id),
  CONSTRAINT fk_curriculum_lessons_unit_same_org
    FOREIGN KEY (unit_id, organization_id) REFERENCES curriculum_units(unit_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_unit_sequence
  ON curriculum_lessons (unit_id, sequence);

CREATE TABLE IF NOT EXISTS curriculum_resources (
  resource_id                  TEXT PRIMARY KEY,
  organization_id              TEXT NOT NULL REFERENCES organizations(organization_id),
  source_asset_id              TEXT,
  -- Simple FK, not a same-org composite: migration 058's
  -- source_document_versions table has no (id, organization_id) unique
  -- constraint to compose against (only a bare PK and a
  -- (source_asset_id, version_number) unique), and that historical
  -- migration is never edited. The service layer verifies the fetched
  -- source_document_version's organization_id matches this resource's
  -- organization_id before insert — same security outcome, enforced one
  -- layer up because the schema it must reference can't express it here.
  source_document_version_id   TEXT REFERENCES source_document_versions(source_document_version_id),
  title                        TEXT NOT NULL,
  resource_type                TEXT NOT NULL
    CHECK (resource_type IN ('DOCUMENT', 'LINK', 'MEDIA', 'OTHER')),
  description                  TEXT,
  external_url                 TEXT,
  status                       TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_by_user_id           TEXT NOT NULL REFERENCES users(user_id),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_curriculum_resources_id_org UNIQUE (resource_id, organization_id),
  -- Same-organization provenance for Source Asset IS enforceable at the
  -- FK layer (source_assets has the needed composite unique) — never
  -- trust the application alone here.
  CONSTRAINT fk_curriculum_resources_source_asset_same_org
    FOREIGN KEY (source_asset_id, organization_id) REFERENCES source_assets(source_asset_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_resources_org_status
  ON curriculum_resources (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_curriculum_resources_source_asset
  ON curriculum_resources (source_asset_id);

-- Lesson -> Curriculum Resource linking (Step 8's required minimum;
-- Course/Unit resource linking deliberately deferred — no real consumer
-- needs it yet, and it is easy to add additively later).
CREATE TABLE IF NOT EXISTS curriculum_lesson_resources (
  lesson_id     TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (lesson_id, resource_id),
  CONSTRAINT fk_curriculum_lesson_resources_lesson_same_org
    FOREIGN KEY (lesson_id, organization_id) REFERENCES curriculum_lessons(lesson_id, organization_id),
  CONSTRAINT fk_curriculum_lesson_resources_resource_same_org
    FOREIGN KEY (resource_id, organization_id) REFERENCES curriculum_resources(resource_id, organization_id)
);

CREATE TABLE IF NOT EXISTS curriculum_releases (
  release_id            TEXT PRIMARY KEY,
  organization_id       TEXT NOT NULL REFERENCES organizations(organization_id),
  course_id             TEXT NOT NULL,
  version_number        INTEGER NOT NULL CHECK (version_number >= 1),
  -- Immutable canonical snapshot of the course + its active units/lessons/
  -- resource references at the moment of publication (see
  -- curriculum-catalog-service.ts's buildReleaseSnapshot). Never
  -- overwritten after insert (enforced below).
  snapshot              JSONB NOT NULL,
  content_hash          TEXT NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  status                TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'RETIRED')),
  published_by_user_id  TEXT NOT NULL REFERENCES users(user_id),
  published_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_by_user_id    TEXT REFERENCES users(user_id),
  retired_at            TIMESTAMPTZ,
  CHECK (
    (status = 'RETIRED' AND retired_by_user_id IS NOT NULL AND retired_at IS NOT NULL)
    OR
    (status = 'PUBLISHED' AND retired_by_user_id IS NULL AND retired_at IS NULL)
  ),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_curriculum_releases_course_version UNIQUE (course_id, version_number),
  CONSTRAINT fk_curriculum_releases_course_same_org
    FOREIGN KEY (course_id, organization_id) REFERENCES curriculum_courses(course_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_releases_course_version
  ON curriculum_releases (course_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_curriculum_releases_org_status
  ON curriculum_releases (organization_id, status);

-- Immutability guard (Step 19): once inserted, a release's identity and
-- content can never change — only the retire transition (status +
-- retired_by_user_id + retired_at) is permitted. This is enforced at the
-- database layer, not merely by the service never issuing such an
-- UPDATE, so a future bug or direct SQL cannot silently rewrite history.
CREATE OR REPLACE FUNCTION curriculum_releases_prevent_mutation() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.release_id           IS DISTINCT FROM OLD.release_id
     OR NEW.organization_id   IS DISTINCT FROM OLD.organization_id
     OR NEW.course_id         IS DISTINCT FROM OLD.course_id
     OR NEW.version_number    IS DISTINCT FROM OLD.version_number
     OR NEW.snapshot          IS DISTINCT FROM OLD.snapshot
     OR NEW.content_hash      IS DISTINCT FROM OLD.content_hash
     OR NEW.published_by_user_id IS DISTINCT FROM OLD.published_by_user_id
     OR NEW.published_at      IS DISTINCT FROM OLD.published_at
     OR NEW.created_at        IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'curriculum_releases rows are immutable except for the retire transition (status/retired_by_user_id/retired_at)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_curriculum_releases_prevent_mutation ON curriculum_releases;
CREATE TRIGGER trg_curriculum_releases_prevent_mutation
  BEFORE UPDATE ON curriculum_releases
  FOR EACH ROW
  EXECUTE FUNCTION curriculum_releases_prevent_mutation();
