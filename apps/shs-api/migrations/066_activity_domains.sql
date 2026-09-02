-- 066_activity_domains.sql
--
-- SHF Curriculum — Phase 5: Authoritative Activity Domains for
-- Assessment, Reflection, and Practice.
--
-- Two layers, mirroring the existing Resource/Arcade-link pattern
-- established in migrations 059/064 (curriculum-catalog owns
-- definitions; a separate domain owns learner results):
--
--   1. Definition tables (curriculum-catalog-owned): one row per Lesson,
--      holding the real question/prompt content this repo's own audit
--      found in the legacy static lesson JSON (`quiz.items[]`, types
--      "mcq"/"short"/"reflection" — see curriculum-import-source-
--      adapter.ts's Phase 5 extraction). Mutable while the owning
--      Course is DRAFT, exactly like curriculum_resources; frozen into
--      an immutable curriculum_releases.snapshot at publish time
--      (buildReleaseSnapshot), never read live thereafter by a result
--      producer. Practice has no real source content today (confirmed
--      by this phase's own audit) — its table exists so the domain is
--      real and testable via synthetic fixtures, never populated by the
--      static-JSON import path until real Practice content exists.
--
--   2. Attempt/Result tables (new activity-domain-owned): the
--      authoritative learner-result record. Structurally mirrors
--      arcade_attempts/arcade_results (migration 052) — one Attempt
--      produces at most one final Result, a retry is a new Attempt —
--      but ADDS the assignment_id/curriculum_release_id/release_version
--      lineage columns Arcade never needed (migration 061's own
--      addition to curriculum_lesson_completions is the precedent this
--      copies), because the Core Architectural Rule requires every
--      result to bind the *exact* curriculum context the learner was
--      assigned, not just "this learner did this lesson" in the
--      abstract. Idempotency follows curriculum_lesson_completions'
--      exact shape: idempotency_key + UNIQUE(organization_id,
--      idempotency_key), alongside a natural-key uniqueness constraint.
--
-- Reflection has no server-side "grading" concept, so it gets one
-- table (versioned submissions, mirroring project_submissions'
-- UNIQUE(team_id, version) monotonic-version pattern) rather than an
-- attempt/result pair.
--
-- assignment_id is a composite FK — migration 043 added
-- assignments_organization_assignment_key UNIQUE (organization_id,
-- assignment_id), so cross-org linkage is rejected at the database
-- layer itself (Step 42), not merely verified in the service.

-- ---------------- Definitions (curriculum-catalog-owned) ----------------

CREATE TABLE IF NOT EXISTS curriculum_assessment_definitions (
  assessment_definition_id TEXT PRIMARY KEY,
  organization_id          TEXT NOT NULL REFERENCES organizations(organization_id),
  lesson_id                TEXT NOT NULL,
  -- [{itemId, type: 'mcq'|'short', prompt, choices?, correctIndex?, explain?}]
  -- correctIndex is real grading data — never served to a learner
  -- fetching the definition to take the assessment (see
  -- assessment-domain-service.ts's own stripping of this field).
  items                    JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_reference         TEXT,
  source_hash              TEXT,
  status                   TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_by_user_id       TEXT NOT NULL REFERENCES users(user_id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_curriculum_assessment_definitions_id_org UNIQUE (assessment_definition_id, organization_id),
  CONSTRAINT uq_curriculum_assessment_definitions_lesson UNIQUE (lesson_id, organization_id),
  CONSTRAINT fk_curriculum_assessment_definitions_lesson_same_org
    FOREIGN KEY (lesson_id, organization_id) REFERENCES curriculum_lessons(lesson_id, organization_id)
);

CREATE TABLE IF NOT EXISTS curriculum_reflection_definitions (
  reflection_definition_id TEXT PRIMARY KEY,
  organization_id          TEXT NOT NULL REFERENCES organizations(organization_id),
  lesson_id                TEXT NOT NULL,
  -- [{itemId, prompt}] — reflection prompts are never auto-graded (Step 14).
  items                    JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_reference         TEXT,
  source_hash              TEXT,
  status                   TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_by_user_id       TEXT NOT NULL REFERENCES users(user_id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_curriculum_reflection_definitions_id_org UNIQUE (reflection_definition_id, organization_id),
  CONSTRAINT uq_curriculum_reflection_definitions_lesson UNIQUE (lesson_id, organization_id),
  CONSTRAINT fk_curriculum_reflection_definitions_lesson_same_org
    FOREIGN KEY (lesson_id, organization_id) REFERENCES curriculum_lessons(lesson_id, organization_id)
);

CREATE TABLE IF NOT EXISTS curriculum_practice_definitions (
  practice_definition_id   TEXT PRIMARY KEY,
  organization_id          TEXT NOT NULL REFERENCES organizations(organization_id),
  lesson_id                TEXT NOT NULL,
  title                    TEXT NOT NULL,
  instructions              TEXT,
  -- 'OBJECTIVE' items are scored server-side exactly like Assessment
  -- mcq items; 'COMPLETION' means the requirement is "did the learner
  -- submit the required action," never a trusted client `completed:true`
  -- (Step 23) — completion_action_label documents what that action is.
  completion_mode          TEXT NOT NULL DEFAULT 'COMPLETION' CHECK (completion_mode IN ('OBJECTIVE', 'COMPLETION')),
  completion_action_label  TEXT,
  items                    JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_reference         TEXT,
  source_hash              TEXT,
  status                   TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_by_user_id       TEXT NOT NULL REFERENCES users(user_id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_curriculum_practice_definitions_id_org UNIQUE (practice_definition_id, organization_id),
  CONSTRAINT uq_curriculum_practice_definitions_lesson UNIQUE (lesson_id, organization_id),
  CONSTRAINT fk_curriculum_practice_definitions_lesson_same_org
    FOREIGN KEY (lesson_id, organization_id) REFERENCES curriculum_lessons(lesson_id, organization_id)
);

-- ---------------- Assessment: Attempts + Results ----------------

CREATE TABLE IF NOT EXISTS assessment_attempts (
  assessment_attempt_id    TEXT PRIMARY KEY,
  organization_id          TEXT NOT NULL REFERENCES organizations(organization_id),
  learner_user_id          TEXT NOT NULL REFERENCES users(user_id),
  -- Composite FK (not a simple assignment_id reference): migration 043
  -- already added assignments_organization_assignment_key UNIQUE
  -- (organization_id, assignment_id), so cross-org linkage is rejected
  -- at the database layer, not just verified in the service (Step 42).
  assignment_id             TEXT NOT NULL,
  curriculum_release_id     TEXT NOT NULL,
  release_version           INTEGER NOT NULL,
  unit_stable_key            TEXT NOT NULL,
  lesson_stable_key          TEXT NOT NULL,
  assessment_definition_id  TEXT NOT NULL,
  attempt_number             INTEGER NOT NULL CHECK (attempt_number >= 1),
  status                    TEXT NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED', 'SUBMITTED')),
  idempotency_key            TEXT NOT NULL,
  started_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at                TIMESTAMPTZ,
  CHECK ((status = 'SUBMITTED') = (submitted_at IS NOT NULL)),
  CONSTRAINT uq_assessment_attempts_idem UNIQUE (organization_id, idempotency_key),
  CONSTRAINT uq_assessment_attempts_natural UNIQUE (organization_id, learner_user_id, assignment_id, lesson_stable_key, attempt_number),
  CONSTRAINT fk_assessment_attempts_assignment_same_org
    FOREIGN KEY (organization_id, assignment_id) REFERENCES assignments(organization_id, assignment_id),
  CONSTRAINT fk_assessment_attempts_release_same_org
    FOREIGN KEY (curriculum_release_id, organization_id) REFERENCES curriculum_releases(release_id, organization_id),
  CONSTRAINT fk_assessment_attempts_definition_same_org
    FOREIGN KEY (assessment_definition_id, organization_id) REFERENCES curriculum_assessment_definitions(assessment_definition_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_learner
  ON assessment_attempts (organization_id, learner_user_id, assignment_id, lesson_stable_key);

CREATE TABLE IF NOT EXISTS assessment_results (
  assessment_result_id     TEXT PRIMARY KEY,
  assessment_attempt_id    TEXT NOT NULL UNIQUE REFERENCES assessment_attempts(assessment_attempt_id),
  organization_id          TEXT NOT NULL REFERENCES organizations(organization_id),
  learner_user_id          TEXT NOT NULL REFERENCES users(user_id),
  assignment_id             TEXT NOT NULL,
  curriculum_release_id     TEXT NOT NULL,
  release_version           INTEGER NOT NULL,
  unit_stable_key            TEXT NOT NULL,
  lesson_stable_key          TEXT NOT NULL,
  assessment_definition_id  TEXT NOT NULL,
  -- [{itemId, type, choiceIndex?, text?}] — the learner's submitted
  -- answers, never the correct-answer key.
  answers                   JSONB NOT NULL,
  score                     INTEGER CHECK (score IS NULL OR score >= 0),
  max_score                 INTEGER CHECK (max_score IS NULL OR max_score > 0),
  percent                   NUMERIC(5,2) CHECK (percent IS NULL OR (percent >= 0 AND percent <= 100)),
  pass_threshold_percent    INTEGER CHECK (pass_threshold_percent IS NULL OR (pass_threshold_percent >= 0 AND pass_threshold_percent <= 100)),
  -- Server-derived at creation time from the objectively-gradable items
  -- and the effective pass threshold — never accepted as client input
  -- (mirrors arcade_results.mastery_achieved's identical precedent).
  passed                    BOOLEAN NOT NULL,
  needs_review               BOOLEAN NOT NULL DEFAULT false,
  graded_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (score IS NULL OR max_score IS NULL OR score <= max_score),
  CONSTRAINT fk_assessment_results_assignment_same_org
    FOREIGN KEY (organization_id, assignment_id) REFERENCES assignments(organization_id, assignment_id)
);
CREATE INDEX IF NOT EXISTS idx_assessment_results_learner
  ON assessment_results (organization_id, learner_user_id, assignment_id, lesson_stable_key);

-- ---------------- Reflection: versioned Submissions ----------------

CREATE TABLE IF NOT EXISTS reflection_submissions (
  reflection_submission_id TEXT PRIMARY KEY,
  organization_id          TEXT NOT NULL REFERENCES organizations(organization_id),
  learner_user_id          TEXT NOT NULL REFERENCES users(user_id),
  assignment_id             TEXT NOT NULL,
  curriculum_release_id     TEXT NOT NULL,
  release_version           INTEGER NOT NULL,
  unit_stable_key            TEXT NOT NULL,
  lesson_stable_key          TEXT NOT NULL,
  reflection_definition_id  TEXT NOT NULL,
  version                   INTEGER NOT NULL CHECK (version >= 1),
  -- [{itemId, text}] — potentially sensitive learner content; never
  -- written to generic application logs (Step 41 — see
  -- reflection-domain-service.ts's own header note).
  responses                 JSONB NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'REVIEWED')),
  reviewed_by_user_id        TEXT REFERENCES users(user_id),
  reviewed_at                 TIMESTAMPTZ,
  review_status               TEXT CHECK (review_status IS NULL OR review_status IN ('APPROVED', 'NEEDS_REVISION')),
  CHECK ((status = 'REVIEWED') = (reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL AND review_status IS NOT NULL)),
  idempotency_key             TEXT NOT NULL,
  submitted_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_reflection_submissions_idem UNIQUE (organization_id, idempotency_key),
  CONSTRAINT uq_reflection_submissions_natural UNIQUE (organization_id, learner_user_id, assignment_id, lesson_stable_key, version),
  CONSTRAINT fk_reflection_submissions_assignment_same_org
    FOREIGN KEY (organization_id, assignment_id) REFERENCES assignments(organization_id, assignment_id),
  CONSTRAINT fk_reflection_submissions_release_same_org
    FOREIGN KEY (curriculum_release_id, organization_id) REFERENCES curriculum_releases(release_id, organization_id),
  CONSTRAINT fk_reflection_submissions_definition_same_org
    FOREIGN KEY (reflection_definition_id, organization_id) REFERENCES curriculum_reflection_definitions(reflection_definition_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_reflection_submissions_learner
  ON reflection_submissions (organization_id, learner_user_id, assignment_id, lesson_stable_key);

-- ---------------- Practice: Attempts + Results ----------------

CREATE TABLE IF NOT EXISTS practice_attempts (
  practice_attempt_id      TEXT PRIMARY KEY,
  organization_id          TEXT NOT NULL REFERENCES organizations(organization_id),
  learner_user_id          TEXT NOT NULL REFERENCES users(user_id),
  assignment_id             TEXT NOT NULL,
  curriculum_release_id     TEXT NOT NULL,
  release_version           INTEGER NOT NULL,
  unit_stable_key            TEXT NOT NULL,
  lesson_stable_key          TEXT NOT NULL,
  practice_definition_id    TEXT NOT NULL,
  attempt_number             INTEGER NOT NULL CHECK (attempt_number >= 1),
  status                    TEXT NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED', 'SUBMITTED')),
  idempotency_key             TEXT NOT NULL,
  started_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at                 TIMESTAMPTZ,
  CHECK ((status = 'SUBMITTED') = (submitted_at IS NOT NULL)),
  CONSTRAINT uq_practice_attempts_idem UNIQUE (organization_id, idempotency_key),
  CONSTRAINT uq_practice_attempts_natural UNIQUE (organization_id, learner_user_id, assignment_id, lesson_stable_key, attempt_number),
  CONSTRAINT fk_practice_attempts_assignment_same_org
    FOREIGN KEY (organization_id, assignment_id) REFERENCES assignments(organization_id, assignment_id),
  CONSTRAINT fk_practice_attempts_release_same_org
    FOREIGN KEY (curriculum_release_id, organization_id) REFERENCES curriculum_releases(release_id, organization_id),
  CONSTRAINT fk_practice_attempts_definition_same_org
    FOREIGN KEY (practice_definition_id, organization_id) REFERENCES curriculum_practice_definitions(practice_definition_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_learner
  ON practice_attempts (organization_id, learner_user_id, assignment_id, lesson_stable_key);

CREATE TABLE IF NOT EXISTS practice_results (
  practice_result_id       TEXT PRIMARY KEY,
  practice_attempt_id      TEXT NOT NULL UNIQUE REFERENCES practice_attempts(practice_attempt_id),
  organization_id          TEXT NOT NULL REFERENCES organizations(organization_id),
  learner_user_id          TEXT NOT NULL REFERENCES users(user_id),
  assignment_id             TEXT NOT NULL,
  curriculum_release_id     TEXT NOT NULL,
  release_version           INTEGER NOT NULL,
  unit_stable_key            TEXT NOT NULL,
  lesson_stable_key          TEXT NOT NULL,
  practice_definition_id    TEXT NOT NULL,
  actions                   JSONB NOT NULL,
  score                     INTEGER CHECK (score IS NULL OR score >= 0),
  max_score                 INTEGER CHECK (max_score IS NULL OR max_score > 0),
  -- Server-derived: for OBJECTIVE definitions, true iff objectively
  -- graded correct; for COMPLETION definitions, true iff the required
  -- submission/action genuinely occurred (never a trusted client flag).
  completed                 BOOLEAN NOT NULL,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (score IS NULL OR max_score IS NULL OR score <= max_score),
  CONSTRAINT fk_practice_results_assignment_same_org
    FOREIGN KEY (organization_id, assignment_id) REFERENCES assignments(organization_id, assignment_id)
);
CREATE INDEX IF NOT EXISTS idx_practice_results_learner
  ON practice_results (organization_id, learner_user_id, assignment_id, lesson_stable_key);
