
CREATE TABLE IF NOT EXISTS watchtower_alerts (
    alert_id TEXT PRIMARY KEY,
    alert_type TEXT NOT NULL,
    severity TEXT,
    entity_scope TEXT,
    description TEXT,
    explanation_json TEXT,
    status TEXT DEFAULT 'open',
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS watchtower_metrics (
    metric_id TEXT PRIMARY KEY,
    metric_name TEXT,
    metric_value REAL,
    threshold REAL,
    metric_status TEXT,
    captured_at TEXT
);

CREATE TABLE IF NOT EXISTS watchtower_incidents (
    incident_id TEXT PRIMARY KEY,
    incident_type TEXT,
    severity TEXT,
    affected_entities TEXT,
    resolution_status TEXT,
    opened_at TEXT,
    closed_at TEXT,
    notes_json TEXT
);

