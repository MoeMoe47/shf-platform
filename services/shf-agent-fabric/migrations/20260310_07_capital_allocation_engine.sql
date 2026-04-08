
CREATE TABLE IF NOT EXISTS capital_allocations (
    allocation_id TEXT PRIMARY KEY,
    pool_id TEXT,
    program_id TEXT,
    allocated_capital REAL,
    allocation_status TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS capital_reallocation_recommendations (
    recommendation_id TEXT PRIMARY KEY,
    pool_id TEXT,
    program_id TEXT,
    current_allocation REAL,
    suggested_allocation REAL,
    confidence_score REAL,
    reason_json TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS capital_allocation_history (
    history_id TEXT PRIMARY KEY,
    pool_id TEXT,
    program_id TEXT,
    prior_allocation REAL,
    new_allocation REAL,
    change_reason TEXT,
    changed_at TEXT
);

CREATE TABLE IF NOT EXISTS capital_pool_performance (
    metric_id TEXT PRIMARY KEY,
    pool_id TEXT,
    success_rate REAL,
    cost_per_outcome REAL,
    risk_score REAL,
    capital_efficiency REAL,
    captured_at TEXT
);

