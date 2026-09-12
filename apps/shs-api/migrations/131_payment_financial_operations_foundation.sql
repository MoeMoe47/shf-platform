-- PR-3: provider-neutral payment records only. No raw card data is stored.
CREATE TABLE IF NOT EXISTS payment_transactions (
  payment_id TEXT PRIMARY KEY,
  legal_entity TEXT NOT NULL CHECK (legal_entity IN ('SHS', 'SHF')),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  payer_reference TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('COMMERCIAL', 'DONATION', 'PROGRAM')),
  product_reference TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency CHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  provider_key TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('SANDBOX', 'PRODUCTION')),
  state TEXT NOT NULL CHECK (state IN ('CREATED','PENDING','REQUIRES_ACTION','SUCCEEDED','FAILED','CANCELED','PARTIALLY_REFUNDED','REFUNDED','DISPUTED')),
  idempotency_key TEXT NOT NULL,
  reconciliation_state TEXT NOT NULL DEFAULT 'UNMATCHED' CHECK (reconciliation_state IN ('UNMATCHED','MATCHED','MISMATCH','MISSING_INTERNAL','MISSING_EXTERNAL','REQUIRES_REVIEW')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, idempotency_key),
  UNIQUE (provider_key, provider_payment_id)
);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_scope ON payment_transactions (organization_id, legal_entity, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  provider_key TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  payment_id TEXT REFERENCES payment_transactions(payment_id),
  environment TEXT NOT NULL CHECK (environment IN ('SANDBOX','PRODUCTION')),
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider_key, provider_event_id)
);

CREATE TABLE IF NOT EXISTS payment_refunds (
  refund_id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payment_transactions(payment_id),
  provider_key TEXT NOT NULL,
  provider_refund_id TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  state TEXT NOT NULL CHECK (state IN ('PENDING','SUCCEEDED','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_key, provider_refund_id)
);

CREATE TABLE IF NOT EXISTS payment_disputes (
  dispute_id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payment_transactions(payment_id),
  provider_key TEXT NOT NULL,
  provider_dispute_id TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  state TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  UNIQUE (provider_key, provider_dispute_id)
);
