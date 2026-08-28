-- Exchange Funding Commitment authority. This is commitment state only;
-- transfer and settlement require separate future authority.

CREATE TABLE IF NOT EXISTS exchange_funding_commitments (
  commitment_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  committed_by_user_id TEXT REFERENCES users(user_id),
  recipient_organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  lifecycle_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (lifecycle_status IN ('draft', 'committed', 'cancelled')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  committed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  CHECK ((lifecycle_status = 'committed' AND committed_at IS NOT NULL)
      OR lifecycle_status <> 'committed'),
  CHECK ((lifecycle_status = 'cancelled' AND cancelled_at IS NOT NULL)
      OR lifecycle_status <> 'cancelled')
);

ALTER TABLE exchange_funding_commitments
  ADD COLUMN IF NOT EXISTS committed_by_user_id TEXT REFERENCES users(user_id);

CREATE INDEX IF NOT EXISTS idx_exchange_funding_commitments_scope
  ON exchange_funding_commitments (tenant_id, organization_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_funding_commitments_recipient
  ON exchange_funding_commitments (tenant_id, recipient_organization_id, updated_at DESC);
