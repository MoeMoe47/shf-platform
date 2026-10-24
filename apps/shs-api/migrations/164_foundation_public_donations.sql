-- Anonymous public gifts are not institutional payment_transactions.
-- No organization, learner, credential, entitlement or tax authority is implied.
CREATE TABLE foundation_donations (
  donation_id UUID PRIMARY KEY,
  public_reference UUID NOT NULL UNIQUE,
  idempotency_key UUID NOT NULL UNIQUE,
  processor TEXT NOT NULL DEFAULT 'stripe' CHECK (processor = 'stripe'),
  livemode BOOLEAN NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents BETWEEN 100 AND 1000000),
  currency TEXT NOT NULL CHECK (currency = 'usd'),
  frequency TEXT NOT NULL CHECK (frequency IN ('ONE_TIME','MONTHLY')),
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED','CHECKOUT_CREATED','PENDING','COMPLETED','FAILED','CANCELED')),
  checkout_session_id TEXT UNIQUE,
  checkout_url TEXT,
  payment_reference TEXT UNIQUE,
  subscription_reference TEXT UNIQUE,
  recurring_status TEXT CHECK (recurring_status IN ('PENDING','ACTIVE','PAST_DUE','CANCELED')),
  recurring_event_created BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Verified processor evidence, recorded atomically with domain state.
-- Deliberately excludes raw payloads, card details, email and name.
CREATE TABLE foundation_donation_events (
  processor_event_id TEXT PRIMARY KEY,
  donation_id UUID NOT NULL REFERENCES foundation_donations(donation_id),
  event_type TEXT NOT NULL,
  processor_created BIGINT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX foundation_donation_events_donation ON foundation_donation_events(donation_id);

-- One row per confirmed collection. Monthly invoices are separate from the
-- subscription's lifecycle and from its initial Checkout session.
CREATE TABLE foundation_donation_collections (
  collection_reference TEXT PRIMARY KEY,
  donation_id UUID NOT NULL REFERENCES foundation_donations(donation_id),
  processor_event_id TEXT NOT NULL REFERENCES foundation_donation_events(processor_event_id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents BETWEEN 100 AND 1000000),
  currency TEXT NOT NULL CHECK (currency = 'usd'),
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
