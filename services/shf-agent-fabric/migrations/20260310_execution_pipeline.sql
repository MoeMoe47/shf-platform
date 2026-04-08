
CREATE TABLE IF NOT EXISTS execution_actions (
    action_id TEXT PRIMARY KEY,
    action_type TEXT,
    entity_type TEXT,
    entity_id TEXT,
    payload_json TEXT,
    status TEXT,
    created_at TEXT,
    executed_at TEXT
);

CREATE TABLE IF NOT EXISTS execution_rules (
    rule_id TEXT PRIMARY KEY,
    rule_name TEXT,
    trigger_event TEXT,
    action_type TEXT,
    rule_json TEXT,
    rule_version INTEGER,
    status TEXT,
    created_at TEXT
);

