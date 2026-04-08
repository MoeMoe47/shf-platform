
CREATE TABLE IF NOT EXISTS control_policies (
    policy_id TEXT PRIMARY KEY,
    policy_name TEXT,
    policy_type TEXT,
    policy_version INTEGER,
    policy_json TEXT,
    status TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS control_approvals (
    approval_id TEXT PRIMARY KEY,
    approval_type TEXT,
    entity_type TEXT,
    entity_id TEXT,
    requested_by TEXT,
    approved_by TEXT,
    approval_status TEXT,
    created_at TEXT,
    decided_at TEXT
);

CREATE TABLE IF NOT EXISTS control_decisions (
    decision_id TEXT PRIMARY KEY,
    decision_type TEXT,
    entity_type TEXT,
    entity_id TEXT,
    rule_version TEXT,
    decision_json TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS control_holds (
    hold_id TEXT PRIMARY KEY,
    hold_type TEXT,
    entity_type TEXT,
    entity_id TEXT,
    reason_json TEXT,
    status TEXT,
    created_at TEXT,
    released_at TEXT
);

