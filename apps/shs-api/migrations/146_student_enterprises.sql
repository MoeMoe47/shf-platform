-- MET-12: Student Enterprise System.
-- Durable, educational/simulated enterprise model. Reuses canonical Studio
-- team authority (studio_teams/studio_team_members, 082) instead of a
-- separate membership table. Does not create a competing team, Market
-- listing/order, Opportunity bid/award, Treasury ledger, evidence, or
-- Work Passport authority — see docs/metaverse/MET-12_STUDENT_ENTERPRISE_SYSTEM.md.

CREATE TABLE IF NOT EXISTS student_enterprises (
  enterprise_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  studio_team_id TEXT NOT NULL REFERENCES studio_teams(studio_team_id),
  program_id TEXT REFERENCES programs(program_id),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 2000),
  enterprise_category TEXT NOT NULL CHECK (enterprise_category IN (
    'PRODUCT_DESIGN','DIGITAL_SERVICE','CREATIVE_STUDIO','COMMUNITY_SERVICE','TECH_PROTOTYPE','EVENT_SHOWCASE','OTHER_EDUCATIONAL'
  )),
  operating_mode TEXT NOT NULL DEFAULT 'SIMULATED' CHECK (operating_mode IN (
    'SIMULATED','EDUCATIONAL','PROGRAM_SANDBOX','EXTERNAL_REFERENCE_ONLY'
  )),
  lifecycle_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (lifecycle_status IN (
    'DRAFT','PENDING_APPROVAL','ACTIVE','PAUSED','SUSPENDED','CLOSED','ARCHIVED'
  )),
  visibility TEXT NOT NULL DEFAULT 'PROGRAM' CHECK (visibility IN ('PRIVATE','PROGRAM','ORGANIZATION','NETWORK','CITY')),
  legal_boundary_ack_version INTEGER NOT NULL DEFAULT 0,
  legal_boundary_ack_at TIMESTAMPTZ,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by_user_id TEXT REFERENCES users(user_id),
  returned_at TIMESTAMPTZ,
  returned_by_user_id TEXT REFERENCES users(user_id),
  return_reason TEXT,
  paused_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspended_by_user_id TEXT REFERENCES users(user_id),
  suspended_reason TEXT,
  closed_at TIMESTAMPTZ,
  closed_by_user_id TEXT REFERENCES users(user_id),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (studio_team_id)
);
CREATE INDEX IF NOT EXISTS student_enterprise_scope_idx ON student_enterprises (organization_id, tenant_id, lifecycle_status);
CREATE INDEX IF NOT EXISTS student_enterprise_program_idx ON student_enterprises (organization_id, program_id) WHERE program_id IS NOT NULL;

-- Governed roles are additive to canonical studio_team_members (role LEAD/
-- MEMBER); this table adds enterprise-specific authority (e.g. who may
-- publish a Market listing or manage the catalog) without duplicating who
-- is on the team.
CREATE TABLE IF NOT EXISTS student_enterprise_roles (
  enterprise_role_id TEXT PRIMARY KEY,
  enterprise_id TEXT NOT NULL REFERENCES student_enterprises(enterprise_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  enterprise_role TEXT NOT NULL CHECK (enterprise_role IN ('FOUNDER','OPERATIONS_LEAD','CATALOG_MANAGER','MEMBER')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED')),
  granted_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (enterprise_id, user_id)
);
CREATE INDEX IF NOT EXISTS student_enterprise_role_scope_idx ON student_enterprise_roles (organization_id, tenant_id, enterprise_id);

CREATE TABLE IF NOT EXISTS student_enterprise_catalog_items (
  catalog_item_id TEXT PRIMARY KEY,
  enterprise_id TEXT NOT NULL REFERENCES student_enterprises(enterprise_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 500),
  category TEXT NOT NULL CHECK (category IN ('PRODUCT','SERVICE','SHOWCASE_ITEM','COMMUNITY_OFFERING')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
  market_listing_id TEXT REFERENCES market_listings(listing_id),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE INDEX IF NOT EXISTS student_enterprise_catalog_scope_idx ON student_enterprise_catalog_items (organization_id, tenant_id, enterprise_id);

-- Source-backed operational history. No hidden reputation score or
-- leaderboard is derived from this table (MET-12 build brief §L).
CREATE TABLE IF NOT EXISTS student_enterprise_history (
  history_id TEXT PRIMARY KEY,
  enterprise_id TEXT NOT NULL REFERENCES student_enterprises(enterprise_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'FORMED','SUBMITTED_FOR_APPROVAL','APPROVED','RETURNED','PAUSED','RESUMED','SUSPENDED','CLOSED','ARCHIVED',
    'CATALOG_ITEM_ADDED','MARKET_LISTING_PUBLISHED','OPPORTUNITY_BID_SUBMITTED','OPPORTUNITY_AWARDED',
    'PROJECT_STARTED','PROJECT_SUBMITTED','PROJECT_ACCEPTED','ORDER_FULFILLED','SHOWCASE_COMPLETED'
  )),
  actor_user_id TEXT NOT NULL REFERENCES users(user_id),
  detail_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE INDEX IF NOT EXISTS student_enterprise_history_scope_idx ON student_enterprise_history (organization_id, tenant_id, enterprise_id, occurred_at DESC);

-- MET-9 Market integration: the seller-type guard in market-policy.ts
-- previously fail-closed every STUDENT_ENTERPRISE seller (SELLER_TYPE_P1).
-- This adds the value to the durable CHECK constraint; market-policy.ts's
-- deriveSeller() still requires an ACTIVE enterprise and an authorized
-- enterprise role before it will ever return this seller type.
ALTER TABLE market_listings DROP CONSTRAINT IF EXISTS market_listings_seller_type_check;
ALTER TABLE market_listings ADD CONSTRAINT market_listings_seller_type_check
  CHECK (seller_type IN ('STUDENT','TEAM','PROGRAM','ORGANIZATION','SYSTEM','STUDENT_ENTERPRISE'));
