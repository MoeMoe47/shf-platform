-- Phase 5: explicit publication boundary for the canonical Opportunities table.
-- OPEN is an authenticated lifecycle state, not public authorization.
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS public_visibility TEXT NOT NULL DEFAULT 'PRIVATE';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_public_visibility_check') THEN
    ALTER TABLE opportunities ADD CONSTRAINT opportunities_public_visibility_check
      CHECK (public_visibility IN ('PRIVATE', 'PUBLIC'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS opportunities_public_catalog_idx
  ON opportunities (public_visibility, status, application_deadline);
