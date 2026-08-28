-- 031_curriculum_lesson_completions.sql

CREATE TABLE IF NOT EXISTS curriculum_lesson_completions (
  completion_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  curriculum_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id, curriculum_id, lesson_id),
  UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS curriculum_lesson_completions_reporting_idx
  ON curriculum_lesson_completions (organization_id, curriculum_id, completed_at);
