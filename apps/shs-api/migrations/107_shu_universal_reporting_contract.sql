-- SHU Universal Reporting U1: product/family identity on the canonical
-- Reporting authority. Existing report records are CivicSure-owned only when
-- their established report type identifies a CivicSure family.

ALTER TABLE report_artifacts
  ADD COLUMN IF NOT EXISTS product_key TEXT,
  ADD COLUMN IF NOT EXISTS report_family TEXT;

ALTER TABLE report_payload_snapshots
  ADD COLUMN IF NOT EXISTS product_key TEXT,
  ADD COLUMN IF NOT EXISTS report_family TEXT;

ALTER TABLE report_rendered_files
  ADD COLUMN IF NOT EXISTS product_key TEXT,
  ADD COLUMN IF NOT EXISTS report_family TEXT;

ALTER TABLE report_templates
  ADD COLUMN IF NOT EXISTS product_key TEXT,
  ADD COLUMN IF NOT EXISTS report_family TEXT;

UPDATE report_artifacts
SET report_family = CASE report_type
  WHEN 'EXECUTIVE_ASSURANCE' THEN 'executive-assurance'
  WHEN 'PROGRAM_ASSURANCE' THEN 'program-assurance'
  WHEN 'PROVIDER_ASSURANCE' THEN 'provider-assurance'
  WHEN 'FUNDING_LINEAGE' THEN 'funding-lineage'
  WHEN 'AUDIT_PACKET' THEN 'audit-packet'
  ELSE report_family
END
WHERE (product_key = 'civicsure' OR product_key IS NULL) AND report_family IS NULL;

UPDATE report_artifacts
SET product_key = 'civicsure'
WHERE product_key IS NULL
  AND report_type IN ('EXECUTIVE_ASSURANCE', 'PROGRAM_ASSURANCE', 'PROVIDER_ASSURANCE', 'FUNDING_LINEAGE', 'AUDIT_PACKET');

UPDATE report_payload_snapshots
SET report_family = CASE report_type
  WHEN 'EXECUTIVE_ASSURANCE' THEN 'executive-assurance'
  WHEN 'PROGRAM_ASSURANCE' THEN 'program-assurance'
  WHEN 'PROVIDER_ASSURANCE' THEN 'provider-assurance'
  WHEN 'FUNDING_LINEAGE' THEN 'funding-lineage'
  WHEN 'AUDIT_PACKET' THEN 'audit-packet'
  ELSE report_family
END
WHERE (product_key = 'civicsure' OR product_key IS NULL) AND report_family IS NULL;

UPDATE report_payload_snapshots
SET product_key = 'civicsure'
WHERE product_key IS NULL
  AND report_type IN ('EXECUTIVE_ASSURANCE', 'PROGRAM_ASSURANCE', 'PROVIDER_ASSURANCE', 'FUNDING_LINEAGE', 'AUDIT_PACKET');

UPDATE report_rendered_files f
SET product_key = s.product_key,
    report_family = s.report_family
FROM report_payload_snapshots s
WHERE s.snapshot_id = f.snapshot_id;

UPDATE report_templates
SET report_family = CASE report_type
  WHEN 'EXECUTIVE_ASSURANCE' THEN 'executive-assurance'
  WHEN 'PROGRAM_ASSURANCE' THEN 'program-assurance'
  WHEN 'PROVIDER_ASSURANCE' THEN 'provider-assurance'
  WHEN 'FUNDING_LINEAGE' THEN 'funding-lineage'
  WHEN 'AUDIT_PACKET' THEN 'audit-packet'
  ELSE report_family
END
WHERE (product_key = 'civicsure' OR product_key IS NULL) AND report_family IS NULL;

UPDATE report_templates
SET product_key = 'civicsure'
WHERE product_key IS NULL
  AND report_type IN ('EXECUTIVE_ASSURANCE', 'PROGRAM_ASSURANCE', 'PROVIDER_ASSURANCE', 'FUNDING_LINEAGE', 'AUDIT_PACKET');

ALTER TABLE report_artifacts
  ADD CONSTRAINT report_artifacts_product_key_ck
  CHECK (product_key IS NULL OR product_key IN ('civicsure','oas','registry','studio','bos','foundation','solutions'));

ALTER TABLE report_payload_snapshots
  ADD CONSTRAINT report_payload_snapshots_product_key_ck
  CHECK (product_key IS NULL OR product_key IN ('civicsure','oas','registry','studio','bos','foundation','solutions'));

ALTER TABLE report_rendered_files
  ADD CONSTRAINT report_rendered_files_product_key_ck
  CHECK (product_key IS NULL OR product_key IN ('civicsure','oas','registry','studio','bos','foundation','solutions'));

ALTER TABLE report_templates
  ADD CONSTRAINT report_templates_product_key_ck
  CHECK (product_key IS NULL OR product_key IN ('civicsure','oas','registry','studio','bos','foundation','solutions'));

CREATE INDEX IF NOT EXISTS idx_report_artifacts_product_family
  ON report_artifacts (product_key, report_family, tenant_id, organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_payload_snapshots_product_family
  ON report_payload_snapshots (product_key, report_family, tenant_id, organization_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_rendered_files_product_family
  ON report_rendered_files (product_key, report_family, tenant_id, organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_templates_product_family
  ON report_templates (product_key, report_family, status, template_version);
