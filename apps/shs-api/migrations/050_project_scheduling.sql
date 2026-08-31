-- SHF Ecosystem Phase 6 — canonical Project scheduling fields.
--
-- Adds the minimum date fields the real Project workflow needs to project
-- into the Calendar: when work becomes available, when it's due, and
-- (Capstone in particular) when the presentation/demo occurs. Capstone is
-- not a separate engine — it is projects.project_type = 'CAPSTONE'
-- (project_type has always been free TEXT with no CHECK constraint, so
-- this needs no schema change of its own).
--
-- Deliberately NOT added: a completed_at column. Project completion truth
-- lives in project_submissions.status ('ACCEPTED'); a date column here
-- would invite conflating "due date passed" with "completed", which the
-- phase brief explicitly forbids.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS presentation_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_schedule_date_order'
  ) THEN
    ALTER TABLE projects
      ADD CONSTRAINT projects_schedule_date_order
      CHECK (
        (due_at IS NULL OR starts_at IS NULL OR due_at >= starts_at)
        AND (presentation_at IS NULL OR due_at IS NULL OR presentation_at >= due_at)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS project_due_at_idx ON projects (organization_id, due_at) WHERE due_at IS NOT NULL;
