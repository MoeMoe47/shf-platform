-- CivicSure Reports R1: immutable payloads, versioned templates, and rendered
-- file metadata. Rendered bytes remain outside PostgreSQL behind a scoped
-- storage reference; report_artifacts remains the canonical artifact authority.
ALTER TABLE report_artifacts
  ADD COLUMN IF NOT EXISTS report_type TEXT,
  ADD COLUMN IF NOT EXISTS report_version INTEGER,
  ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
  ADD COLUMN IF NOT EXISTS subject_reference TEXT,
  ADD COLUMN IF NOT EXISTS reporting_period_start DATE,
  ADD COLUMN IF NOT EXISTS reporting_period_end DATE,
  ADD COLUMN IF NOT EXISTS reporting_period_label TEXT,
  ADD COLUMN IF NOT EXISTS ai_involvement JSONB;

CREATE TABLE IF NOT EXISTS report_templates (
  template_id TEXT PRIMARY KEY,
  template_key TEXT NOT NULL,
  report_type TEXT NOT NULL,
  template_version INTEGER NOT NULL CHECK (template_version > 0),
  supported_formats JSONB NOT NULL,
  renderer_identifier TEXT NOT NULL,
  classification_behavior JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_key, template_version),
  CHECK (jsonb_typeof(supported_formats) = 'array'),
  CHECK (jsonb_typeof(classification_behavior) = 'object'),
  CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE IF NOT EXISTS report_payload_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES report_artifacts(artifact_id),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  report_type TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  jurisdiction TEXT,
  subject_reference TEXT,
  reporting_period_start DATE,
  reporting_period_end DATE,
  reporting_period_label TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  classification TEXT NOT NULL CHECK (classification IN ('INTERNAL', 'RESTRICTED_EXTERNAL', 'PUBLIC')),
  payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  canonical_reference_manifest JSONB NOT NULL,
  metric_definition_versions JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_involvement JSONB,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (artifact_id),
  CHECK (jsonb_typeof(payload) = 'object'),
  CHECK (jsonb_typeof(canonical_reference_manifest) = 'object'),
  CHECK (jsonb_typeof(metric_definition_versions) = 'array'),
  CHECK (jsonb_typeof(verification_summary) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_report_payload_snapshots_scope
  ON report_payload_snapshots (tenant_id, organization_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS report_rendered_files (
  rendered_file_id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES report_artifacts(artifact_id),
  snapshot_id TEXT NOT NULL REFERENCES report_payload_snapshots(snapshot_id),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  format TEXT NOT NULL CHECK (format IN ('JSON', 'HTML', 'PDF')),
  mime_type TEXT NOT NULL,
  byte_length BIGINT NOT NULL CHECK (byte_length >= 0),
  content_hash TEXT NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  template_id TEXT NOT NULL REFERENCES report_templates(template_id),
  template_version INTEGER NOT NULL CHECK (template_version > 0),
  renderer_version TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_reference TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('INTERNAL', 'RESTRICTED_EXTERNAL', 'PUBLIC')),
  retrieval_state TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (retrieval_state IN ('AVAILABLE', 'REVOKED', 'SUPERSEDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  supersedes_rendered_file_id TEXT REFERENCES report_rendered_files(rendered_file_id),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (artifact_id, format, template_id, template_version)
);

CREATE INDEX IF NOT EXISTS idx_report_rendered_files_scope
  ON report_rendered_files (tenant_id, organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_rendered_files_artifact
  ON report_rendered_files (artifact_id, format, retrieval_state);
