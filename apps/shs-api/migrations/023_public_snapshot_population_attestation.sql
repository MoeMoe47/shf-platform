-- Preserve the server-validated public Truth population prerequisite on the
-- snapshot without copying Truth or participant data.
ALTER TABLE report_public_snapshots
  ADD COLUMN IF NOT EXISTS public_population_eligible BOOLEAN NOT NULL DEFAULT FALSE;
