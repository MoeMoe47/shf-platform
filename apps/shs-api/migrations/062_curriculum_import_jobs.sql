-- 062_curriculum_import_jobs.sql
--
-- SHF Lesson + Assignment + Curriculum — Phase 4.5A: Curriculum Import
-- Job, Candidate Model, and Transaction-Safe Structured Import
-- Foundation.
--
-- This migration does NOT introduce a second curriculum catalog, a
-- second source-ingestion domain, or a second review/publish lifecycle.
-- It adds only the orchestration state an import pipeline needs before
-- and around calling the existing Phase 2 curriculum-catalog domain
-- (curriculum_courses/units/lessons/resources, migration 059) and the
-- existing Phase 1 source-ingestion domain (source_assets/
-- source_document_versions, migration 058). Neither of those tables is
-- altered here.
--
-- STATUS LIFECYCLE (curriculum_import_jobs.status):
--   DRAFT        -- job row created, source reference recorded
--   READY        -- candidates generated, all passed validation
--   NEEDS_REVIEW -- candidates generated, at least one failed validation
--                   (including a detected course stable_key conflict —
--                   Phase 4.5A's replacement for the old importer's hard
--                   "one-time import" throw; Phase 4.5B will define the
--                   actual re-import resolution)
--   IMPORTING    -- execution has begun (see below on why this state is
--                   real and observable, not decorative)
--   COMPLETED    -- catalog rows created, transaction committed
--   FAILED       -- execution attempted and did not commit; job/error
--                   preserved for diagnosis; retryable
--   CANCELLED    -- explicitly cancelled before execution committed
--
-- The brief's suggested state list also included VALIDATING and a
-- separate distinction between "created" and "validated" as two
-- persisted states. This implementation performs candidate generation
-- and validation synchronously within one service call (job creation
-- IS candidate generation IS validation, in this phase — there is no
-- async worker yet, see Phase 4.6), so a persisted VALIDATING state
-- would never be observable to any concurrent reader; it was dropped
-- per the brief's own instruction not to add states without behavior.
-- IMPORTING is kept because it IS observable: the job row is moved to
-- IMPORTING and committed on its own (outside the catalog-creation
-- transaction) before that transaction opens, so a process crash mid-
-- import leaves a genuinely diagnosable IMPORTING row behind rather than
-- silently rolling back to invisibility.
CREATE TABLE IF NOT EXISTS curriculum_import_jobs (
  import_job_id        TEXT PRIMARY KEY,
  organization_id       TEXT NOT NULL REFERENCES organizations(organization_id),
  import_type           TEXT NOT NULL CHECK (import_type IN ('STATIC_JSON')),
  -- Phase 1 provenance, when the source genuinely went through Phase 1
  -- ingestion. Both nullable: Phase 4.5A's only source adapter reads
  -- pre-existing static JSON directly off disk (Step 21) and never
  -- fabricates a Source Asset/Source Document Version for it.
  source_asset_id       TEXT,
  source_document_version_id TEXT REFERENCES source_document_versions(source_document_version_id),
  -- Legacy/static identifier for STATIC_JSON imports, e.g. "asl" or
  -- "data-center-foundations" (the *-student folder name, minus suffix).
  source_key            TEXT,
  status                TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'READY', 'NEEDS_REVIEW', 'IMPORTING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  created_by_user_id    TEXT NOT NULL REFERENCES users(user_id),
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  failed_at             TIMESTAMPTZ,
  error_summary         TEXT,
  metadata               JSONB NOT NULL DEFAULT '{}'::jsonb,
  revision               INTEGER NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_curriculum_import_jobs_id_org UNIQUE (import_job_id, organization_id),
  -- Same-org composite FK, matching curriculum_resources' identical
  -- pattern for source_asset_id in migration 059.
  CONSTRAINT fk_curriculum_import_jobs_source_asset_same_org
    FOREIGN KEY (source_asset_id, organization_id) REFERENCES source_assets(source_asset_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_import_jobs_org_status
  ON curriculum_import_jobs (organization_id, status);

-- Candidates are the proposed Course/Unit/Lesson/Resource graph a job
-- would create, generated and validated BEFORE any catalog row exists.
-- created_entity_id is populated only after a successful execute() and
-- is the durable candidate -> canonical entity mapping (Step 15) —
-- deliberately folded into this table rather than a third results table,
-- per the brief's "avoid excessive tables."
CREATE TABLE IF NOT EXISTS curriculum_import_candidates (
  import_candidate_id   TEXT PRIMARY KEY,
  import_job_id          TEXT NOT NULL,
  organization_id         TEXT NOT NULL REFERENCES organizations(organization_id),
  candidate_type          TEXT NOT NULL CHECK (candidate_type IN ('COURSE', 'UNIT', 'LESSON', 'RESOURCE')),
  parent_candidate_id     TEXT,
  stable_key              TEXT NOT NULL,
  title                   TEXT NOT NULL,
  sequence                INTEGER NOT NULL DEFAULT 1 CHECK (sequence >= 1),
  -- Structured-source provenance (Step 5/24/25): a relative path/filename
  -- identifying exactly which source file produced this candidate. Fine-
  -- grained page/section provenance is explicitly out of scope (Step 6) —
  -- this is document-level-or-finer-file-level only.
  source_reference        TEXT,
  -- Full original structured content, preserved losslessly (Steps 22-23)
  -- so Phase 4.5B's future mapping/normalization decisions are never
  -- blocked by data Phase 4.5A already discarded.
  payload                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_status       TEXT NOT NULL DEFAULT 'PENDING' CHECK (validation_status IN ('PENDING', 'VALID', 'INVALID')),
  validation_errors       JSONB NOT NULL DEFAULT '[]'::jsonb,
  included                BOOLEAN NOT NULL DEFAULT TRUE,
  created_entity_type     TEXT CHECK (created_entity_type IS NULL OR created_entity_type IN ('COURSE', 'UNIT', 'LESSON', 'RESOURCE')),
  created_entity_id       TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_curriculum_import_candidates_id_org UNIQUE (import_candidate_id, organization_id),
  CONSTRAINT fk_curriculum_import_candidates_job_same_org
    FOREIGN KEY (import_job_id, organization_id) REFERENCES curriculum_import_jobs(import_job_id, organization_id),
  CONSTRAINT fk_curriculum_import_candidates_parent_same_org
    FOREIGN KEY (parent_candidate_id, organization_id) REFERENCES curriculum_import_candidates(import_candidate_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_import_candidates_job
  ON curriculum_import_candidates (import_job_id, candidate_type, sequence);
CREATE INDEX IF NOT EXISTS idx_curriculum_import_candidates_parent
  ON curriculum_import_candidates (parent_candidate_id);
