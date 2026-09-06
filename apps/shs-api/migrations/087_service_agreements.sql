-- 087_service_agreements.sql
-- SHF Hybrid Roadmap Phase 6: governed service agreements and service
-- operation history. Entitlements remain authorization to receive a service;
-- agreements govern operating terms for agreement-required services.

ALTER TABLE service_catalog
  ADD COLUMN IF NOT EXISTS agreement_requirement TEXT NOT NULL DEFAULT 'NO_AGREEMENT_REQUIRED';

ALTER TABLE service_catalog
  DROP CONSTRAINT IF EXISTS service_catalog_known_agreement_requirement;

ALTER TABLE service_catalog
  ADD CONSTRAINT service_catalog_known_agreement_requirement CHECK (
    agreement_requirement IN ('NO_AGREEMENT_REQUIRED', 'AGREEMENT_REQUIRED', 'OPTIONAL_AGREEMENT')
  );

UPDATE service_catalog
SET agreement_requirement = CASE
  WHEN service_key IN ('reporting', 'project_studio') THEN 'AGREEMENT_REQUIRED'
  WHEN service_key IN ('curriculum') THEN 'NO_AGREEMENT_REQUIRED'
  ELSE 'OPTIONAL_AGREEMENT'
END,
updated_at = NOW()
WHERE service_key IN ('reporting', 'project_studio', 'curriculum', 'truth_evidence', 'career_workforce');

CREATE TABLE IF NOT EXISTS service_agreements (
  agreement_id TEXT PRIMARY KEY,
  provider_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  consumer_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  service_id TEXT NOT NULL REFERENCES service_catalog(service_id),
  source_relationship_id TEXT REFERENCES organization_relationships(relationship_id),
  source_entitlement_id TEXT REFERENCES organization_service_entitlements(entitlement_id),
  status TEXT NOT NULL,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMP,
  service_scope TEXT NOT NULL DEFAULT '',
  support_level TEXT NOT NULL DEFAULT '',
  service_expectations JSONB NOT NULL DEFAULT '{}'::jsonb,
  agreement_reference TEXT,
  current_version INTEGER NOT NULL DEFAULT 1,
  created_by_user_id TEXT REFERENCES users(user_id),
  approved_by_user_id TEXT REFERENCES users(user_id),
  approved_at TIMESTAMP,
  activated_by_user_id TEXT REFERENCES users(user_id),
  activated_at TIMESTAMP,
  suspended_by_user_id TEXT REFERENCES users(user_id),
  suspended_at TIMESTAMP,
  terminated_by_user_id TEXT REFERENCES users(user_id),
  terminated_at TIMESTAMP,
  termination_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT service_agreement_known_status CHECK (status IN ('DRAFT', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'EXPIRED')),
  CONSTRAINT service_agreement_effective_range CHECK (
    effective_until IS NULL OR effective_until >= effective_from
  )
);

CREATE INDEX IF NOT EXISTS idx_service_agreements_provider
  ON service_agreements(provider_organization_id, status);

CREATE INDEX IF NOT EXISTS idx_service_agreements_consumer
  ON service_agreements(consumer_organization_id, status);

CREATE INDEX IF NOT EXISTS idx_service_agreements_service
  ON service_agreements(service_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_agreements_one_active
  ON service_agreements(provider_organization_id, consumer_organization_id, service_id)
  WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS service_agreement_versions (
  agreement_version_id TEXT PRIMARY KEY,
  agreement_id TEXT NOT NULL REFERENCES service_agreements(agreement_id),
  version_number INTEGER NOT NULL,
  service_scope TEXT NOT NULL DEFAULT '',
  support_level TEXT NOT NULL DEFAULT '',
  service_expectations JSONB NOT NULL DEFAULT '{}'::jsonb,
  agreement_reference TEXT,
  change_reason TEXT,
  created_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT service_agreement_versions_unique UNIQUE (agreement_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_service_agreement_versions_agreement
  ON service_agreement_versions(agreement_id, version_number DESC);

INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT permission_id, role_id, permission_name
FROM (
  VALUES
    ('rp_phase6_service_agreement_view_super', 'role_super_admin', 'service.agreement.view'),
    ('rp_phase6_service_agreement_manage_super', 'role_super_admin', 'service.agreement.manage'),
    ('rp_phase6_service_agreement_approve_super', 'role_super_admin', 'service.agreement.approve'),
    ('rp_phase6_service_agreement_activate_super', 'role_super_admin', 'service.agreement.activate'),
    ('rp_phase6_service_agreement_view_shf', 'role_shf_admin', 'service.agreement.view'),
    ('rp_phase6_service_agreement_manage_shf', 'role_shf_admin', 'service.agreement.manage'),
    ('rp_phase6_service_agreement_approve_shf', 'role_shf_admin', 'service.agreement.approve'),
    ('rp_phase6_service_agreement_activate_shf', 'role_shf_admin', 'service.agreement.activate'),
    ('rp_phase6_service_agreement_view_shs', 'role_shs_admin', 'service.agreement.view'),
    ('rp_phase6_service_agreement_manage_shs', 'role_shs_admin', 'service.agreement.manage'),
    ('rp_phase6_service_agreement_approve_shs', 'role_shs_admin', 'service.agreement.approve'),
    ('rp_phase6_service_agreement_activate_shs', 'role_shs_admin', 'service.agreement.activate'),
    ('rp_phase6_service_agreement_view_org_admin', 'role_org_admin', 'service.agreement.view'),
    ('rp_phase6_service_agreement_view_partner_admin', 'role_partner_org_admin', 'service.agreement.view')
) AS requested(permission_id, role_id, permission_name)
WHERE EXISTS (SELECT 1 FROM roles WHERE roles.role_id = requested.role_id)
ON CONFLICT (role_permission_id) DO NOTHING;
