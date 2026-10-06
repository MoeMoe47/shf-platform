-- 4F: candidate-scoped, expiring reviewer authorization layered on Identity.
-- Identity remains authoritative for users, memberships, roles and capabilities.

CREATE TABLE IF NOT EXISTS commercial_product_reviewer_assignments (
  assignment_id TEXT PRIMARY KEY,
  reviewer_actor_id TEXT NOT NULL REFERENCES users(user_id),
  reviewer_org_id TEXT NOT NULL REFERENCES organizations(organization_id),
  candidate_id TEXT NOT NULL CHECK (candidate_id ~ '^cc-[0-9]{3}$'),
  commercial_product_id TEXT NOT NULL CHECK (commercial_product_id LIKE 'cp_%'),
  effective_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  assignment_status TEXT NOT NULL DEFAULT 'ACTIVE',
  assigned_by_actor_id TEXT NOT NULL REFERENCES users(user_id),
  assignment_authority_reference TEXT NOT NULL,
  reason TEXT NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by_actor_id TEXT REFERENCES users(user_id),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_reviewer_assignment_window CHECK (expires_at > effective_at),
  CONSTRAINT commercial_product_reviewer_assignment_status CHECK (assignment_status IN ('ACTIVE','REVOKED','EXPIRED','SUSPENDED')),
  CONSTRAINT commercial_product_reviewer_assignment_revocation CHECK (
    (assignment_status = 'REVOKED' AND revoked_at IS NOT NULL AND revoked_by_actor_id IS NOT NULL)
    OR (assignment_status <> 'REVOKED' AND revoked_at IS NULL AND revoked_by_actor_id IS NULL)
  ),
  CONSTRAINT commercial_product_reviewer_assignment_not_self CHECK (assigned_by_actor_id <> reviewer_actor_id)
);

CREATE TABLE IF NOT EXISTS commercial_product_reviewer_assignment_gates (
  assignment_id TEXT NOT NULL REFERENCES commercial_product_reviewer_assignments(assignment_id),
  gate_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (assignment_id, gate_type),
  CONSTRAINT commercial_product_reviewer_assignment_gate_known CHECK (
    gate_type IN ('COMMERCIAL_READINESS','LEGAL','TAX','REGULATORY','PROCUREMENT','FUNDING','DELIVERY_CAPACITY','EVIDENCE','SUPPORT','PRICING','MARGIN','ENTITLEMENT','PARTNER','COMMISSION','SOURCE_AUTHORITY')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS commercial_product_reviewer_assignment_active_identity_uq
  ON commercial_product_reviewer_assignments(reviewer_actor_id, reviewer_org_id, candidate_id)
  WHERE assignment_status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS commercial_product_reviewer_assignment_reviewer_idx
  ON commercial_product_reviewer_assignments(reviewer_actor_id, reviewer_org_id, assignment_status, expires_at);

CREATE INDEX IF NOT EXISTS commercial_product_reviewer_assignment_candidate_idx
  ON commercial_product_reviewer_assignments(reviewer_org_id, candidate_id, assignment_status, effective_at, expires_at);

CREATE INDEX IF NOT EXISTS commercial_product_reviewer_assignment_expiry_idx
  ON commercial_product_reviewer_assignments(expires_at, assignment_status);

CREATE INDEX IF NOT EXISTS commercial_product_reviewer_assignment_gate_idx
  ON commercial_product_reviewer_assignment_gates(gate_type, assignment_id);

ALTER TABLE commercial_product_review_decisions
  ADD COLUMN IF NOT EXISTS review_assignment_id TEXT REFERENCES commercial_product_reviewer_assignments(assignment_id);

ALTER TABLE commercial_product_source_resolutions
  ADD COLUMN IF NOT EXISTS review_assignment_id TEXT REFERENCES commercial_product_reviewer_assignments(assignment_id);

CREATE INDEX IF NOT EXISTS commercial_product_review_decisions_assignment_idx
  ON commercial_product_review_decisions(review_assignment_id, reviewed_at DESC)
  WHERE review_assignment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS commercial_product_source_resolutions_assignment_idx
  ON commercial_product_source_resolutions(review_assignment_id, resolved_at DESC)
  WHERE review_assignment_id IS NOT NULL;
