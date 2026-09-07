-- Post-lock Legal runtime authority. Metadata-only by default; this is not
-- legal advice, privileged content, or a substitute for counsel authority.
CREATE TABLE IF NOT EXISTS legal_artifacts (
  artifact_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','ACTIVE','SUPERSEDED','ARCHIVED')),
  effective_at TIMESTAMPTZ,
  superseded_at TIMESTAMPTZ,
  jurisdiction TEXT,
  authoritative_reference TEXT NOT NULL,
  content_hash TEXT NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  classification TEXT NOT NULL CHECK (classification IN ('PUBLIC','INTERNAL','RESTRICTED_EXTERNAL')),
  confidentiality TEXT NOT NULL CHECK (confidentiality IN ('PUBLIC','INTERNAL','CONFIDENTIAL')),
  privilege_state TEXT NOT NULL DEFAULT 'NOT_ASSESSED' CHECK (privilege_state IN ('NOT_ASSESSED','COUNSEL_REVIEW_REQUIRED')),
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  approved_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, tenant_id, artifact_id)
);

CREATE TABLE IF NOT EXISTS legal_decisions (
  decision_id TEXT PRIMARY KEY,
  artifact_id TEXT REFERENCES legal_artifacts(artifact_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  decision_text TEXT NOT NULL,
  authority_reference TEXT NOT NULL,
  disposition TEXT NOT NULL,
  decision_at TIMESTAMPTZ NOT NULL,
  actor_user_id TEXT NOT NULL REFERENCES users(user_id),
  provenance_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_obligations (
  obligation_id TEXT PRIMARY KEY,
  artifact_id TEXT REFERENCES legal_artifacts(artifact_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  obligation_text TEXT NOT NULL,
  accountable_entity_reference TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('OPEN','SATISFIED','WAIVED','SUPERSEDED')),
  effective_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  technical_binding_reference TEXT,
  evidence_reference TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_technical_bindings (
  binding_id TEXT PRIMARY KEY,
  obligation_id TEXT NOT NULL REFERENCES legal_obligations(obligation_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  technical_authority TEXT NOT NULL,
  technical_reference TEXT NOT NULL,
  evidence_reference TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_holds (
  hold_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  subject_reference TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','RELEASED')),
  reason_reference TEXT NOT NULL,
  placed_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  released_by_user_id TEXT REFERENCES users(user_id),
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS legal_artifacts_scope_idx ON legal_artifacts (organization_id, tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS legal_decisions_scope_idx ON legal_decisions (organization_id, tenant_id, decision_at DESC);
CREATE INDEX IF NOT EXISTS legal_obligations_scope_idx ON legal_obligations (organization_id, tenant_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS legal_holds_scope_idx ON legal_holds (organization_id, tenant_id, status, placed_at DESC);

DO $$
BEGIN
  ALTER TABLE report_artifacts DROP CONSTRAINT IF EXISTS report_artifacts_product_key_ck;
  ALTER TABLE report_artifacts ADD CONSTRAINT report_artifacts_product_key_ck CHECK (product_key IS NULL OR product_key IN ('civicsure','oas','registry','studio','bos','foundation','solutions','legal'));
  ALTER TABLE report_payload_snapshots DROP CONSTRAINT IF EXISTS report_payload_snapshots_product_key_ck;
  ALTER TABLE report_payload_snapshots ADD CONSTRAINT report_payload_snapshots_product_key_ck CHECK (product_key IS NULL OR product_key IN ('civicsure','oas','registry','studio','bos','foundation','solutions','legal'));
  ALTER TABLE report_rendered_files DROP CONSTRAINT IF EXISTS report_rendered_files_product_key_ck;
  ALTER TABLE report_rendered_files ADD CONSTRAINT report_rendered_files_product_key_ck CHECK (product_key IS NULL OR product_key IN ('civicsure','oas','registry','studio','bos','foundation','solutions','legal'));
  ALTER TABLE report_templates DROP CONSTRAINT IF EXISTS report_templates_product_key_ck;
  ALTER TABLE report_templates ADD CONSTRAINT report_templates_product_key_ck CHECK (product_key IS NULL OR product_key IN ('civicsure','oas','registry','studio','bos','foundation','solutions','legal'));
END $$;
