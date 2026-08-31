-- SHF Learning Ecosystem Phase 3 — canonical Live Learning audience scope.
-- Existing NULL cohort_id sessions were already organization-scoped by the
-- service/API; make that explicit while retaining nullable cohort_id for
-- legitimate non-cohort sessions. Future cohort-scoped sessions are tied to
-- canonical cohorts by same-organization FK.

ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS audience_scope TEXT NOT NULL DEFAULT 'ORGANIZATION';

UPDATE live_sessions
SET audience_scope = 'COHORT'
WHERE cohort_id IS NOT NULL;

ALTER TABLE live_sessions
  ADD CONSTRAINT live_sessions_audience_scope_check
    CHECK (audience_scope IN ('ORGANIZATION', 'COHORT')),
  ADD CONSTRAINT live_sessions_audience_scope_cohort_check
    CHECK (
      (audience_scope = 'ORGANIZATION' AND cohort_id IS NULL)
      OR (audience_scope = 'COHORT' AND cohort_id IS NOT NULL)
    ),
  ADD CONSTRAINT live_sessions_cohort_same_org_fk
    FOREIGN KEY (organization_id, cohort_id) REFERENCES cohorts(organization_id, cohort_id);

CREATE INDEX IF NOT EXISTS idx_live_sessions_audience_scope
  ON live_sessions(organization_id, audience_scope, cohort_id);
