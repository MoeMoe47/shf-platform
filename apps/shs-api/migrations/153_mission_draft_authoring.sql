-- Phase 4C: editable, validated Mission drafts remain separate from published
-- resolver content and Mission Runtime snapshots.
CREATE TABLE IF NOT EXISTS mission_definition_drafts (
  draft_id UUID PRIMARY KEY,
  mission_id TEXT NOT NULL,
  mission_version INTEGER NOT NULL CHECK (mission_version > 0),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL REFERENCES users(user_id),
  definition_json JSONB NOT NULL CHECK (jsonb_typeof(definition_json) = 'object'),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status = 'DRAFT'),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  updated_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mission_draft_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (organization_id, tenant_id, mission_id, mission_version)
);

CREATE INDEX IF NOT EXISTS mission_draft_author_recent_idx
  ON mission_definition_drafts (organization_id, tenant_id, author_user_id, updated_at DESC);
