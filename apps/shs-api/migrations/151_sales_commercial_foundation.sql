-- 151_sales_commercial_foundation.sql
-- SALES-PROD-3: durable Sales-owned workflow records.
-- Sales references canonical Organizations and external authorities by ID;
-- it does not create customer, product, funding, evidence, contract, or
-- employer incentive authorities.

CREATE TABLE IF NOT EXISTS sales_relationships (
  relationship_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  account_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  relationship_type TEXT NOT NULL,
  relationship_status TEXT NOT NULL,
  owner_user_id TEXT REFERENCES users(user_id),
  source TEXT,
  notes TEXT,
  created_by_user_id TEXT REFERENCES users(user_id),
  updated_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT sales_relationship_tenant_matches_org CHECK (tenant_id = ('tenant:' || organization_id)),
  CONSTRAINT sales_relationship_known_type CHECK (relationship_type IN ('BUYER', 'INFLUENCER', 'PARTNER', 'FUNDER', 'DELIVERY_SPONSOR')),
  CONSTRAINT sales_relationship_known_status CHECK (relationship_status IN ('PROSPECT', 'ACTIVE', 'DORMANT', 'PARTNER', 'CLOSED'))
);

CREATE INDEX IF NOT EXISTS sales_relationships_scope_idx
  ON sales_relationships(tenant_id, organization_id, account_organization_id, relationship_status)
  WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS sales_discovery_records (
  discovery_record_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  account_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  relationship_id TEXT REFERENCES sales_relationships(relationship_id),
  discovery_status TEXT NOT NULL,
  business_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  pain_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_processes JSONB NOT NULL DEFAULT '[]'::jsonb,
  constraints JSONB NOT NULL DEFAULT '[]'::jsonb,
  timeline TEXT,
  budget_context TEXT,
  decision_process TEXT,
  stakeholder_context TEXT,
  notes TEXT,
  created_by_user_id TEXT REFERENCES users(user_id),
  updated_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT sales_discovery_tenant_matches_org CHECK (tenant_id = ('tenant:' || organization_id)),
  CONSTRAINT sales_discovery_known_status CHECK (discovery_status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'STALE'))
);

CREATE INDEX IF NOT EXISTS sales_discovery_scope_idx
  ON sales_discovery_records(tenant_id, organization_id, account_organization_id, discovery_status)
  WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS sales_needs (
  need_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  account_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  discovery_record_id TEXT REFERENCES sales_discovery_records(discovery_record_id),
  need_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  source TEXT,
  created_by_user_id TEXT REFERENCES users(user_id),
  updated_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT sales_needs_tenant_matches_org CHECK (tenant_id = ('tenant:' || organization_id)),
  CONSTRAINT sales_needs_known_type CHECK (need_type IN ('BUSINESS', 'TECHNICAL', 'FUNDING', 'WORKFORCE', 'OPERATIONS', 'OTHER')),
  CONSTRAINT sales_needs_known_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  CONSTRAINT sales_needs_known_status CHECK (status IN ('OPEN', 'VALIDATED', 'DEFERRED', 'RESOLVED', 'CLOSED'))
);

CREATE INDEX IF NOT EXISTS sales_needs_scope_idx
  ON sales_needs(tenant_id, organization_id, account_organization_id, status)
  WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS sales_opportunities (
  opportunity_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  account_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  relationship_id TEXT REFERENCES sales_relationships(relationship_id),
  discovery_record_id TEXT REFERENCES sales_discovery_records(discovery_record_id),
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  name TEXT NOT NULL,
  estimated_value NUMERIC(14,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  target_close_date DATE,
  owner_user_id TEXT REFERENCES users(user_id),
  primary_need_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  employer_incentive_assessment_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by_user_id TEXT REFERENCES users(user_id),
  updated_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP,
  archived_at TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT sales_opportunities_tenant_matches_org CHECK (tenant_id = ('tenant:' || organization_id)),
  CONSTRAINT sales_opportunities_known_stage CHECK (stage IN ('TARGET', 'RELATIONSHIP', 'DISCOVERY', 'SOLUTION', 'FUNDING', 'PROPOSAL', 'CONTRACT', 'WON', 'LOST')),
  CONSTRAINT sales_opportunities_known_status CHECK (status IN ('OPEN', 'PAUSED', 'WON', 'LOST', 'ARCHIVED')),
  CONSTRAINT sales_opportunities_value_nonnegative CHECK (estimated_value IS NULL OR estimated_value >= 0),
  CONSTRAINT sales_opportunities_currency_known CHECK (currency IN ('USD'))
);

CREATE INDEX IF NOT EXISTS sales_opportunities_scope_idx
  ON sales_opportunities(tenant_id, organization_id, account_organization_id, status, stage)
  WHERE archived_at IS NULL;

INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT permission_id, role_id, permission_name
FROM (
  VALUES
    ('rp_sales_read_super', 'role_super_admin', 'sales.read'),
    ('rp_sales_write_super', 'role_super_admin', 'sales.write'),
    ('rp_sales_admin_super', 'role_super_admin', 'sales.admin'),
    ('rp_sales_read_shf', 'role_shf_admin', 'sales.read'),
    ('rp_sales_write_shf', 'role_shf_admin', 'sales.write'),
    ('rp_sales_admin_shf', 'role_shf_admin', 'sales.admin'),
    ('rp_sales_read_shs', 'role_shs_admin', 'sales.read'),
    ('rp_sales_write_shs', 'role_shs_admin', 'sales.write'),
    ('rp_sales_admin_shs', 'role_shs_admin', 'sales.admin'),
    ('rp_sales_read_org_admin', 'role_org_admin', 'sales.read'),
    ('rp_sales_write_org_admin', 'role_org_admin', 'sales.write')
) AS requested(permission_id, role_id, permission_name)
WHERE EXISTS (SELECT 1 FROM roles WHERE roles.role_id = requested.role_id)
ON CONFLICT (role_permission_id) DO NOTHING;
