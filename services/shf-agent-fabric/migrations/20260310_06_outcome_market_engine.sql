
CREATE TABLE IF NOT EXISTS outcome_funding_pools (
    pool_id TEXT PRIMARY KEY,
    pool_name TEXT,
    total_capital REAL,
    available_capital REAL,
    target_outcome TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS outcome_contracts (
    contract_id TEXT PRIMARY KEY,
    program_id TEXT,
    pool_id TEXT,
    outcome_type TEXT,
    payment_amount REAL,
    contract_status TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS verified_outcomes (
    outcome_id TEXT PRIMARY KEY,
    participant_id TEXT,
    program_id TEXT,
    outcome_type TEXT,
    verification_status TEXT,
    verified_at TEXT,
    evidence_hash TEXT
);

CREATE TABLE IF NOT EXISTS outcome_payments (
    payment_id TEXT PRIMARY KEY,
    outcome_id TEXT,
    contract_id TEXT,
    payment_amount REAL,
    payment_status TEXT,
    released_at TEXT
);

CREATE TABLE IF NOT EXISTS outcome_market_metrics (
    metric_id TEXT PRIMARY KEY,
    program_id TEXT,
    cost_per_outcome REAL,
    success_rate REAL,
    risk_adjusted_score REAL,
    captured_at TEXT
);

