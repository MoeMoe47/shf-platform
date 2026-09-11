-- SYS-3A3: extend the canonical report draft lifecycle without creating a
-- second report authority. Existing revisions remain the immutable history.
ALTER TABLE report_drafts
  DROP CONSTRAINT IF EXISTS report_drafts_lifecycle_status_check;

ALTER TABLE report_drafts
  ADD COLUMN IF NOT EXISTS review_decision TEXT,
  ADD COLUMN IF NOT EXISTS review_rationale TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by_user_id TEXT REFERENCES users(user_id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE report_drafts
  ADD CONSTRAINT report_drafts_lifecycle_status_check
  CHECK (lifecycle_status IN ('draft', 'ready_for_review', 'approved', 'rejected', 'archived'));

CREATE INDEX IF NOT EXISTS idx_report_drafts_review_queue
  ON report_drafts (tenant_id, organization_id, lifecycle_status, updated_at DESC);
