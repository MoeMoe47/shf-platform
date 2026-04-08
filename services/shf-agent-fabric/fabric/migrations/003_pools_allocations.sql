CREATE TABLE IF NOT EXISTS pool_allocations (
    allocation_id TEXT PRIMARY KEY,
    pool_id TEXT NOT NULL,
    credit_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(pool_id) REFERENCES pools(pool_id)
);

CREATE INDEX IF NOT EXISTS idx_pool_allocations_pool
ON pool_allocations(pool_id);
