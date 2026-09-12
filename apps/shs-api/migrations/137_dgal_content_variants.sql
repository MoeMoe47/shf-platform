-- DGAL-6: traceable explanation/language variants. Canonical text and legal
-- meaning remain owned by the referenced source domain.
CREATE TABLE IF NOT EXISTS dgal_content_variants (
  variant_id TEXT PRIMARY KEY,
  content_kind TEXT NOT NULL CHECK (content_kind IN ('GUIDANCE','DOCUMENT_TEMPLATE','AGREEMENT_EXPLANATION')),
  source_reference TEXT NOT NULL,
  source_version_reference TEXT NOT NULL,
  language_code TEXT NOT NULL,
  variant_reference TEXT NOT NULL,
  owner_domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
  approval_reference TEXT,
  organization_id TEXT REFERENCES organizations(organization_id),
  tenant_id TEXT,
  created_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dgal_variant_scope_pair CHECK ((organization_id IS NULL AND tenant_id IS NULL) OR (organization_id IS NOT NULL AND tenant_id='tenant:' || organization_id)),
  UNIQUE (source_reference, source_version_reference, language_code, organization_id, tenant_id)
);
CREATE INDEX IF NOT EXISTS idx_dgal_content_variants_scope ON dgal_content_variants (organization_id, tenant_id, source_reference, language_code, status);
