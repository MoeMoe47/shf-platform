-- SHF Database Phase 4.3 — reconcile shs_dev baseline ledger rows for
-- migrations 008, 012-029 (excluding 027, confirmed physically intact),
-- and 034 with missing physical schema.
--
-- All twenty affected migrations share the identical `runner_version =
-- baseline-1`, `execution_duration_ms = 0` fingerprint already repaired
-- for migrations 031 (045), 035-038 (042), and 030/032/033 (047). The
-- exhaustive schema-integrity verifier built in Phase 4.2
-- (`db:schema:integrity:strict`) found 390 expectation failures across
-- these 20 migrations and 23 tables in shs_dev — grouped by root
-- physical object, that is 23 missing/incomplete tables, not 390
-- independent defects.
--
-- Confirmed live, not theoretical: GET /prepare-prove/competency-
-- definitions/monitoring-proof crashed the running API process with
-- `relation "competency_definitions" does not exist` (migration 034).
--
-- This repair is additive only and replays each migration's exact
-- current canonical shape verbatim (verified unchanged against every
-- consumer in src/domain/reporting, src/domain/prepare-prove,
-- src/domain/identity, src/domain/programs, and src/security/rate-limit
-- style outbox hardening — no schema evolution beyond these 20
-- migrations' own text was found). Statements are already guarded
-- (CREATE TABLE/INDEX IF NOT EXISTS, ADD COLUMN IF NOT EXISTS) and are
-- therefore safe no-ops on a fresh database where these migrations
-- already ran for real.
--
-- Four `ADD CONSTRAINT` statements (originally in migrations 020, 021,
-- 026, 029) are NOT naturally idempotent — `ALTER TABLE ... ADD
-- CONSTRAINT <name> ...` fails if a constraint by that name already
-- exists, which it will on a fresh database (where the original
-- migration ran for real) even though it does not yet on shs_dev (where
-- the owning table doesn't exist at all yet). These four are wrapped in
-- the same `DO $$ ... IF NOT EXISTS (SELECT FROM pg_constraint ...) $$`
-- guard already established for this exact situation in migration 032.
-- Their preceding historical `DROP CONSTRAINT IF EXISTS` step is
-- omitted here — it existed only to redefine an already-existing
-- constraint's condition; this repair establishes the current, final
-- condition directly.
--
-- Migrations 007 and 027 are excluded here — audited and confirmed
-- physically intact in shs_dev already (integration_outbox exists per
-- 007, and all four truth_public_population_* tables per 027).

-- ---------------------------------------------------------------------
-- Migration 008 — report_drafts, report_draft_revisions
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS report_drafts (
  report_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  updated_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  report_type TEXT NOT NULL,
  report_title TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  brand_mode TEXT NOT NULL,
  visibility TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL DEFAULT 'draft' CHECK (lifecycle_status IN ('draft', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  draft_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_draft_revisions (
  revision_id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES report_drafts(report_id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  version INTEGER NOT NULL CHECK (version > 0),
  snapshot_json JSONB NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (report_id, version)
);

CREATE INDEX IF NOT EXISTS idx_report_drafts_scope
  ON report_drafts (tenant_id, organization_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_draft_revisions_scope
  ON report_draft_revisions (tenant_id, organization_id, report_id, version DESC);

-- ---------------------------------------------------------------------
-- Migration 012 — report_artifacts
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS report_artifacts (
  artifact_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  composition_type TEXT NOT NULL,
  composition_version INTEGER NOT NULL CHECK (composition_version > 0),
  classification TEXT NOT NULL CHECK (classification IN ('INTERNAL', 'RESTRICTED_EXTERNAL', 'PUBLIC')),
  canonical_input_manifest JSONB NOT NULL,
  artifact_version INTEGER NOT NULL DEFAULT 1 CHECK (artifact_version > 0),
  lifecycle_status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (lifecycle_status IN ('GENERATED')),
  content_hash TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (jsonb_typeof(canonical_input_manifest) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_report_artifacts_scope
  ON report_artifacts (tenant_id, organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_artifacts_classification
  ON report_artifacts (tenant_id, organization_id, classification, created_at DESC);

-- ---------------------------------------------------------------------
-- Migration 013 — report_distribution_recipients, report_disclosure_decisions
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS report_distribution_recipients (
  recipient_authorization_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  recipient_organization_ref TEXT NOT NULL REFERENCES organizations(organization_id),
  recipient_contact_ref TEXT,
  audience_type TEXT NOT NULL,
  purpose_scope TEXT,
  status TEXT NOT NULL DEFAULT 'AUTHORIZED' CHECK (status IN ('AUTHORIZED', 'REVOKED')),
  authorized_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((status = 'AUTHORIZED' AND revoked_at IS NULL) OR (status = 'REVOKED' AND revoked_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_report_distribution_recipients_scope
  ON report_distribution_recipients (tenant_id, organization_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS report_disclosure_decisions (
  disclosure_decision_id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES report_artifacts(artifact_id),
  artifact_version INTEGER NOT NULL CHECK (artifact_version > 0),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  classification TEXT NOT NULL CHECK (classification = 'RESTRICTED_EXTERNAL'),
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'BLOCKED')),
  decision_scope JSONB NOT NULL,
  reviewed_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rationale_code TEXT,
  policy_reference TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (jsonb_typeof(decision_scope) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_report_disclosure_decisions_artifact
  ON report_disclosure_decisions (tenant_id, organization_id, artifact_id, artifact_version, reviewed_at DESC);

-- ---------------------------------------------------------------------
-- Migration 014 — report_distributions
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS report_distributions (
  distribution_id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES report_artifacts(artifact_id),
  artifact_version INTEGER NOT NULL CHECK (artifact_version > 0),
  recipient_authorization_id TEXT NOT NULL REFERENCES report_distribution_recipients(recipient_authorization_id),
  disclosure_decision_id TEXT NOT NULL REFERENCES report_disclosure_decisions(disclosure_decision_id),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  authorized_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  distribution_purpose TEXT,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AUTHORIZED_FOR_DISTRIBUTION'
    CHECK (status IN ('AUTHORIZED_FOR_DISTRIBUTION')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_report_distributions_artifact
  ON report_distributions (tenant_id, organization_id, artifact_id, authorized_at DESC);

-- ---------------------------------------------------------------------
-- Migration 015 — report_artifacts generation idempotency
-- ---------------------------------------------------------------------

ALTER TABLE report_artifacts
  ADD COLUMN IF NOT EXISTS generation_idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS report_artifacts_generation_idempotency_idx
  ON report_artifacts (tenant_id, organization_id, generation_idempotency_key)
  WHERE generation_idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------
-- Migration 016 — report_public_eligibility_decisions
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS report_public_eligibility_decisions (
  public_eligibility_decision_id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  decision TEXT NOT NULL CHECK (decision IN ('PUBLIC_ELIGIBLE', 'PUBLIC_INELIGIBLE')),
  reason_code TEXT NOT NULL,
  policy_reference TEXT NOT NULL,
  decided_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  supersedes_decision_id TEXT REFERENCES report_public_eligibility_decisions(public_eligibility_decision_id),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_public_eligibility_scope
  ON report_public_eligibility_decisions (tenant_id, organization_id, report_id, report_version, decided_at DESC);

-- ---------------------------------------------------------------------
-- Migration 017 — report_public_disclosure_decisions
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS report_public_disclosure_decisions (
  public_disclosure_decision_id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  public_eligibility_decision_id TEXT NOT NULL REFERENCES report_public_eligibility_decisions(public_eligibility_decision_id),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  decision TEXT NOT NULL CHECK (decision IN ('PUBLIC_DISCLOSURE_APPROVED', 'PUBLIC_DISCLOSURE_BLOCKED')),
  privacy_policy_reference TEXT NOT NULL,
  privacy_policy_version TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  reviewed_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  supersedes_decision_id TEXT REFERENCES report_public_disclosure_decisions(public_disclosure_decision_id),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_public_disclosure_scope
  ON report_public_disclosure_decisions (tenant_id, organization_id, report_id, report_version, reviewed_at DESC);

-- ---------------------------------------------------------------------
-- Migration 018 — report_public_disclosure_policies
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS report_public_disclosure_policies (
  policy_id TEXT PRIMARY KEY,
  policy_key TEXT NOT NULL,
  policy_version INTEGER NOT NULL CHECK (policy_version > 0),
  report_id TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'RETIRED')),
  policy_type TEXT NOT NULL,
  policy_definition JSONB NOT NULL,
  effective_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  approved_by_user_id TEXT REFERENCES users(user_id),
  approved_at TIMESTAMPTZ,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (tenant_id, organization_id, policy_key, policy_version),
  CHECK (jsonb_typeof(policy_definition) = 'object'),
  CHECK ((status = 'APPROVED' AND approved_by_user_id IS NOT NULL AND approved_at IS NOT NULL) OR status <> 'APPROVED'),
  CHECK ((status = 'RETIRED' AND retired_at IS NOT NULL) OR status <> 'RETIRED')
);

CREATE INDEX IF NOT EXISTS idx_report_public_disclosure_policies_scope
  ON report_public_disclosure_policies (tenant_id, organization_id, report_id, report_version, status);

-- ---------------------------------------------------------------------
-- Migration 019 — policy schema completion, report_public_disclosure_policy_signoffs
-- ---------------------------------------------------------------------

ALTER TABLE report_public_disclosure_policies
  ADD COLUMN IF NOT EXISTS institutional_signoff_required BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS report_public_disclosure_policy_signoffs (
  signoff_record_id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL REFERENCES report_public_disclosure_policies(policy_id),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  signoff_type TEXT NOT NULL CHECK (signoff_type IN ('PRIVACY_DATA_GOVERNANCE', 'LEGAL_PRIVACY_REVIEW', 'EXECUTIVE_APPROVAL')),
  authority_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  recorded_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((status = 'PENDING' AND decided_at IS NULL) OR (status <> 'PENDING' AND decided_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_public_disclosure_policy_signoffs_scope
  ON report_public_disclosure_policy_signoffs (tenant_id, organization_id, policy_id, status);

-- ---------------------------------------------------------------------
-- Migration 020 — policy signoff hardening (current condition, guarded)
-- ---------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'report_public_disclosure_policy_signoffs_signoff_type_check'
  ) THEN
    ALTER TABLE report_public_disclosure_policy_signoffs
      ADD CONSTRAINT report_public_disclosure_policy_signoffs_signoff_type_check
      CHECK (signoff_type IN ('PRIVACY_DATA_GOVERNANCE', 'LEGAL_PRIVACY_REVIEW', 'EXECUTIVE_APPROVAL'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_public_disclosure_policy_signoff_type
  ON report_public_disclosure_policy_signoffs (policy_id, signoff_type)
  WHERE status <> 'REJECTED';

-- ---------------------------------------------------------------------
-- Migration 021 — disclosure decision review context (current condition, guarded)
-- ---------------------------------------------------------------------

ALTER TABLE report_public_disclosure_decisions
  ADD COLUMN IF NOT EXISTS review_context JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'report_public_disclosure_decisions_review_context_check'
  ) THEN
    ALTER TABLE report_public_disclosure_decisions
      ADD CONSTRAINT report_public_disclosure_decisions_review_context_check
      CHECK (review_context IS NULL OR jsonb_typeof(review_context) = 'object');
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- Migration 022 — report_public_snapshots
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS report_public_snapshots (
  public_snapshot_id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  source_result_reference TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  public_eligibility_decision_id TEXT NOT NULL REFERENCES report_public_eligibility_decisions(public_eligibility_decision_id),
  public_disclosure_decision_id TEXT NOT NULL REFERENCES report_public_disclosure_decisions(public_disclosure_decision_id),
  disclosure_policy_reference TEXT NOT NULL,
  disclosure_policy_version TEXT NOT NULL,
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  reporting_period TEXT NOT NULL CHECK (reporting_period IN ('QUARTERLY', 'ANNUAL')),
  reporting_period_label TEXT NOT NULL,
  data_as_of TIMESTAMPTZ NOT NULL,
  geography_level TEXT NOT NULL CHECK (geography_level IN ('COUNTY', 'STATE', 'ORGANIZATION_WIDE')),
  program_granularity TEXT NOT NULL CHECK (program_granularity IN ('FOUNDATION_WIDE', 'NAMED_PROGRAM')),
  public_representation_type TEXT NOT NULL CHECK (public_representation_type IN ('EXACT_COUNT', 'SUPPRESSED_LT_10')),
  public_display_value TEXT NOT NULL,
  suppression_state TEXT NOT NULL CHECK (suppression_state IN ('NONE', 'SUPPRESSED_LT_10')),
  snapshot_hash TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  idempotency_key TEXT NOT NULL,
  UNIQUE (tenant_id, organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_report_public_snapshots_scope
  ON report_public_snapshots (tenant_id, organization_id, report_id, report_version, created_at DESC);

-- ---------------------------------------------------------------------
-- Migration 023 — snapshot population attestation
-- ---------------------------------------------------------------------

ALTER TABLE report_public_snapshots
  ADD COLUMN IF NOT EXISTS public_population_eligible BOOLEAN NOT NULL DEFAULT FALSE;

-- ---------------------------------------------------------------------
-- Migration 024 — report_publication_authorities, release approvals, authorizations
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS report_publication_authorities (
  authority_id TEXT PRIMARY KEY,
  authority_type TEXT NOT NULL CHECK (authority_type IN ('SHF_EXECUTIVE_AUTHORITY', 'PUBLIC_REPORTING_RELEASE_AUTHORITY')),
  parent_authority_id TEXT REFERENCES report_publication_authorities(authority_id),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  authority_reference TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
  effective_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  recorded_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS report_publication_release_approvals (
  release_approval_id TEXT PRIMARY KEY,
  public_snapshot_id TEXT NOT NULL REFERENCES report_public_snapshots(public_snapshot_id),
  snapshot_version INTEGER NOT NULL CHECK (snapshot_version > 0),
  snapshot_hash TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  authority_id TEXT NOT NULL REFERENCES report_publication_authorities(authority_id),
  approval_category TEXT NOT NULL CHECK (approval_category = 'PUBLIC_REPORTING_RELEASE_APPROVAL'),
  status TEXT NOT NULL CHECK (status IN ('APPROVED', 'REVOKED')),
  approved_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_report_publication_release_approval_scope
  ON report_publication_release_approvals (tenant_id, organization_id, public_snapshot_id, approved_at DESC);

CREATE TABLE IF NOT EXISTS report_publication_authorizations (
  publication_authorization_id TEXT PRIMARY KEY,
  public_snapshot_id TEXT NOT NULL REFERENCES report_public_snapshots(public_snapshot_id),
  snapshot_version INTEGER NOT NULL CHECK (snapshot_version > 0),
  snapshot_hash TEXT NOT NULL,
  report_id TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  public_eligibility_decision_id TEXT NOT NULL REFERENCES report_public_eligibility_decisions(public_eligibility_decision_id),
  public_disclosure_decision_id TEXT NOT NULL REFERENCES report_public_disclosure_decisions(public_disclosure_decision_id),
  disclosure_policy_reference TEXT NOT NULL,
  disclosure_policy_version TEXT NOT NULL,
  institutional_authority_reference TEXT NOT NULL,
  release_approval_reference TEXT NOT NULL REFERENCES report_publication_release_approvals(release_approval_id),
  status TEXT NOT NULL CHECK (status IN ('PUBLICATION_AUTHORIZED', 'PUBLICATION_REVOKED')),
  authorized_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purpose_reference TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (tenant_id, organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_report_publication_authorization_scope
  ON report_publication_authorizations (tenant_id, organization_id, public_snapshot_id, authorized_at DESC);

-- ---------------------------------------------------------------------
-- Migration 025 — report_publications, shf_public_impact_projections
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS report_publications (
  publication_id TEXT PRIMARY KEY,
  publication_authorization_id TEXT NOT NULL REFERENCES report_publication_authorizations(publication_authorization_id),
  public_snapshot_id TEXT NOT NULL REFERENCES report_public_snapshots(public_snapshot_id),
  snapshot_version INTEGER NOT NULL CHECK (snapshot_version > 0),
  snapshot_hash TEXT NOT NULL CHECK (snapshot_hash ~ '^[0-9a-f]{64}$'),
  report_id TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  publication_status TEXT NOT NULL CHECK (publication_status = 'PUBLISHED'),
  published_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  projection_reference TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (tenant_id, organization_id, idempotency_key),
  UNIQUE (tenant_id, organization_id, public_snapshot_id)
);

CREATE TABLE IF NOT EXISTS shf_public_impact_projections (
  projection_id TEXT PRIMARY KEY,
  publication_id TEXT NOT NULL REFERENCES report_publications(publication_id),
  public_snapshot_id TEXT NOT NULL REFERENCES report_public_snapshots(public_snapshot_id),
  snapshot_version INTEGER NOT NULL CHECK (snapshot_version > 0),
  snapshot_hash TEXT NOT NULL CHECK (snapshot_hash ~ '^[0-9a-f]{64}$'),
  report_id TEXT NOT NULL CHECK (report_id = 'report.curriculum.lesson_completion_count.v1'),
  report_version INTEGER NOT NULL CHECK (report_version = 1),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  metric_label TEXT NOT NULL CHECK (metric_label = 'Verified Lesson Completions'),
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  reporting_period TEXT NOT NULL CHECK (reporting_period IN ('QUARTERLY', 'ANNUAL')),
  reporting_period_label TEXT NOT NULL,
  data_as_of TIMESTAMPTZ NOT NULL,
  geography_level TEXT NOT NULL CHECK (geography_level IN ('COUNTY', 'STATE', 'ORGANIZATION_WIDE')),
  program_granularity TEXT NOT NULL CHECK (program_granularity IN ('FOUNDATION_WIDE', 'NAMED_PROGRAM')),
  public_representation_type TEXT NOT NULL CHECK (public_representation_type IN ('EXACT_COUNT', 'SUPPRESSED_LT_10')),
  public_display_value TEXT NOT NULL,
  suppression_state TEXT NOT NULL CHECK (suppression_state IN ('NONE', 'SUPPRESSED_LT_10')),
  source_type TEXT NOT NULL DEFAULT 'CANONICAL_PUBLICATION' CHECK (source_type = 'CANONICAL_PUBLICATION'),
  projection_status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (projection_status = 'PUBLISHED'),
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (tenant_id, organization_id, public_snapshot_id),
  UNIQUE (publication_id)
);

CREATE INDEX IF NOT EXISTS idx_report_publications_scope
  ON report_publications (tenant_id, organization_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_shf_public_impact_projections_public
  ON shf_public_impact_projections (report_id, report_version, projection_status, published_at DESC);

-- ---------------------------------------------------------------------
-- Migration 026 — generic public governance registration checks (current condition, guarded)
-- ---------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shf_public_impact_projections_report_id_check') THEN
    ALTER TABLE shf_public_impact_projections
      ADD CONSTRAINT shf_public_impact_projections_report_id_check
      CHECK (length(report_id) > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shf_public_impact_projections_report_version_check') THEN
    ALTER TABLE shf_public_impact_projections
      ADD CONSTRAINT shf_public_impact_projections_report_version_check
      CHECK (report_version > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shf_public_impact_projections_metric_label_check') THEN
    ALTER TABLE shf_public_impact_projections
      ADD CONSTRAINT shf_public_impact_projections_metric_label_check
      CHECK (length(metric_label) > 0);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- Migration 028 — identity_provider_links, shs_identity_sessions
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS identity_provider_links (
  identity_link_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  internal_identity_id TEXT NOT NULL REFERENCES users(user_id),
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_authenticated_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (provider, provider_subject)
);

CREATE INDEX IF NOT EXISTS idx_identity_provider_links_identity
  ON identity_provider_links(internal_identity_id);

CREATE TABLE IF NOT EXISTS shs_identity_sessions (
  session_id TEXT PRIMARY KEY,
  session_token_hash TEXT NOT NULL UNIQUE,
  internal_identity_id TEXT NOT NULL REFERENCES users(user_id),
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_shs_identity_sessions_active
  ON shs_identity_sessions(session_token_hash, expires_at)
  WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------
-- Migration 029 — integration_outbox worker hardening (table already
-- exists in shs_dev; only the added columns/index/constraint are missing)
-- ---------------------------------------------------------------------

ALTER TABLE integration_outbox
  ADD COLUMN IF NOT EXISTS lease_owner TEXT,
  ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lease_reclaimed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS failure_classification TEXT,
  ADD COLUMN IF NOT EXISTS quarantined_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'integration_outbox_delivery_status_check') THEN
    ALTER TABLE integration_outbox
      ADD CONSTRAINT integration_outbox_delivery_status_check
      CHECK (delivery_status IN ('PENDING','DELIVERING','DELIVERED','RETRYABLE','FAILED_FINAL','QUARANTINED'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS integration_outbox_lease_idx
  ON integration_outbox (delivery_status, lease_expires_at, created_at);

CREATE INDEX IF NOT EXISTS integration_outbox_backlog_idx
  ON integration_outbox (delivery_status, next_attempt_at, created_at)
  WHERE delivery_status IN ('PENDING', 'RETRYABLE');

-- ---------------------------------------------------------------------
-- Migration 034 — Prepare/Prove evidence & competency foundation
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prepare_prove_activity_results (
  result_id TEXT PRIMARY KEY,
  activity_type TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  result_status TEXT NOT NULL CHECK (result_status IN ('SUCCEEDED','INCOMPLETE','FAILED')),
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id, activity_type, activity_id)
);

CREATE TABLE IF NOT EXISTS prepare_prove_evidence (
  evidence_id TEXT PRIMARY KEY,
  source_domain TEXT NOT NULL,
  source_record_id TEXT NOT NULL REFERENCES prepare_prove_activity_results(result_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  criterion TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CANDIDATE','REVIEWABLE','REVIEWED','INSUFFICIENT')),
  provenance_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, source_domain, source_record_id, criterion)
);

CREATE TABLE IF NOT EXISTS competency_definitions (
  competency_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  criteria_json JSONB NOT NULL,
  evidence_requirements_json JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','PLANNED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learner_competency_decisions (
  decision_id TEXT PRIMARY KEY,
  competency_id TEXT NOT NULL REFERENCES competency_definitions(competency_id),
  evidence_id TEXT NOT NULL REFERENCES prepare_prove_evidence(evidence_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('EVIDENCE_INSUFFICIENT','DEMONSTRATED','NEEDS_REVIEW')),
  criteria_version INTEGER NOT NULL CHECK (criteria_version > 0),
  reviewer_user_id TEXT NOT NULL REFERENCES users(user_id),
  reviewer_authority TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provenance_json JSONB NOT NULL,
  UNIQUE (organization_id, competency_id, evidence_id, criteria_version)
);

CREATE INDEX IF NOT EXISTS prepare_prove_evidence_scope_idx
  ON prepare_prove_evidence (tenant_id, organization_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS learner_competency_decisions_scope_idx
  ON learner_competency_decisions (tenant_id, organization_id, user_id, reviewed_at DESC);

-- Required canonical reference data — the same single "architecture proof"
-- competency definition migration 034 itself always required, replayed
-- verbatim (idempotent ON CONFLICT DO NOTHING). Not demo/fake data: this
-- is the real record PrepareProveService.getProofDefinition() depends on
-- (confirmed by the live crash this repair fixes).
INSERT INTO competency_definitions
  (competency_id, slug, title, description, domain, version, criteria_json, evidence_requirements_json, status)
VALUES
  ('competency_prepare_prove_monitoring_finding',
   'interpret-monitoring-data-and-document-safe-finding',
   'Interpret monitoring data and document a safe technical finding',
   'Interpret synthetic infrastructure observations, distinguish evidence from assumptions, identify an affected system, and recommend a safe escalation or next step.',
   'data-center-technical-operations',
   1,
   '{"criteria":["records observations accurately","identifies a plausible affected system","separates evidence from uncertainty","recommends a safe next step"]}',
   '{"source_activity_type":"SIMULATED_INFRASTRUCTURE_MONITORING","review_required":true}',
   'ACTIVE')
ON CONFLICT (slug) DO NOTHING;
