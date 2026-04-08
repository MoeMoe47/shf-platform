CREATE TABLE IF NOT EXISTS governance_disputes (
    dispute_id TEXT PRIMARY KEY,
    reference_type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    state TEXT NOT NULL,
    opened_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS governance_overrides (
    override_id TEXT PRIMARY KEY,
    reference_type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    override_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS governance_approvals (
    approval_id TEXT PRIMARY KEY,
    reference_type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    approver TEXT NOT NULL,
    decision TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL
);
