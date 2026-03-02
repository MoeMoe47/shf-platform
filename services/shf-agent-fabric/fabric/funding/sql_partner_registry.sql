CREATE TABLE IF NOT EXISTS funding_partners (
    partner_id TEXT PRIMARY KEY,
    partner_type TEXT,
    programs JSONB,
    allowed_rulesets JSONB,
    integration_token TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funding_webhooks (
    id SERIAL PRIMARY KEY,
    partner_id TEXT REFERENCES funding_partners(partner_id),
    url TEXT,
    events JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funding_outcome_verifications (
    id SERIAL PRIMARY KEY,
    partner_id TEXT,
    ruleset_id TEXT,
    participant_id TEXT,
    event TEXT,
    verification_source TEXT,
    verified_at TIMESTAMP DEFAULT NOW()
);
