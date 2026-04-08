
CREATE TABLE IF NOT EXISTS aal_participant_trajectory (
    trajectory_id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    prior_risk_score REAL,
    current_risk_score REAL,
    delta_score REAL,
    direction TEXT,
    momentum_band TEXT
);

CREATE TABLE IF NOT EXISTS aal_program_trajectory (
    trajectory_id TEXT PRIMARY KEY,
    program_id TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    prior_health_score REAL,
    current_health_score REAL,
    delta_score REAL,
    trend_direction TEXT,
    volatility_band TEXT
);

CREATE TABLE IF NOT EXISTS aal_forecast_signals (
    forecast_id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    forecast_type TEXT NOT NULL,
    forecast_horizon_days INTEGER,
    predicted_value REAL,
    confidence_score REAL,
    explanation_json TEXT,
    generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS aal_recommendations (
    recommendation_id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    priority INTEGER,
    recommendation_type TEXT,
    rationale_json TEXT,
    status TEXT DEFAULT 'open',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS aal_prediction_reviews (
    review_id TEXT PRIMARY KEY,
    forecast_id TEXT,
    actual_value REAL,
    prediction_error REAL,
    reviewed_at TEXT,
    notes_json TEXT
);

