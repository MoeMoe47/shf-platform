-- SHF Curriculum Phase 6: verified evidence and truth projection.
-- Extends the existing Prepare/Prove evidence record; it does not create a
-- second evidence architecture.
ALTER TABLE prepare_prove_evidence
  DROP CONSTRAINT IF EXISTS prepare_prove_evidence_source_record_id_fkey;
ALTER TABLE prepare_prove_evidence
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'PREPARE_PROVE',
  ADD COLUMN IF NOT EXISTS assignment_id TEXT,
  ADD COLUMN IF NOT EXISTS curriculum_release_id TEXT,
  ADD COLUMN IF NOT EXISTS release_version INTEGER,
  ADD COLUMN IF NOT EXISTS course_id TEXT,
  ADD COLUMN IF NOT EXISTS unit_stable_key TEXT,
  ADD COLUMN IF NOT EXISTS lesson_stable_key TEXT,
  ADD COLUMN IF NOT EXISTS definition_id TEXT,
  ADD COLUMN IF NOT EXISTS evidence_rule_id TEXT,
  ADD COLUMN IF NOT EXISTS evidence_rule_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS competency_id TEXT,
  ADD COLUMN IF NOT EXISTS verifier_user_id TEXT,
  ADD COLUMN IF NOT EXISTS source_occurred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supersedes_evidence_id TEXT;
CREATE INDEX IF NOT EXISTS prepare_prove_evidence_lineage_idx
  ON prepare_prove_evidence (organization_id, user_id, assignment_id, curriculum_release_id);
CREATE UNIQUE INDEX IF NOT EXISTS prepare_prove_evidence_phase6_source_idx
  ON prepare_prove_evidence (organization_id, source_type, source_record_id, evidence_rule_id)
  WHERE evidence_rule_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS curriculum_evidence_rules (
  evidence_rule_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  source_type TEXT NOT NULL,
  evidence_type TEXT,
  truth_fact_type TEXT,
  competency_id TEXT,
  rule_version INTEGER NOT NULL CHECK (rule_version > 0),
  review_required BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RETIRED')),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, evidence_rule_id, rule_version)
);

CREATE TABLE IF NOT EXISTS curriculum_truth_facts (
  truth_fact_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  learner_user_id TEXT NOT NULL REFERENCES users(user_id),
  fact_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  evidence_id TEXT,
  assignment_id TEXT,
  curriculum_release_id TEXT,
  release_version INTEGER,
  course_id TEXT,
  unit_stable_key TEXT,
  lesson_stable_key TEXT,
  definition_id TEXT,
  evidence_rule_id TEXT,
  evidence_rule_version INTEGER,
  competency_id TEXT,
  provenance_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, source_type, source_record_id, fact_type, evidence_rule_id)
);
CREATE INDEX IF NOT EXISTS curriculum_truth_facts_scope_idx
  ON curriculum_truth_facts (organization_id, learner_user_id, created_at DESC);
