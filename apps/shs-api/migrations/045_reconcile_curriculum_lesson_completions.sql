-- SHF Database Phase 3.1 — reconcile shs_dev baseline ledger row for
-- migration 031 with missing physical schema.
--
-- Migration 031 is recorded in shs_dev's schema_migrations ledger with
-- runner_version 'baseline-1' and execution_duration_ms 0 — the same
-- baseline-ledger fingerprint already repaired for migrations 035-038 in
-- 042_reconcile_missing_035_038_schema.sql. A baseline row records that a
-- migration is considered applied without running its SQL, so
-- curriculum_lesson_completions was never physically created in shs_dev.
--
-- This repair is additive only and replays migration 031's exact current
-- canonical shape (verified unchanged against all current backend code:
-- CurriculumCompletionRepo, CurriculumCompletionService,
-- grade12-eligibility-service.ts, capstone-entry-service.ts). It is a
-- no-op on any database where migration 031 already ran for real (fresh
-- databases, or shs_dev after this repair), because every statement is
-- already guarded with IF NOT EXISTS, matching 031's own original SQL.

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
