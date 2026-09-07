-- Government Program Assurance Phase 3: Claim -> Evidence -> Verification.
-- Existing Evidence remains owned by prepare_prove_evidence/source ingestion.
-- This migration adds links, admissibility, custody, and verification work;
-- it does not promote claims or evidence into Truth.

ALTER TABLE gpa_claims
  ADD COLUMN IF NOT EXISTS subject_type TEXT NOT NULL DEFAULT 'UNSPECIFIED',
  ADD COLUMN IF NOT EXISTS subject_reference TEXT NOT NULL DEFAULT 'UNSPECIFIED',
  ADD COLUMN IF NOT EXISTS metric_reference TEXT,
  ADD COLUMN IF NOT EXISTS asserted_population JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;
ALTER TABLE gpa_claims DROP CONSTRAINT IF EXISTS gpa_claims_status_check;
ALTER TABLE gpa_claims ADD CONSTRAINT gpa_claims_status_check CHECK (status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','EVIDENCE_INCOMPLETE','READY_FOR_VERIFICATION','VERIFIED','PARTIALLY_VERIFIED','REJECTED','SUPERSEDED','WITHDRAWN'));
CREATE INDEX IF NOT EXISTS gpa_claims_lifecycle_idx ON gpa_claims (organization_id, tenant_id, status, submitted_at DESC);

CREATE TABLE IF NOT EXISTS gpa_claim_evidence_links (
  claim_evidence_link_id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  evidence_id TEXT NOT NULL,
  evidence_authority TEXT NOT NULL DEFAULT 'PREPARE_PROVE_EVIDENCE',
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('PRIMARY','SUPPORTING','CORROBORATING','CONTRADICTORY','EXCEPTION','CONTEXT')),
  evidence_role TEXT NOT NULL,
  requirement_reference TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUPERSEDED','REMOVED')),
  submitted_by TEXT NOT NULL REFERENCES users(user_id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provenance_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE (claim_id, organization_id, tenant_id, evidence_id, relationship_type),
  CONSTRAINT gpa_claim_evidence_link_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  FOREIGN KEY (claim_id, organization_id, tenant_id) REFERENCES gpa_claims(claim_id, organization_id, tenant_id)
);
CREATE INDEX IF NOT EXISTS gpa_claim_evidence_links_scope_idx ON gpa_claim_evidence_links (organization_id, tenant_id, claim_id, status, added_at DESC);

CREATE TABLE IF NOT EXISTS gpa_evidence_admissibility (
  admissibility_id TEXT PRIMARY KEY,
  claim_evidence_link_id TEXT NOT NULL REFERENCES gpa_claim_evidence_links(claim_evidence_link_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('ADMISSIBLE','MISSING_PROVENANCE','SOURCE_NOT_AUTHORIZED','PURPOSE_NOT_ALLOWED','STALE','SUPERSEDED','CLASSIFICATION_DENIED','INTEGRITY_UNVERIFIED','SUBJECT_MISMATCH','INCOMPLETE')),
  reason_codes JSONB NOT NULL DEFAULT '[]'::JSONB,
  source_authority_reference TEXT,
  data_use_policy_reference TEXT,
  evaluated_by TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT gpa_evidence_admissibility_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE INDEX IF NOT EXISTS gpa_evidence_admissibility_scope_idx ON gpa_evidence_admissibility (organization_id, tenant_id, claim_evidence_link_id, evaluated_at DESC);

CREATE TABLE IF NOT EXISTS gpa_evidence_custody_events (
  custody_event_id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ACQUIRED','INGESTED','TRANSFORMED','CLASSIFIED','ACCESSED','TRANSFERRED','SUPERSEDED','RETRACTED')),
  actor_reference TEXT NOT NULL,
  source_reference TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  content_hash TEXT,
  classification TEXT,
  retention_reference TEXT,
  legal_hold_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT gpa_evidence_custody_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE INDEX IF NOT EXISTS gpa_evidence_custody_scope_idx ON gpa_evidence_custody_events (organization_id, tenant_id, evidence_id, occurred_at);

ALTER TABLE gpa_verification_methods
  ADD COLUMN IF NOT EXISTS eligible_claim_types JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS eligible_subject_types JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS required_source_authority_level TEXT,
  ADD COLUMN IF NOT EXISTS minimum_evidence_count INTEGER NOT NULL DEFAULT 1 CHECK (minimum_evidence_count >= 0),
  ADD COLUMN IF NOT EXISTS reviewer_requirements JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS automation_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS human_review_required BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sampling_requirement_reference TEXT,
  ADD COLUMN IF NOT EXISTS verification_threshold JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS owner_reference TEXT,
  ADD COLUMN IF NOT EXISTS approver_reference TEXT,
  ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::JSONB;
ALTER TABLE gpa_verification_methods DROP CONSTRAINT IF EXISTS gpa_verification_methods_status_check;
ALTER TABLE gpa_verification_methods ADD CONSTRAINT gpa_verification_methods_status_check CHECK (status IN ('DRAFT','ACTIVE','RETIRED','EXPIRED'));

ALTER TABLE gpa_verification_records
  ADD COLUMN IF NOT EXISTS requested_level TEXT NOT NULL DEFAULT 'V0' CHECK (requested_level IN ('V0','V1','V2','V3','V4','V5')),
  ADD COLUMN IF NOT EXISTS achieved_level TEXT CHECK (achieved_level IS NULL OR achieved_level IN ('V0','V1','V2','V3','V4','V5')),
  ADD COLUMN IF NOT EXISTS verification_mode TEXT NOT NULL DEFAULT 'HUMAN' CHECK (verification_mode IN ('HUMAN','AUTOMATED','HYBRID')),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC CHECK (confidence IS NULL OR confidence >= 0 AND confidence <= 1),
  ADD COLUMN IF NOT EXISTS source_authority_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS exceptions JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS contradictions JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS reviewer_reference TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_decision TEXT,
  ADD COLUMN IF NOT EXISTS determination_rationale TEXT,
  ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::JSONB;
ALTER TABLE gpa_verification_records DROP CONSTRAINT IF EXISTS gpa_verification_records_status_check;
ALTER TABLE gpa_verification_records ADD CONSTRAINT gpa_verification_records_status_check CHECK (status IN ('PENDING','IN_PROGRESS','NEEDS_EVIDENCE','NEEDS_REVIEW','UNREVIEWED','PASSED','PARTIAL','FAILED','INCONCLUSIVE','SUPERSEDED','CANCELLED'));
CREATE INDEX IF NOT EXISTS gpa_verification_records_queue_idx ON gpa_verification_records (organization_id, tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS gpa_verification_contradictions (
  contradiction_id TEXT PRIMARY KEY,
  verification_id TEXT NOT NULL REFERENCES gpa_verification_records(verification_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  contradiction_type TEXT NOT NULL,
  left_reference TEXT NOT NULL,
  right_reference TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  materiality TEXT NOT NULL CHECK (materiality IN ('BLOCKING','NON_BLOCKING')),
  reconciliation_case_id TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RESOLVED','WAIVED')),
  created_by TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolution_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT gpa_verification_contradiction_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE INDEX IF NOT EXISTS gpa_verification_contradictions_scope_idx ON gpa_verification_contradictions (organization_id, tenant_id, verification_id, status);

CREATE TABLE IF NOT EXISTS gpa_verification_work_queue (
  work_item_id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  verification_id TEXT NOT NULL REFERENCES gpa_verification_records(verification_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  assigned_verifier_reference TEXT,
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
  due_at TIMESTAMPTZ,
  target_level TEXT NOT NULL CHECK (target_level IN ('V0','V1','V2','V3','V4','V5')),
  blocker_codes JSONB NOT NULL DEFAULT '[]'::JSONB,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ASSIGNED','BLOCKED','COMPLETED','CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gpa_verification_work_queue_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  FOREIGN KEY (claim_id, organization_id, tenant_id) REFERENCES gpa_claims(claim_id, organization_id, tenant_id),
  UNIQUE (verification_id)
);
CREATE INDEX IF NOT EXISTS gpa_verification_work_queue_scope_idx ON gpa_verification_work_queue (organization_id, tenant_id, status, priority, created_at);
