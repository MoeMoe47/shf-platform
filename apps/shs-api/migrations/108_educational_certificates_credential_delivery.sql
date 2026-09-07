-- U6 Educational Certificates and Credential Delivery.
-- Bounded to the canonical credentials authority. Reporting artifacts remain
-- separate and cannot create or mutate these records.

CREATE TABLE IF NOT EXISTS issued_certificates (
  certificate_id TEXT PRIMARY KEY,
  learner_user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  canonical_program_reference TEXT NOT NULL,
  course_reference TEXT,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('COURSE_COMPLETION', 'PROGRAM_COMPLETION', 'ACHIEVEMENT_MILESTONE', 'VERIFIED_SKILL')),
  profile_key TEXT NOT NULL,
  profile_version TEXT NOT NULL,
  issuer_reference TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qualification_reference TEXT NOT NULL,
  evidence_references_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'REVOKED', 'REPLACED')),
  verification_reference TEXT NOT NULL UNIQUE,
  certificate_serial TEXT NOT NULL UNIQUE,
  template_key TEXT NOT NULL,
  template_version TEXT NOT NULL,
  source_versions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  presentation_snapshot_json JSONB NOT NULL,
  content_hash TEXT NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  supersedes_certificate_id TEXT REFERENCES issued_certificates(certificate_id),
  replaced_by_certificate_id TEXT REFERENCES issued_certificates(certificate_id),
  revoked_at TIMESTAMPTZ,
  revoked_by_user_id TEXT REFERENCES users(user_id),
  revocation_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((status = 'REVOKED') = (revoked_at IS NOT NULL)),
  CHECK ((status = 'REVOKED') = (revoked_by_user_id IS NOT NULL)),
  CHECK ((status = 'REVOKED') = (revocation_reference IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS issued_certificates_qualification_unique
  ON issued_certificates (learner_user_id, canonical_program_reference, certificate_type, qualification_reference)
  WHERE status IN ('ISSUED', 'REPLACED');
CREATE INDEX IF NOT EXISTS issued_certificates_learner_scope_idx
  ON issued_certificates (organization_id, tenant_id, learner_user_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS issued_certificates_program_scope_idx
  ON issued_certificates (organization_id, tenant_id, canonical_program_reference, issued_at DESC);

CREATE TABLE IF NOT EXISTS certificate_renders (
  certificate_render_id TEXT PRIMARY KEY,
  certificate_id TEXT NOT NULL REFERENCES issued_certificates(certificate_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('HTML', 'PDF')),
  mime_type TEXT NOT NULL,
  byte_length BIGINT NOT NULL CHECK (byte_length >= 0),
  content_hash TEXT NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  renderer_version TEXT NOT NULL,
  template_key TEXT NOT NULL,
  template_version TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_reference TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS certificate_renders_scope_idx
  ON certificate_renders (organization_id, tenant_id, certificate_id, created_at DESC);

CREATE TABLE IF NOT EXISTS certificate_delivery_events (
  delivery_id TEXT PRIMARY KEY,
  certificate_id TEXT NOT NULL REFERENCES issued_certificates(certificate_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('DOWNLOAD', 'PRINT_ACTION', 'EMAIL')),
  recipient_reference TEXT,
  requested_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('REQUESTED', 'DELIVERED', 'FAILED')),
  provider_reference TEXT,
  failure_reason TEXT
);
CREATE INDEX IF NOT EXISTS certificate_delivery_events_scope_idx
  ON certificate_delivery_events (organization_id, tenant_id, certificate_id, occurred_at DESC);
