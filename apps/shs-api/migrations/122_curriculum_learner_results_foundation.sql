-- SYS-4C2: Curriculum-owned learner-result foundation.
-- Outcomes are immutable source-result records; mastery is a derived current
-- projection. Evidence and Truth remain owned by their existing domains.

CREATE TABLE IF NOT EXISTS curriculum_learner_outcomes (
  outcome_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  learner_user_id TEXT NOT NULL REFERENCES users(user_id),
  program_id TEXT,
  cohort_id TEXT,
  learning_path_id TEXT,
  course_id TEXT,
  unit_stable_key TEXT,
  lesson_stable_key TEXT,
  activity_id TEXT,
  assignment_id TEXT,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  outcome_type TEXT NOT NULL CHECK (outcome_type IN ('COMPLETED','PASSED','FAILED','DEMONSTRATED','NOT_DEMONSTRATED')),
  status TEXT NOT NULL DEFAULT 'CURRENT' CHECK (status IN ('CURRENT','SUPERSEDED','RETRACTED')),
  score NUMERIC,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  competency_id TEXT REFERENCES competency_definitions(competency_id),
  evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provenance_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  supersedes_outcome_id TEXT REFERENCES curriculum_learner_outcomes(outcome_id),
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_curriculum_learner_outcomes_source UNIQUE (organization_id, source_type, source_id),
  CONSTRAINT uq_curriculum_learner_outcomes_idem UNIQUE (organization_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_learner_outcomes_learner_current
  ON curriculum_learner_outcomes (organization_id, tenant_id, learner_user_id, status, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_curriculum_learner_outcomes_context
  ON curriculum_learner_outcomes (organization_id, tenant_id, course_id, lesson_stable_key, occurred_at DESC);

CREATE TABLE IF NOT EXISTS curriculum_learner_mastery (
  mastery_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  learner_user_id TEXT NOT NULL REFERENCES users(user_id),
  competency_id TEXT NOT NULL REFERENCES competency_definitions(competency_id),
  mastery_status TEXT NOT NULL CHECK (mastery_status IN ('NOT_DEMONSTRATED','DEVELOPING','DEMONSTRATED','MASTERED')),
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED','EVIDENCE_PENDING','VERIFIED','REVOKED')),
  source_outcome_id TEXT NOT NULL REFERENCES curriculum_learner_outcomes(outcome_id),
  evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  determined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provenance_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, tenant_id, learner_user_id, competency_id)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_learner_mastery_learner
  ON curriculum_learner_mastery (organization_id, tenant_id, learner_user_id, mastery_status);
