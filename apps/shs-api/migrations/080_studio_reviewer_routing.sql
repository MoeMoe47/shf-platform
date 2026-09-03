-- Phase 9: reviewer routing is assignment authority, not Review decision authority.
CREATE TABLE IF NOT EXISTS studio_review_assignments (
  review_assignment_id TEXT PRIMARY KEY,
  review_submission_id TEXT NOT NULL REFERENCES studio_review_submissions(review_submission_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  reviewer_user_id TEXT NOT NULL REFERENCES users(user_id),
  status TEXT NOT NULL CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED', 'CANCELLED')),
  routing_policy_key TEXT NOT NULL CHECK (routing_policy_key IN ('LEAST_ACTIVE_LOAD')),
  assignment_reason TEXT NOT NULL DEFAULT 'Lowest active review load.',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  reassigned_from_id TEXT REFERENCES studio_review_assignments(review_assignment_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT studio_review_assignment_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS studio_review_assignment_one_active_idx
  ON studio_review_assignments (review_submission_id)
  WHERE status IN ('ASSIGNED', 'IN_PROGRESS');
CREATE INDEX IF NOT EXISTS studio_review_assignment_reviewer_queue_idx
  ON studio_review_assignments (organization_id, tenant_id, reviewer_user_id, status, assigned_at DESC);
CREATE INDEX IF NOT EXISTS studio_review_assignment_submission_history_idx
  ON studio_review_assignments (organization_id, tenant_id, review_submission_id, created_at DESC);
