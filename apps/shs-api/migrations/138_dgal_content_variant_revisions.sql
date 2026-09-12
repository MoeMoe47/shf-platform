-- DGAL-6 micro-gap: make language/plain-language variants independently
-- revisioned and prevent two active variants for one source/language/scope.
ALTER TABLE dgal_content_variants
  ADD COLUMN IF NOT EXISTS variant_revision INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ;

ALTER TABLE dgal_content_variants
  DROP CONSTRAINT IF EXISTS dgal_content_variants_source_reference_source_version_language_code_organization_id_tenant_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS dgal_content_variants_revision_key
  ON dgal_content_variants (source_reference, source_version_reference, language_code, organization_id, tenant_id, variant_revision);

CREATE UNIQUE INDEX IF NOT EXISTS dgal_content_variants_one_active_key
  ON dgal_content_variants (source_reference, source_version_reference, language_code, organization_id, tenant_id)
  WHERE status = 'ACTIVE';
