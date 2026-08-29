-- Phase 16: generic, auditable PREPARE / PROVE foundation.
CREATE TABLE IF NOT EXISTS prepare_prove_activity_results (
  result_id TEXT PRIMARY KEY,
  activity_type TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  result_status TEXT NOT NULL CHECK (result_status IN ('SUCCEEDED','INCOMPLETE','FAILED')),
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id, activity_type, activity_id)
);

CREATE TABLE IF NOT EXISTS prepare_prove_evidence (
  evidence_id TEXT PRIMARY KEY,
  source_domain TEXT NOT NULL,
  source_record_id TEXT NOT NULL REFERENCES prepare_prove_activity_results(result_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  criterion TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CANDIDATE','REVIEWABLE','REVIEWED','INSUFFICIENT')),
  provenance_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, source_domain, source_record_id, criterion)
);

CREATE TABLE IF NOT EXISTS competency_definitions (
  competency_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  criteria_json JSONB NOT NULL,
  evidence_requirements_json JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','PLANNED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learner_competency_decisions (
  decision_id TEXT PRIMARY KEY,
  competency_id TEXT NOT NULL REFERENCES competency_definitions(competency_id),
  evidence_id TEXT NOT NULL REFERENCES prepare_prove_evidence(evidence_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('EVIDENCE_INSUFFICIENT','DEMONSTRATED','NEEDS_REVIEW')),
  criteria_version INTEGER NOT NULL CHECK (criteria_version > 0),
  reviewer_user_id TEXT NOT NULL REFERENCES users(user_id),
  reviewer_authority TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provenance_json JSONB NOT NULL,
  UNIQUE (organization_id, competency_id, evidence_id, criteria_version)
);

CREATE INDEX IF NOT EXISTS prepare_prove_evidence_scope_idx
  ON prepare_prove_evidence (tenant_id, organization_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS learner_competency_decisions_scope_idx
  ON learner_competency_decisions (tenant_id, organization_id, user_id, reviewed_at DESC);

INSERT INTO competency_definitions
  (competency_id, slug, title, description, domain, version, criteria_json, evidence_requirements_json, status)
VALUES
  ('competency_prepare_prove_monitoring_finding',
   'interpret-monitoring-data-and-document-safe-finding',
   'Interpret monitoring data and document a safe technical finding',
   'Interpret synthetic infrastructure observations, distinguish evidence from assumptions, identify an affected system, and recommend a safe escalation or next step.',
   'data-center-technical-operations',
   1,
   '{"criteria":["records observations accurately","identifies a plausible affected system","separates evidence from uncertainty","recommends a safe next step"]}',
   '{"source_activity_type":"SIMULATED_INFRASTRUCTURE_MONITORING","review_required":true}',
   'ACTIVE')
ON CONFLICT (slug) DO NOTHING;
