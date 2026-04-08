CREATE TABLE IF NOT EXISTS aal_event_log (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    source_system TEXT NOT NULL,
    source_record_id TEXT,
    entity_type TEXT,
    entity_id TEXT,
    occurred_at TEXT NOT NULL,
    received_at TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    schema_version TEXT,
    ingest_status TEXT NOT NULL DEFAULT 'accepted'
);

CREATE TABLE IF NOT EXISTS aal_program_health (
    snapshot_id TEXT PRIMARY KEY,
    program_id TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    enrollment_count INTEGER NOT NULL DEFAULT 0,
    completion_count INTEGER NOT NULL DEFAULT 0,
    verified_outcome_count INTEGER NOT NULL DEFAULT 0,
    completion_rate REAL,
    verified_outcome_rate REAL,
    cost_per_outcome REAL,
    program_health_score REAL,
    anomaly_flag INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_aal_program_health_program_date
ON aal_program_health(program_id, snapshot_date);

CREATE TABLE IF NOT EXISTS aal_participant_risk (
    risk_id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    dropout_risk_score REAL,
    completion_probability REAL,
    intervention_need_score REAL,
    risk_band TEXT,
    explanation_json TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_aal_participant_risk_participant_date
ON aal_participant_risk(participant_id, snapshot_date);
