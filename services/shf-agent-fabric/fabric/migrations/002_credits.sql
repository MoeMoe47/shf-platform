CREATE TABLE IF NOT EXISTS credits (
    credit_id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL UNIQUE,
    decision_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credits_submission
ON credits(submission_id);
