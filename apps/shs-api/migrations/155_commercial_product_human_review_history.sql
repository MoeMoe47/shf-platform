-- SHU Commercial Product Registry 4C: immutable human review/source-resolution history.
-- Candidate identities reference the reviewed 4B manifest until an explicit
-- onboarding decision creates canonical product rows. No candidate/product seed.

CREATE TABLE IF NOT EXISTS commercial_product_review_decisions (
  review_decision_id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL CHECK (candidate_id ~ '^cc-[0-9]{3}$'),
  commercial_product_id TEXT NOT NULL CHECK (commercial_product_id LIKE 'cp_%'),
  gate_type TEXT NOT NULL,
  decision_status TEXT NOT NULL,
  decision_reason TEXT,
  authority_type TEXT,
  authority_reference TEXT,
  evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewer_actor_id TEXT NOT NULL REFERENCES users(user_id),
  reviewer_org_id TEXT NOT NULL REFERENCES organizations(organization_id),
  effective_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  stale_at TIMESTAMPTZ,
  supersedes_decision_id TEXT REFERENCES commercial_product_review_decisions(review_decision_id),
  version INTEGER NOT NULL CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_review_gate_known CHECK (gate_type IN ('COMMERCIAL_READINESS','LEGAL','TAX','REGULATORY','PROCUREMENT','FUNDING','DELIVERY_CAPACITY','EVIDENCE','SUPPORT','PRICING','MARGIN','ENTITLEMENT','PARTNER','COMMISSION')),
  CONSTRAINT commercial_product_review_status_known CHECK (decision_status IN ('NOT_REQUIRED','PENDING','APPROVED','BLOCKED','STALE','UNKNOWN')),
  CONSTRAINT commercial_product_review_evidence_array CHECK (jsonb_typeof(evidence_references) = 'array'),
  CONSTRAINT commercial_product_review_approved_authority CHECK (decision_status <> 'APPROVED' OR (authority_type IS NOT NULL AND authority_reference IS NOT NULL AND jsonb_array_length(evidence_references) > 0)),
  CONSTRAINT commercial_product_review_not_required_authority CHECK (decision_status <> 'NOT_REQUIRED' OR (authority_type IS NOT NULL AND authority_reference IS NOT NULL AND decision_reason IS NOT NULL)),
  CONSTRAINT commercial_product_review_blocked_reason CHECK (decision_status <> 'BLOCKED' OR length(trim(COALESCE(decision_reason,''))) > 0),
  CONSTRAINT commercial_product_review_expiry_order CHECK (expires_at IS NULL OR expires_at >= reviewed_at),
  CONSTRAINT commercial_product_review_supersedes_not_self CHECK (supersedes_decision_id IS NULL OR supersedes_decision_id <> review_decision_id),
  UNIQUE (candidate_id, gate_type, version),
  UNIQUE (supersedes_decision_id)
);

CREATE INDEX IF NOT EXISTS commercial_product_review_decisions_latest_idx
  ON commercial_product_review_decisions(candidate_id, gate_type, version DESC, reviewed_at DESC);

CREATE INDEX IF NOT EXISTS commercial_product_review_decisions_product_idx
  ON commercial_product_review_decisions(commercial_product_id, gate_type, reviewed_at DESC);

CREATE TABLE IF NOT EXISTS commercial_product_source_resolutions (
  source_resolution_id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL CHECK (candidate_id ~ '^cc-[0-9]{3}$'),
  commercial_product_id TEXT NOT NULL CHECK (commercial_product_id LIKE 'cp_%'),
  resolution_status TEXT NOT NULL,
  authority_domain TEXT,
  authority_reference TEXT,
  authority_version TEXT,
  evidence_reference TEXT,
  resolved_by_actor TEXT NOT NULL REFERENCES users(user_id),
  resolved_by_org TEXT NOT NULL REFERENCES organizations(organization_id),
  resolved_at TIMESTAMPTZ NOT NULL,
  resolution_reason TEXT,
  remaining_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  supersedes_resolution_id TEXT REFERENCES commercial_product_source_resolutions(source_resolution_id),
  version INTEGER NOT NULL CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT commercial_product_source_resolution_status_known CHECK (resolution_status IN ('UNRESOLVED','RESOLVED','REJECTED_SOURCE','STALE','NEEDS_REVIEW')),
  CONSTRAINT commercial_product_source_resolution_requirements_array CHECK (jsonb_typeof(remaining_requirements) = 'array'),
  CONSTRAINT commercial_product_source_resolved_authority CHECK (resolution_status <> 'RESOLVED' OR (length(trim(COALESCE(authority_domain,''))) > 0 AND length(trim(COALESCE(authority_reference,''))) > 0 AND length(trim(COALESCE(evidence_reference,''))) > 0)),
  CONSTRAINT commercial_product_source_rejected_reason CHECK (resolution_status <> 'REJECTED_SOURCE' OR length(trim(COALESCE(resolution_reason,''))) > 0),
  CONSTRAINT commercial_product_source_supersedes_not_self CHECK (supersedes_resolution_id IS NULL OR supersedes_resolution_id <> source_resolution_id),
  UNIQUE (candidate_id, version),
  UNIQUE (supersedes_resolution_id)
);

CREATE INDEX IF NOT EXISTS commercial_product_source_resolutions_latest_idx
  ON commercial_product_source_resolutions(candidate_id, version DESC, resolved_at DESC);

CREATE INDEX IF NOT EXISTS commercial_product_source_resolutions_product_idx
  ON commercial_product_source_resolutions(commercial_product_id, resolution_status, resolved_at DESC);

CREATE OR REPLACE FUNCTION commercial_product_review_history_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'commercial product review history is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS commercial_product_review_decisions_immutable_trg ON commercial_product_review_decisions;
CREATE TRIGGER commercial_product_review_decisions_immutable_trg
  BEFORE UPDATE OR DELETE ON commercial_product_review_decisions
  FOR EACH ROW EXECUTE FUNCTION commercial_product_review_history_immutable();

DROP TRIGGER IF EXISTS commercial_product_source_resolutions_immutable_trg ON commercial_product_source_resolutions;
CREATE TRIGGER commercial_product_source_resolutions_immutable_trg
  BEFORE UPDATE OR DELETE ON commercial_product_source_resolutions
  FOR EACH ROW EXECUTE FUNCTION commercial_product_review_history_immutable();
