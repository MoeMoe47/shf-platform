-- SHF Database Phase 4.1 — reconcile shs_dev baseline ledger rows for
-- migrations 030, 032, and 033 with missing physical schema.
--
-- All three are recorded in shs_dev's schema_migrations ledger with
-- runner_version 'baseline-1' and execution_duration_ms 0 — the same
-- baseline-ledger fingerprint already repaired for migration 031 (in
-- 045_reconcile_curriculum_lesson_completions.sql) and migrations 035-038
-- (in 042_reconcile_missing_035_038_schema.sql). A baseline row records
-- that a migration is considered applied without running its SQL, so
-- none of these three ever physically executed in shs_dev.
--
-- This was discovered to be a LIVE, crash-inducing defect, not a
-- theoretical one: GET /programs currently crashes the running API
-- process in shs_dev with `error: column "program_classification" does
-- not exist` (migration 032), and GET /careers / GET /organization-
-- relationships both return 500 (migrations 033 / 032). Rate limiting
-- (migration 030) is currently masked in non-production environments by
-- an in-memory fallback (src/security/rate-limit.ts), but would throw
-- `rate_limit_backend_unavailable` in production mode against this
-- database.
--
-- This repair is additive only and replays each migration's exact
-- current canonical shape (verified unchanged against all current
-- backend code: ProgramRepo, OrganizationRelationshipRepo, CareerRepo).
-- It is a no-op on any database where these migrations already ran for
-- real (fresh databases, or shs_dev after this repair), because every
-- statement is already guarded (IF NOT EXISTS / conditional DO blocks /
-- ON CONFLICT), matching each migration's own original SQL.

-- ---------------------------------------------------------------------
-- Migration 030 — rate_limit_windows
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rate_limit_windows (
  limiter_key TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  window_seconds INTEGER NOT NULL CHECK (window_seconds > 0),
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (limiter_key, window_started_at)
);

CREATE INDEX IF NOT EXISTS rate_limit_windows_expiry_idx
  ON rate_limit_windows (expires_at);

-- ---------------------------------------------------------------------
-- Migration 032 — organization_relationships + program stewardship
-- ---------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS organization_relationships (
  relationship_id TEXT PRIMARY KEY,
  source_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  target_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  relationship_type TEXT NOT NULL,
  status TEXT NOT NULL,
  effective_from TIMESTAMP NOT NULL,
  effective_to TIMESTAMP,
  created_by TEXT REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by TEXT REFERENCES users(user_id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT organization_relationship_known_type CHECK (
    relationship_type IN ('INCUBATES', 'NETWORK_MEMBER_OF', 'OPERATES_FOR', 'SHARED_SERVICES_PROVIDER_FOR')
  ),
  CONSTRAINT organization_relationship_known_status CHECK (
    status IN ('PROPOSED', 'ACTIVE', 'SUSPENDED', 'ENDED')
  ),
  CONSTRAINT organization_relationship_effective_range CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  )
);

CREATE INDEX IF NOT EXISTS idx_organization_relationships_source
  ON organization_relationships(source_organization_id, relationship_type, status);

CREATE INDEX IF NOT EXISTS idx_organization_relationships_target
  ON organization_relationships(target_organization_id, relationship_type, status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM organization_relationships a
    JOIN organization_relationships b
      ON a.relationship_id < b.relationship_id
     AND a.source_organization_id = b.source_organization_id
     AND a.target_organization_id = b.target_organization_id
     AND a.relationship_type = b.relationship_type
     AND a.status = 'ACTIVE'
     AND b.status = 'ACTIVE'
     AND tsrange(a.effective_from, COALESCE(a.effective_to, 'infinity'::timestamp), '[]') &&
         tsrange(b.effective_from, COALESCE(b.effective_to, 'infinity'::timestamp), '[]')
  ) THEN
    RAISE EXCEPTION 'overlapping active organization relationships must be resolved before migration 047 can complete';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organization_relationship_no_active_overlap'
  ) THEN
    ALTER TABLE organization_relationships
      ADD CONSTRAINT organization_relationship_no_active_overlap
      EXCLUDE USING gist (
        source_organization_id WITH =,
        target_organization_id WITH =,
        relationship_type WITH =,
        tsrange(effective_from, COALESCE(effective_to, 'infinity'::timestamp), '[]') WITH &&
      )
      WHERE (status = 'ACTIVE');
  END IF;
END $$;

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS program_classification TEXT,
  ADD COLUMN IF NOT EXISTS owner_organization_id TEXT REFERENCES organizations(organization_id),
  ADD COLUMN IF NOT EXISTS operator_organization_id TEXT REFERENCES organizations(organization_id),
  ADD COLUMN IF NOT EXISTS accountable_organization_id TEXT REFERENCES organizations(organization_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'programs_known_classification'
  ) THEN
    ALTER TABLE programs
      ADD CONSTRAINT programs_known_classification CHECK (
        program_classification IS NULL OR program_classification IN ('SHF_OWNED', 'SHF_INCUBATED', 'INDEPENDENT_NETWORK')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_programs_owner_organization
  ON programs(owner_organization_id);

CREATE INDEX IF NOT EXISTS idx_programs_operator_organization
  ON programs(operator_organization_id);

CREATE INDEX IF NOT EXISTS idx_programs_accountable_organization
  ON programs(accountable_organization_id);

INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT permission_id, role_id, permission_name
FROM (
  VALUES
    ('rp_phase2_org_relationship_view_org_admin', 'role_org_admin', 'organization.relationship.view'),
    ('rp_phase2_org_relationship_manage_org_admin', 'role_org_admin', 'organization.relationship.manage')
) AS requested(permission_id, role_id, permission_name)
WHERE EXISTS (SELECT 1 FROM roles WHERE roles.role_id = requested.role_id)
ON CONFLICT (role_permission_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Migration 033 — career_families / careers / career_curriculum_requirements
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS career_families (
  career_family_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS careers (
  career_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  career_family_id TEXT NOT NULL REFERENCES career_families(career_family_id),
  sector TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS careers_active_family_idx
  ON careers(career_family_id, status, title);

CREATE TABLE IF NOT EXISTS career_curriculum_requirements (
  career_curriculum_requirement_id TEXT PRIMARY KEY,
  career_id TEXT NOT NULL REFERENCES careers(career_id),
  curriculum_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  requirement_type TEXT NOT NULL
    CHECK (requirement_type IN ('required', 'recommended')),
  min_grade INTEGER,
  max_grade INTEGER,
  developmental_stage TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (min_grade IS NULL OR min_grade BETWEEN 6 AND 12),
  CHECK (max_grade IS NULL OR max_grade BETWEEN 6 AND 12),
  CHECK (min_grade IS NULL OR max_grade IS NULL OR min_grade <= max_grade),
  CHECK (developmental_stage IS NULL OR developmental_stage IN ('DISCOVER', 'EXPLORE', 'PREPARE_PROVE', 'TRANSITION', 'ADULT_ACCELERATED')),
  UNIQUE (career_id, curriculum_id, lesson_id, requirement_type)
);

CREATE INDEX IF NOT EXISTS career_curriculum_requirements_lookup_idx
  ON career_curriculum_requirements(career_id, requirement_type, min_grade, max_grade);

-- Minimal architecture proof record, reconciled verbatim from migration
-- 033 (idempotent ON CONFLICT DO UPDATE — safe whether or not it already
-- exists). Required by tests/career-phase3-postgres-runtime.test.ts and
-- CareerRepo.getBySlug("data-center-technician").
INSERT INTO career_families (career_family_id, slug, name, status)
VALUES ('career_family_data_center_ai_infrastructure', 'data-center-ai-infrastructure', 'Data Center & AI Infrastructure', 'active')
ON CONFLICT (career_family_id) DO UPDATE
SET slug = EXCLUDED.slug, name = EXCLUDED.name, status = EXCLUDED.status, updated_at = NOW();

INSERT INTO careers (career_id, slug, title, description, status, career_family_id, sector)
VALUES (
  'career_data_center_technician',
  'data-center-technician',
  'Data Center Technician',
  'Foundational operations role supporting data-center hardware, systems, and facilities workflows.',
  'active',
  'career_family_data_center_ai_infrastructure',
  'Infrastructure'
)
ON CONFLICT (career_id) DO UPDATE
SET slug = EXCLUDED.slug, title = EXCLUDED.title, description = EXCLUDED.description,
    status = EXCLUDED.status, career_family_id = EXCLUDED.career_family_id,
    sector = EXCLUDED.sector, updated_at = NOW();

INSERT INTO career_curriculum_requirements (
  career_curriculum_requirement_id, career_id, curriculum_id, lesson_id,
  requirement_type, min_grade, max_grade, developmental_stage
)
VALUES (
  'ccr_data_center_technician_foundations_discover',
  'career_data_center_technician',
  'data-center-foundations',
  'data-center-foundations-introduction',
  'recommended', 6, 8, 'DISCOVER'
)
ON CONFLICT (career_curriculum_requirement_id) DO UPDATE
SET career_id = EXCLUDED.career_id, curriculum_id = EXCLUDED.curriculum_id,
    lesson_id = EXCLUDED.lesson_id, requirement_type = EXCLUDED.requirement_type,
    min_grade = EXCLUDED.min_grade, max_grade = EXCLUDED.max_grade,
    developmental_stage = EXCLUDED.developmental_stage, updated_at = NOW();
