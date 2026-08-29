-- 033_career_workforce_foundation.sql
-- Canonical Career Center identity and Career -> Curriculum requirements.
-- Curriculum content remains owned by the existing file/catalog system; this
-- relation stores identifiers and requirement metadata only.

CREATE TABLE IF NOT EXISTS career_families (
  career_family_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS careers (
  career_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  career_family_id TEXT NOT NULL REFERENCES career_families(career_family_id),
  sector TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS careers_active_family_idx
  ON careers(career_family_id, status, title);

CREATE TABLE IF NOT EXISTS career_curriculum_requirements (
  career_curriculum_requirement_id TEXT PRIMARY KEY,
  career_id TEXT NOT NULL REFERENCES careers(career_id),
  curriculum_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  requirement_type TEXT NOT NULL
    CHECK (requirement_type IN ('required', 'recommended')),
  min_grade INTEGER,
  max_grade INTEGER,
  developmental_stage TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (min_grade IS NULL OR min_grade BETWEEN 6 AND 12),
  CHECK (max_grade IS NULL OR max_grade BETWEEN 6 AND 12),
  CHECK (min_grade IS NULL OR max_grade IS NULL OR min_grade <= max_grade),
  CHECK (developmental_stage IS NULL OR developmental_stage IN ('DISCOVER', 'EXPLORE', 'PREPARE_PROVE', 'TRANSITION', 'ADULT_ACCELERATED')),
  UNIQUE (career_id, curriculum_id, lesson_id, requirement_type)
);

CREATE INDEX IF NOT EXISTS career_curriculum_requirements_lookup_idx
  ON career_curriculum_requirements(career_id, requirement_type, min_grade, max_grade);

-- Minimal architecture proof record. This is a career identity and a
-- requirement reference, not curriculum content, a credential, or readiness.
INSERT INTO career_families (career_family_id, slug, name, status)
VALUES ('career_family_data_center_ai_infrastructure', 'data-center-ai-infrastructure', 'Data Center & AI Infrastructure', 'active')
ON CONFLICT (career_family_id) DO UPDATE
SET slug = EXCLUDED.slug, name = EXCLUDED.name, status = EXCLUDED.status, updated_at = NOW();

INSERT INTO careers (career_id, slug, title, description, status, career_family_id, sector)
VALUES (
  'career_data_center_technician',
  'data-center-technician',
  'Data Center Technician',
  'Foundational operations role supporting data-center hardware, systems, and facilities workflows.',
  'active',
  'career_family_data_center_ai_infrastructure',
  'Infrastructure'
)
ON CONFLICT (career_id) DO UPDATE
SET slug = EXCLUDED.slug, title = EXCLUDED.title, description = EXCLUDED.description,
    status = EXCLUDED.status, career_family_id = EXCLUDED.career_family_id,
    sector = EXCLUDED.sector, updated_at = NOW();

INSERT INTO career_curriculum_requirements (
  career_curriculum_requirement_id, career_id, curriculum_id, lesson_id,
  requirement_type, min_grade, max_grade, developmental_stage
)
VALUES (
  'ccr_data_center_technician_foundations_discover',
  'career_data_center_technician',
  'data-center-foundations',
  'data-center-foundations-introduction',
  'recommended', 6, 8, 'DISCOVER'
)
ON CONFLICT (career_curriculum_requirement_id) DO UPDATE
SET career_id = EXCLUDED.career_id, curriculum_id = EXCLUDED.curriculum_id,
    lesson_id = EXCLUDED.lesson_id, requirement_type = EXCLUDED.requirement_type,
    min_grade = EXCLUDED.min_grade, max_grade = EXCLUDED.max_grade,
    developmental_stage = EXCLUDED.developmental_stage, updated_at = NOW();
