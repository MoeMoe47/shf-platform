CREATE TABLE IF NOT EXISTS pools (
    pool_id TEXT PRIMARY KEY,
    pool_code TEXT,
    name TEXT NOT NULL,
    committed_amount INTEGER NOT NULL,
    reserved_amount INTEGER NOT NULL DEFAULT 0,
    deployed_amount INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    funder_type TEXT,
    funder_id TEXT,
    strategy_type TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pools_code
ON pools(pool_code);
