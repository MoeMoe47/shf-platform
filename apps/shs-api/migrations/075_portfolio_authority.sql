-- V1+ Phase 2: durable learner Portfolio authority.
-- Portfolio stores presentation state and immutable source provenance only.
CREATE TABLE IF NOT EXISTS portfolio_profiles (
  portfolio_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  learner_id TEXT NOT NULL REFERENCES users(user_id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT portfolio_profile_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT portfolio_profile_learner_scope_fk FOREIGN KEY (organization_id, learner_id)
    REFERENCES users(organization_id, user_id),
  CONSTRAINT portfolio_profile_scope_unique UNIQUE (portfolio_id, organization_id, tenant_id, learner_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS portfolio_profile_active_scope_idx
  ON portfolio_profiles (organization_id, tenant_id, learner_id)
  WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS portfolio_artifacts (
  artifact_id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolio_profiles(portfolio_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  learner_id TEXT NOT NULL REFERENCES users(user_id),
  source_type TEXT NOT NULL CHECK (source_type IN ('STUDIO_EVIDENCE')),
  evidence_id TEXT NOT NULL REFERENCES prepare_prove_evidence(evidence_id),
  studio_project_id TEXT NOT NULL REFERENCES projects(project_id),
  studio_delivery_id TEXT NOT NULL REFERENCES studio_delivery_records(delivery_record_id),
  workspace_revision INTEGER NOT NULL CHECK (workspace_revision > 0),
  project_type TEXT NOT NULL CHECK (project_type IN ('WEBSITE', 'AI_AGENT')),
  assignment_id TEXT REFERENCES assignments(assignment_id),
  curriculum_release_id TEXT,
  competency_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  finalized_at TIMESTAMPTZ NOT NULL,
  display_title TEXT NOT NULL DEFAULT 'Untitled project',
  summary TEXT NOT NULL DEFAULT '',
  reflection TEXT NOT NULL DEFAULT '',
  thumbnail_reference TEXT,
  collection_key TEXT,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'ORGANIZATION')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'ARCHIVED', 'REMOVED')),
  archived_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT portfolio_artifact_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT portfolio_artifact_scope_fk FOREIGN KEY (portfolio_id, organization_id, tenant_id, learner_id)
    REFERENCES portfolio_profiles(portfolio_id, organization_id, tenant_id, learner_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS portfolio_artifact_active_source_idx
  ON portfolio_artifacts (portfolio_id, source_type, evidence_id)
  WHERE status <> 'REMOVED';

CREATE INDEX IF NOT EXISTS portfolio_artifact_scope_idx
  ON portfolio_artifacts (organization_id, tenant_id, learner_id, status, position, created_at DESC);

CREATE INDEX IF NOT EXISTS portfolio_artifact_source_idx
  ON portfolio_artifacts (organization_id, tenant_id, evidence_id);
