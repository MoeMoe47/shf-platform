-- 084_service_catalog_entitlements.sql
-- SHF Hybrid Roadmap Phase 3: canonical organization-level service catalog
-- and organization service entitlements. This is additive and reuses the
-- existing organization, relationship, permission, and audit models.

CREATE TABLE IF NOT EXISTS service_catalog (
  service_id TEXT PRIMARY KEY,
  service_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  audience TEXT NOT NULL DEFAULT 'NETWORK_ORGANIZATION',
  requires_relationship_type TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT service_catalog_key_unique UNIQUE (service_key),
  CONSTRAINT service_catalog_known_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'RETIRED')),
  CONSTRAINT service_catalog_known_category CHECK (category IN (
    'CURRICULUM',
    'CAREER_WORKFORCE',
    'LIVE_LEARNING',
    'PROJECT_STUDIO',
    'REPORTING',
    'TRUTH_EVIDENCE',
    'SHARED_TECHNOLOGY',
    'COMMUNITY_FACILITIES'
  )),
  CONSTRAINT service_catalog_known_relationship CHECK (
    requires_relationship_type IS NULL OR requires_relationship_type IN (
      'INCUBATES',
      'NETWORK_MEMBER_OF',
      'OPERATES_FOR',
      'SHARED_SERVICES_PROVIDER_FOR'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_service_catalog_provider
  ON service_catalog(provider_organization_id, status);

CREATE TABLE IF NOT EXISTS organization_service_entitlements (
  entitlement_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  service_id TEXT NOT NULL REFERENCES service_catalog(service_id),
  status TEXT NOT NULL,
  granted_by_user_id TEXT REFERENCES users(user_id),
  granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMP,
  suspended_by_user_id TEXT REFERENCES users(user_id),
  suspended_at TIMESTAMP,
  revoked_by_user_id TEXT REFERENCES users(user_id),
  revoked_at TIMESTAMP,
  reason TEXT,
  source_relationship_id TEXT REFERENCES organization_relationships(relationship_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT organization_service_entitlement_known_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED')),
  CONSTRAINT organization_service_entitlement_effective_range CHECK (
    effective_until IS NULL OR effective_until >= effective_from
  )
);

CREATE INDEX IF NOT EXISTS idx_org_service_entitlements_org
  ON organization_service_entitlements(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_org_service_entitlements_service
  ON organization_service_entitlements(service_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_service_entitlements_one_active
  ON organization_service_entitlements(organization_id, service_id)
  WHERE status = 'ACTIVE';

INSERT INTO service_catalog (
  service_id, service_key, name, description, category, status,
  provider_organization_id, audience, requires_relationship_type
)
SELECT *
FROM (VALUES
  ('svc_curriculum', 'curriculum', 'Curriculum', 'Curriculum authoring, catalog, release, and learning content infrastructure.', 'CURRICULUM', 'ACTIVE', 'org_shf_001', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF'),
  ('svc_reporting', 'reporting', 'Reporting', 'Governed report drafting, distribution, publication, and public snapshot infrastructure.', 'REPORTING', 'ACTIVE', 'org_shf_001', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF'),
  ('svc_project_studio', 'project_studio', 'Project Studio', 'Student project workspace, review, QA, delivery, and Studio collaboration infrastructure.', 'PROJECT_STUDIO', 'ACTIVE', 'org_shf_001', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF'),
  ('svc_truth_evidence', 'truth_evidence', 'Truth / Evidence', 'Verified evidence and truth spine infrastructure exposed through existing evidence and truth domains.', 'TRUTH_EVIDENCE', 'ACTIVE', 'org_shf_001', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF'),
  ('svc_career_workforce', 'career_workforce', 'Career / Workforce', 'Career events, opportunities, and workforce outcome infrastructure.', 'CAREER_WORKFORCE', 'ACTIVE', 'org_shf_001', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF')
) AS seed(service_id, service_key, name, description, category, status, provider_organization_id, audience, requires_relationship_type)
WHERE EXISTS (SELECT 1 FROM organizations WHERE organization_id = seed.provider_organization_id)
ON CONFLICT (service_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  provider_organization_id = EXCLUDED.provider_organization_id,
  audience = EXCLUDED.audience,
  requires_relationship_type = EXCLUDED.requires_relationship_type,
  updated_at = NOW();

INSERT INTO organization_service_entitlements (
  entitlement_id, organization_id, service_id, status, granted_by_user_id,
  reason, source_relationship_id
)
SELECT
  'ent_shf_' || service_key,
  provider_organization_id,
  service_id,
  'ACTIVE',
  NULL,
  'SHF compatibility bootstrap: the provider organization may consume its canonical services.',
  NULL
FROM service_catalog
WHERE provider_organization_id = 'org_shf_001'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT permission_id, role_id, permission_name
FROM (
  VALUES
    ('rp_phase3_org_service_entitlement_view_super', 'role_super_admin', 'organization.service_entitlement.view'),
    ('rp_phase3_org_service_entitlement_manage_super', 'role_super_admin', 'organization.service_entitlement.manage'),
    ('rp_phase3_org_service_entitlement_view_shf', 'role_shf_admin', 'organization.service_entitlement.view'),
    ('rp_phase3_org_service_entitlement_manage_shf', 'role_shf_admin', 'organization.service_entitlement.manage'),
    ('rp_phase3_org_service_entitlement_view_shs', 'role_shs_admin', 'organization.service_entitlement.view'),
    ('rp_phase3_org_service_entitlement_manage_shs', 'role_shs_admin', 'organization.service_entitlement.manage'),
    ('rp_phase3_org_service_entitlement_view_org_admin', 'role_org_admin', 'organization.service_entitlement.view'),
    ('rp_phase3_org_service_entitlement_view_partner_admin', 'role_partner_org_admin', 'organization.service_entitlement.view')
) AS requested(permission_id, role_id, permission_name)
WHERE EXISTS (SELECT 1 FROM roles WHERE roles.role_id = requested.role_id)
ON CONFLICT (role_permission_id) DO NOTHING;
