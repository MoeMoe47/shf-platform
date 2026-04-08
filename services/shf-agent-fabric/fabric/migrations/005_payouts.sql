CREATE TABLE IF NOT EXISTS payout_intents (
    intent_id TEXT PRIMARY KEY,
    credit_id TEXT NOT NULL,
    destination TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    state TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payout_credit
ON payout_intents(credit_id);
