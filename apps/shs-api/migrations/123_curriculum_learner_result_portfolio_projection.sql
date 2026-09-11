-- SYS-4C3: Portfolio-owned projection of eligible Curriculum learner results.
-- Curriculum remains authoritative for Outcome/Mastery; this table is a
-- bounded consumer projection and deliberately does not copy Evidence.
CREATE TABLE IF NOT EXISTS portfolio_learner_result_entries (
  entry_id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolio_profiles(portfolio_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  learner_id TEXT NOT NULL REFERENCES users(user_id),
  outcome_id TEXT NOT NULL REFERENCES curriculum_learner_outcomes(outcome_id),
  mastery_id TEXT REFERENCES curriculum_learner_mastery(mastery_id),
  competency_id TEXT REFERENCES competency_definitions(competency_id),
  outcome_type TEXT NOT NULL,
  mastery_status TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUPERSEDED','REVOKED')),
  score NUMERIC,
  course_id TEXT,
  unit_stable_key TEXT,
  lesson_stable_key TEXT,
  activity_id TEXT,
  assignment_id TEXT,
  evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  provenance_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  supersedes_entry_id TEXT REFERENCES portfolio_learner_result_entries(entry_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, tenant_id, learner_id, outcome_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_portfolio_learner_result_active_competency
  ON portfolio_learner_result_entries (organization_id, tenant_id, learner_id, competency_id)
  WHERE status='ACTIVE' AND competency_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portfolio_learner_result_scope_status
  ON portfolio_learner_result_entries (organization_id, tenant_id, learner_id, status, created_at DESC);

