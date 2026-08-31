-- SHF Ecosystem Phase 8 — canonical Learning Arcade Activity/Attempt/
-- Result foundation.
--
-- Domain boundary (see docs/SHF_LEARNING_ARCADE_MASTERY_ARCHITECTURE.md):
-- Activity = definition of an instructional game/simulation/challenge
-- (global reference data, mirrors careers/credential_definitions — an
-- instructional definition is not institution-owned). Attempt = one
-- learner execution. Result = the canonical, immutable outcome of that
-- Attempt. Mastery is never a separate stored state — it is a boolean
-- computed once, server-side, at Result-creation time from the Activity's
-- own stored policy (never a client-supplied "mastered" flag), and it is
-- persisted ON the Result (not derived at every read) so a later change
-- to an Activity's policy can never retroactively rewrite historical
-- mastery — the same non-retroactivity principle already used for
-- learner_credentials.expires_at (migration 051).
CREATE TABLE IF NOT EXISTS arcade_activities (
  arcade_activity_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'RETRIEVAL', 'TROUBLESHOOTING', 'SIMULATION', 'SCENARIO', 'SYSTEMS_THINKING', 'CHALLENGE'
  )),
  -- Static instructional content lives in JSON, not the database (see
  -- assignments.lesson_id, migration 039) — free-text, no FK, by
  -- established convention.
  lesson_id TEXT,
  -- Exactly one of two deterministic mastery rules — no fuzzy/AI
  -- interpretation. PASSED_FLAG: the learner's own reported pass/fail on
  -- a binary-outcome activity (e.g. a scenario with a single correct
  -- resolution). SCORE_THRESHOLD: a numeric score compared against this
  -- activity's own stored threshold — never a client-supplied threshold.
  mastery_rule TEXT NOT NULL CHECK (mastery_rule IN ('PASSED_FLAG', 'SCORE_THRESHOLD')),
  max_score INTEGER CHECK (max_score IS NULL OR max_score > 0),
  pass_threshold_score INTEGER CHECK (pass_threshold_score IS NULL OR pass_threshold_score >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A SCORE_THRESHOLD activity must define both bounds; a PASSED_FLAG
  -- activity must define neither (it has no numeric score at all).
  CHECK (
    (mastery_rule = 'SCORE_THRESHOLD' AND max_score IS NOT NULL AND pass_threshold_score IS NOT NULL AND pass_threshold_score <= max_score)
    OR (mastery_rule = 'PASSED_FLAG' AND max_score IS NULL AND pass_threshold_score IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS arcade_attempts (
  arcade_attempt_id TEXT PRIMARY KEY,
  arcade_activity_id TEXT NOT NULL REFERENCES arcade_activities(arcade_activity_id),
  learner_user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED', 'COMPLETED', 'ABANDONED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CHECK ((status = 'COMPLETED') = (completed_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS arcade_results (
  arcade_result_id TEXT PRIMARY KEY,
  -- One Attempt produces at most one final Result — never multiple
  -- revisions of "the" outcome. A retry is a new Attempt, giving a clean,
  -- unambiguous historical trail (mirrors the phase brief's own
  -- preference for the simplest model the evidence supports).
  arcade_attempt_id TEXT NOT NULL UNIQUE REFERENCES arcade_attempts(arcade_attempt_id),
  arcade_activity_id TEXT NOT NULL REFERENCES arcade_activities(arcade_activity_id),
  learner_user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  passed BOOLEAN,
  score INTEGER CHECK (score IS NULL OR score >= 0),
  max_score INTEGER CHECK (max_score IS NULL OR max_score > 0),
  -- Server-derived at creation time from the Activity's mastery_rule —
  -- never accepted as client input (see credential-service.ts's identical
  -- non-retroactivity precedent). Immutable once written.
  mastery_achieved BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (score IS NULL OR max_score IS NULL OR score <= max_score)
);

CREATE INDEX IF NOT EXISTS arcade_attempts_learner_idx ON arcade_attempts (organization_id, learner_user_id, arcade_activity_id);
CREATE INDEX IF NOT EXISTS arcade_results_learner_idx ON arcade_results (organization_id, learner_user_id);
CREATE INDEX IF NOT EXISTS arcade_results_mastery_idx ON arcade_results (organization_id, learner_user_id) WHERE mastery_achieved;
