-- Phase 10: durable in-app notifications are a projection of canonical events.
CREATE TABLE IF NOT EXISTS notifications (
  notification_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL REFERENCES users(user_id),
  notification_type TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  source_event_type TEXT NOT NULL,
  source_entity_type TEXT NOT NULL,
  source_entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  destination_path TEXT,
  status TEXT NOT NULL DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  CONSTRAINT notifications_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT notifications_message_bounded CHECK (char_length(title) <= 200 AND char_length(message) <= 1000),
  UNIQUE (organization_id, tenant_id, recipient_user_id, notification_type, source_event_id)
);

CREATE INDEX IF NOT EXISTS notifications_recipient_status_idx
  ON notifications (organization_id, tenant_id, recipient_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_source_event_idx
  ON notifications (organization_id, tenant_id, source_event_id);
