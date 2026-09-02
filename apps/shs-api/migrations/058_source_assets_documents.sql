-- Phase 1: immutable, organization-scoped source material intake.
-- These records are input/provenance only. They do not represent curriculum,
-- learner progress, evidence, or achievement.

CREATE TABLE IF NOT EXISTS source_assets (
  source_asset_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  uploaded_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  original_filename TEXT NOT NULL,
  media_type TEXT NOT NULL,
  file_extension TEXT NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size > 0 AND byte_size <= 26214400),
  content_hash TEXT NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  storage_provider TEXT NOT NULL DEFAULT 'local_private',
  storage_key TEXT NOT NULL UNIQUE,
  visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility = 'PRIVATE'),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RETIRED')),
  scan_status TEXT NOT NULL DEFAULT 'UNAVAILABLE'
    CHECK (scan_status IN ('PENDING', 'CLEAN', 'REJECTED', 'UNAVAILABLE')),
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT source_assets_tenant_org_check CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT source_assets_id_org_unique UNIQUE (source_asset_id, organization_id),
  CONSTRAINT source_assets_org_hash_unique UNIQUE (organization_id, content_hash),
  CONSTRAINT source_assets_org_user_fk FOREIGN KEY (organization_id, uploaded_by_user_id)
    REFERENCES users(organization_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_source_assets_org_idempotency
  ON source_assets (organization_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_source_assets_org_created
  ON source_assets (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_assets_org_status
  ON source_assets (organization_id, status, scan_status);

CREATE TABLE IF NOT EXISTS source_document_versions (
  source_document_version_id TEXT PRIMARY KEY,
  source_asset_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  processing_status TEXT NOT NULL DEFAULT 'STORED'
    CHECK (processing_status IN ('RECEIVED', 'VALIDATED', 'STORED', 'QUEUED', 'PROCESSING', 'PROCESSED', 'FAILED')),
  extraction_status TEXT NOT NULL DEFAULT 'NOT_STARTED'
    CHECK (extraction_status IN ('NOT_STARTED', 'PENDING', 'SUCCEEDED', 'FAILED', 'UNAVAILABLE')),
  parser_version TEXT,
  extracted_text_location TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  derived_hash TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT source_document_versions_tenant_org_check CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT source_document_versions_asset_version_unique UNIQUE (source_asset_id, version_number),
  CONSTRAINT source_document_versions_asset_same_org_fk FOREIGN KEY (source_asset_id, organization_id)
    REFERENCES source_assets(source_asset_id, organization_id),
  CONSTRAINT source_document_versions_org_user_fk FOREIGN KEY (organization_id, created_by_user_id)
    REFERENCES users(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_source_document_versions_org_created
  ON source_document_versions (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_document_versions_asset
  ON source_document_versions (source_asset_id, version_number);
CREATE INDEX IF NOT EXISTS idx_source_document_versions_processing
  ON source_document_versions (organization_id, processing_status, extraction_status);
