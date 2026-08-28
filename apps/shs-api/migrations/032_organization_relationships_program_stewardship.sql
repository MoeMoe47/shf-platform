-- 032_organization_relationships_program_stewardship.sql
-- Additive Phase 2 modeling only. Do not run against production without the
-- approved migration/deployment process.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS organization_relationships (
  relationship_id TEXT PRIMARY KEY,
  source_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  target_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  relationship_type TEXT NOT NULL,
  status TEXT NOT NULL,
  effective_from TIMESTAMP NOT NULL,
  effective_to TIMESTAMP,
  created_by TEXT REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by TEXT REFERENCES users(user_id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT organization_relationship_known_type CHECK (
    relationship_type IN ('INCUBATES', 'NETWORK_MEMBER_OF', 'OPERATES_FOR', 'SHARED_SERVICES_PROVIDER_FOR')
  ),
  CONSTRAINT organization_relationship_known_status CHECK (
    status IN ('PROPOSED', 'ACTIVE', 'SUSPENDED', 'ENDED')
  ),
  CONSTRAINT organization_relationship_effective_range CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  )
);

CREATE INDEX IF NOT EXISTS idx_organization_relationships_source
  ON organization_relationships(source_organization_id, relationship_type, status);

CREATE INDEX IF NOT EXISTS idx_organization_relationships_target
  ON organization_relationships(target_organization_id, relationship_type, status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM organization_relationships a
    JOIN organization_relationships b
      ON a.relationship_id < b.relationship_id
     AND a.source_organization_id = b.source_organization_id
     AND a.target_organization_id = b.target_organization_id
     AND a.relationship_type = b.relationship_type
     AND a.status = 'ACTIVE'
     AND b.status = 'ACTIVE'
     AND tsrange(a.effective_from, COALESCE(a.effective_to, 'infinity'::timestamp), '[]') &&
         tsrange(b.effective_from, COALESCE(b.effective_to, 'infinity'::timestamp), '[]')
  ) THEN
    RAISE EXCEPTION 'overlapping active organization relationships must be resolved before migration 032 can complete';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organization_relationship_no_active_overlap'
  ) THEN
    ALTER TABLE organization_relationships
      ADD CONSTRAINT organization_relationship_no_active_overlap
      EXCLUDE USING gist (
        source_organization_id WITH =,
        target_organization_id WITH =,
        relationship_type WITH =,
        tsrange(effective_from, COALESCE(effective_to, 'infinity'::timestamp), '[]') WITH &&
      )
      WHERE (status = 'ACTIVE');
  END IF;
END $$;

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS program_classification TEXT,
  ADD COLUMN IF NOT EXISTS owner_organization_id TEXT REFERENCES organizations(organization_id),
  ADD COLUMN IF NOT EXISTS operator_organization_id TEXT REFERENCES organizations(organization_id),
  ADD COLUMN IF NOT EXISTS accountable_organization_id TEXT REFERENCES organizations(organization_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'programs_known_classification'
  ) THEN
    ALTER TABLE programs
      ADD CONSTRAINT programs_known_classification CHECK (
        program_classification IS NULL OR program_classification IN ('SHF_OWNED', 'SHF_INCUBATED', 'INDEPENDENT_NETWORK')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_programs_owner_organization
  ON programs(owner_organization_id);

CREATE INDEX IF NOT EXISTS idx_programs_operator_organization
  ON programs(operator_organization_id);

CREATE INDEX IF NOT EXISTS idx_programs_accountable_organization
  ON programs(accountable_organization_id);

INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT permission_id, role_id, permission_name
FROM (
  VALUES
    ('rp_phase2_org_relationship_view_org_admin', 'role_org_admin', 'organization.relationship.view'),
    ('rp_phase2_org_relationship_manage_org_admin', 'role_org_admin', 'organization.relationship.manage')
) AS requested(permission_id, role_id, permission_name)
WHERE EXISTS (SELECT 1 FROM roles WHERE roles.role_id = requested.role_id)
ON CONFLICT (role_permission_id) DO NOTHING;
