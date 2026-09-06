-- 086_funding_grants_restricted_funds.sql
-- Canonical funding/grant award state. This is not opportunity, evidence,
-- entitlement, onboarding, or accounting ledger state.

CREATE TABLE IF NOT EXISTS funding_grants (
  grant_id TEXT PRIMARY KEY,
  grant_number TEXT,
  external_reference TEXT,
  title TEXT NOT NULL,
  funder_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  recipient_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  reporting_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  status TEXT NOT NULL DEFAULT 'AWARDED',
  award_amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  start_date DATE NOT NULL,
  end_date DATE,
  purpose TEXT,
  restriction_type TEXT NOT NULL DEFAULT 'UNRESTRICTED',
  restricted_program_id TEXT REFERENCES programs(program_id),
  created_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT funding_grants_status_valid CHECK (status IN ('AWARDED','ACTIVE','SUSPENDED','CLOSED','CANCELLED')),
  CONSTRAINT funding_grants_restriction_valid CHECK (restriction_type IN (
    'UNRESTRICTED','PROGRAM_RESTRICTED','PURPOSE_RESTRICTED','TIME_RESTRICTED',
    'GEOGRAPHY_RESTRICTED','POPULATION_RESTRICTED','OTHER'
  )),
  CONSTRAINT funding_grants_currency_usd CHECK (currency = 'USD'),
  CONSTRAINT funding_grants_award_amount_nonnegative CHECK (award_amount >= 0),
  CONSTRAINT funding_grants_period_valid CHECK (end_date IS NULL OR start_date <= end_date),
  CONSTRAINT funding_grants_parties_distinct CHECK (funder_organization_id <> recipient_organization_id),
  CONSTRAINT funding_grants_program_restriction_requires_program CHECK (
    restriction_type <> 'PROGRAM_RESTRICTED' OR restricted_program_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_funding_grants_funder
  ON funding_grants(funder_organization_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_funding_grants_recipient
  ON funding_grants(recipient_organization_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_funding_grants_reporting
  ON funding_grants(reporting_organization_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_funding_grants_status
  ON funding_grants(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS grant_program_allocations (
  allocation_id TEXT PRIMARY KEY,
  grant_id TEXT NOT NULL REFERENCES funding_grants(grant_id),
  program_id TEXT NOT NULL REFERENCES programs(program_id),
  allocated_amount NUMERIC(14,2) NOT NULL,
  purpose TEXT,
  created_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT grant_program_allocations_amount_nonnegative CHECK (allocated_amount >= 0),
  CONSTRAINT grant_program_allocations_one_per_program UNIQUE (grant_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_grant_program_allocations_grant
  ON grant_program_allocations(grant_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_grant_program_allocations_program
  ON grant_program_allocations(program_id, created_at DESC);
