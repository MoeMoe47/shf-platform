-- 004_audit.sql

CREATE TABLE IF NOT EXISTS audit_events (
  audit_event_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  actor_user_id TEXT REFERENCES users(user_id),
  actor_system_id TEXT,
  target_object_type TEXT NOT NULL,
  target_object_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  previous_state_json JSONB,
  new_state_json JSONB,
  reason_code TEXT,
  reason_text TEXT,
  correlation_id TEXT NOT NULL,
  source_channel TEXT NOT NULL,
  event_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
