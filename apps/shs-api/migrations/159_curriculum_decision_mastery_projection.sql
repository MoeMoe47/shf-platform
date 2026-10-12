-- CURRICULUM-LEARNING-EVIDENCE-2:
-- Existing curriculum_learner_mastery remains the canonical current
-- competency/mastery projection. These columns preserve the authoritative
-- review decision and reviewer actor that caused the projection.
ALTER TABLE curriculum_learner_mastery
  ADD COLUMN IF NOT EXISTS source_decision_id TEXT REFERENCES learner_competency_decisions(decision_id),
  ADD COLUMN IF NOT EXISTS reviewer_user_id TEXT REFERENCES users(user_id),
  ADD COLUMN IF NOT EXISTS source_authority TEXT NOT NULL DEFAULT 'curriculum.authorized-review-decision',
  ADD COLUMN IF NOT EXISTS effective_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_curriculum_learner_mastery_decision
  ON curriculum_learner_mastery (organization_id, tenant_id, source_decision_id)
  WHERE source_decision_id IS NOT NULL;
