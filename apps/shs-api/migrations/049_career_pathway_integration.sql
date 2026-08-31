-- SHF Ecosystem Phase 5 — canonical Program → Career pathway relationship,
-- plus optional Career/Career Family relevance metadata on Career Events
-- and Opportunities.
--
-- Audit findings that shaped this design (see
-- docs/SHF_CAREER_PATHWAY_INTEGRATION.md for full detail):
--
-- - `careers`/`career_families` (migration 033) are GLOBAL reference data
--   (no organization_id column, no org-scoped query anywhere in
--   CareerRepo). `programs` (migration 002, stewardship columns added in
--   032) is organization-scoped. This relationship therefore connects an
--   org-owned Program to global Career reference data — Career rows are
--   never given fake organization ownership.
-- - No existing Program → Career reference exists anywhere in the
--   repository (confirmed by repo-wide search for career_id/
--   career_family_id outside the careers domain itself).
-- - `program_specialization_assignments.specialization_id` is a free-text
--   column with no FK to `careers` and no enumerated vocabulary shared
--   with it — a real but informal, pre-Career-taxonomy concept. Left
--   entirely alone this phase (see docs — deferred, not wired, per the
--   phase brief's own "if not enough evidence exists: defer").
-- - `shs_dev`'s `programs` table has zero rows today. No existing Program
--   rows are backfilled with a Career mapping — none can be determined
--   deterministically, and guessing from name similarity is explicitly
--   forbidden. Associations start empty; admins create them explicitly
--   going forward through the new API.
--
-- A join table (not a single career_id column on `programs`) was chosen
-- because a Program may legitimately support multiple Careers (the phase
-- brief's own preferred shape, option C: Program supports multiple
-- Careers, Career Family derives from Career rather than being
-- duplicated on every row).

CREATE TABLE IF NOT EXISTS program_careers (
  program_career_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  program_id TEXT NOT NULL,
  career_id TEXT NOT NULL REFERENCES careers(career_id),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, program_id, career_id),
  CONSTRAINT program_careers_program_same_org_fk
    FOREIGN KEY (organization_id, program_id) REFERENCES programs(organization_id, program_id)
);

CREATE INDEX IF NOT EXISTS program_careers_program_idx
  ON program_careers (organization_id, program_id);

CREATE INDEX IF NOT EXISTS program_careers_career_idx
  ON program_careers (career_id);

-- Optional relevance metadata — category, never entitlement. At most one
-- of career_id/career_family_id may be set (Career Family derives from
-- Career when a specific Career is linked, per the same "don't duplicate
-- truth" principle as program_careers above); both may be NULL for a
-- general/unlinked event or opportunity.

ALTER TABLE career_events
  ADD COLUMN IF NOT EXISTS career_id TEXT REFERENCES careers(career_id),
  ADD COLUMN IF NOT EXISTS career_family_id TEXT REFERENCES career_families(career_family_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'career_events_career_relevance_shape_check') THEN
    ALTER TABLE career_events
      ADD CONSTRAINT career_events_career_relevance_shape_check
      CHECK (NOT (career_id IS NOT NULL AND career_family_id IS NOT NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS career_events_career_idx ON career_events (career_id);
CREATE INDEX IF NOT EXISTS career_events_career_family_idx ON career_events (career_family_id);

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS career_id TEXT REFERENCES careers(career_id),
  ADD COLUMN IF NOT EXISTS career_family_id TEXT REFERENCES career_families(career_family_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_career_relevance_shape_check') THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT opportunities_career_relevance_shape_check
      CHECK (NOT (career_id IS NOT NULL AND career_family_id IS NOT NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS opportunities_career_idx ON opportunities (career_id);
CREATE INDEX IF NOT EXISTS opportunities_career_family_idx ON opportunities (career_family_id);
