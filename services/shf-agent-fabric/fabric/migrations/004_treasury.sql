CREATE TABLE IF NOT EXISTS treasury_accounts (
    account_id TEXT PRIMARY KEY,
    account_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS treasury_entries (
    entry_id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    direction TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    memo TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(account_id) REFERENCES treasury_accounts(account_id)
);

CREATE INDEX IF NOT EXISTS idx_treasury_account_entries
ON treasury_entries(account_id);
