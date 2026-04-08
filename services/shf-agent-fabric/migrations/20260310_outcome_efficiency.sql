
CREATE TABLE IF NOT EXISTS outcome_efficiency_snapshots (
    snapshot_id TEXT PRIMARY KEY,
    program_id TEXT,
    verified_outcomes INTEGER,
    capital_deployed REAL,
    cost_per_outcome REAL,
    efficiency_score REAL,
    created_at TEXT
);

