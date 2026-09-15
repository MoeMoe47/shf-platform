-- MET-9: Student Market + Treasury Integration.
-- Market-owned commerce workflow only. This migration deliberately does not
-- create SHF Credit balance or ledger tables; settlement truth is referenced
-- through treasury_* refs owned by the Treasury boundary.

CREATE TABLE IF NOT EXISTS market_listings (
  listing_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  seller_type TEXT NOT NULL CHECK (seller_type IN ('STUDENT','TEAM','PROGRAM','ORGANIZATION','SYSTEM')),
  seller_ref TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 500),
  description TEXT,
  listing_type TEXT NOT NULL CHECK (listing_type IN (
    'DIGITAL_PRODUCT','SERVICE','PROJECT_RESOURCE','PROGRAM_RESOURCE','ARCADE_RESOURCE',
    'EVENT_ITEM','COSMETIC_ITEM','CITY_COLLECTIBLE','EDUCATIONAL_RESOURCE','SIMULATED_GOOD'
  )),
  category TEXT NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('FIXED','FREE','PROGRAM_DEFINED','REWARD_REDEMPTION')),
  price_amount INTEGER CHECK (price_amount IS NULL OR price_amount >= 0),
  currency_type TEXT NOT NULL CHECK (currency_type IN ('SHF_CREDITS','PROGRAM_POINTS','NONE')),
  quantity_mode TEXT NOT NULL CHECK (quantity_mode IN ('UNLIMITED','LIMITED')),
  quantity_available INTEGER CHECK (quantity_available IS NULL OR quantity_available >= 0),
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('DIGITAL_DELIVERY','IN_PLATFORM_SERVICE','PROJECT_HANDOFF','EVENT_ACCESS','PROGRAM_RESOURCE','SIMULATED_GOOD')),
  visibility TEXT NOT NULL CHECK (visibility IN ('PRIVATE','PROGRAM','ORGANIZATION','NETWORK','CITY')),
  district_id TEXT,
  facility_id TEXT,
  program_id TEXT REFERENCES programs(program_id),
  mission_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','PENDING_REVIEW','APPROVED','PUBLISHED','PAUSED','REJECTED','SUSPENDED','ARCHIVED','SOLD_OUT')),
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  rejection_reason TEXT,
  moderation_reason TEXT,
  approved_by_user_id TEXT REFERENCES users(user_id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  CHECK (tenant_id = 'tenant:' || organization_id),
  CHECK ((quantity_mode = 'UNLIMITED' AND quantity_available IS NULL) OR (quantity_mode = 'LIMITED' AND quantity_available IS NOT NULL)),
  CHECK ((price_type = 'FREE' AND currency_type = 'NONE' AND COALESCE(price_amount, 0) = 0) OR price_type <> 'FREE')
);
CREATE INDEX IF NOT EXISTS market_listing_scope_idx ON market_listings (organization_id, tenant_id, status, visibility);
CREATE INDEX IF NOT EXISTS market_listing_seller_idx ON market_listings (organization_id, seller_type, seller_ref);

CREATE TABLE IF NOT EXISTS market_listing_reviews (
  review_id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES market_listings(listing_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  reviewer_user_id TEXT NOT NULL REFERENCES users(user_id),
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED','REJECTED','SUSPENDED')),
  reason TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE TABLE IF NOT EXISTS market_orders (
  order_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  listing_id TEXT NOT NULL REFERENCES market_listings(listing_id),
  buyer_user_id TEXT NOT NULL REFERENCES users(user_id),
  buyer_team_id TEXT,
  seller_type TEXT NOT NULL,
  seller_ref TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_snapshot INTEGER NOT NULL CHECK (unit_price_snapshot >= 0),
  total_price_snapshot INTEGER NOT NULL CHECK (total_price_snapshot >= 0),
  currency_type TEXT NOT NULL CHECK (currency_type IN ('SHF_CREDITS','PROGRAM_POINTS','NONE')),
  listing_snapshot_json JSONB NOT NULL,
  buyer_snapshot_json JSONB NOT NULL,
  fulfillment_terms_snapshot_json JSONB NOT NULL,
  treasury_payment_intent_ref TEXT NOT NULL,
  treasury_transaction_ref TEXT,
  status TEXT NOT NULL CHECK (status IN (
    'PENDING_PAYMENT','PAID','ACCEPTED','IN_FULFILLMENT','FULFILLED','CANCEL_REQUESTED',
    'CANCELLED','REFUND_REQUESTED','REFUNDED','DECLINED','EXPIRED'
  )),
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS market_order_payment_intent_idx ON market_orders (organization_id, treasury_payment_intent_ref);
CREATE INDEX IF NOT EXISTS market_order_scope_idx ON market_orders (organization_id, tenant_id, buyer_user_id, status);
CREATE INDEX IF NOT EXISTS market_order_listing_idx ON market_orders (organization_id, listing_id);

CREATE TABLE IF NOT EXISTS market_fulfillments (
  fulfillment_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES market_orders(order_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  fulfilled_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  fulfillment_type TEXT NOT NULL,
  fulfillment_ref TEXT,
  notes TEXT,
  fulfilled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE TABLE IF NOT EXISTS market_refund_requests (
  refund_request_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES market_orders(order_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  requested_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('REQUESTED','APPROVED','REJECTED','SETTLED')),
  reviewer_user_id TEXT REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ,
  treasury_refund_ref TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS market_refund_one_active_idx
  ON market_refund_requests (order_id)
  WHERE status IN ('REQUESTED','APPROVED','SETTLED');
