CREATE TABLE IF NOT EXISTS aal_signal_weights (
    event_type TEXT PRIMARY KEY,
    weight REAL NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS aal_anomaly_signals (
    anomaly_id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    anomaly_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    detected_at TEXT NOT NULL,
    explanation_json TEXT,
    status TEXT NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS aal_learning_feedback (
    feedback_id TEXT PRIMARY KEY,
    entity_type TEXT,
    entity_id TEXT,
    feedback_type TEXT NOT NULL,
    feedback_value REAL,
    notes_json TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS aal_recompute_jobs (
    job_name TEXT PRIMARY KEY,
    last_status TEXT NOT NULL,
    processed_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO aal_signal_weights (event_type, weight, updated_at) VALUES
('participant.updated', 1.00, CURRENT_TIMESTAMP),
('participant.created', 1.10, CURRENT_TIMESTAMP),
('program.updated', 1.00, CURRENT_TIMESTAMP),
('outcome.submitted', 1.40, CURRENT_TIMESTAMP),
('outcome.verified', 1.75, CURRENT_TIMESTAMP),
('operator.action', 0.90, CURRENT_TIMESTAMP),
('intervention.created', 1.20, CURRENT_TIMESTAMP);
