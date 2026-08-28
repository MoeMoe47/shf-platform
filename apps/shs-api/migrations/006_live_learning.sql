-- 006_live_learning.sql
-- Phase 2A Secure Live Learning Infrastructure. Provider-neutral domain
-- (LiveSession, not "ZoomMeeting") — provider is a column value, not the
-- schema's identity. join events are the server-side authorization record;
-- localStorage (src/utils/zoomAccess.js) is display/cache only and is not
-- consulted by this table or the service that writes to it.

CREATE TABLE IF NOT EXISTS live_sessions (
  live_session_id         TEXT PRIMARY KEY,
  organization_id         TEXT NOT NULL REFERENCES organizations(organization_id),
  provider                TEXT NOT NULL DEFAULT 'mock',
  provider_session_id     TEXT,
  title                   TEXT NOT NULL,
  description             TEXT,
  course_id               TEXT,
  module_id               TEXT,
  lesson_id               TEXT,
  instructor_id           TEXT NOT NULL REFERENCES users(user_id),
  cohort_id               TEXT,
  starts_at               TIMESTAMPTZ NOT NULL,
  ends_at                 TIMESTAMPTZ NOT NULL,
  timezone                TEXT NOT NULL DEFAULT 'UTC',
  status                  TEXT NOT NULL DEFAULT 'scheduled',
  access_policy_json      JSONB NOT NULL DEFAULT '{}'::jsonb,
  recording_policy_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_metadata_json  JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version                 INTEGER NOT NULL DEFAULT 1
);

-- The server-side authorization/attendance ledger. A row here is the ONLY
-- thing that can ever indicate a user was granted access to a real
-- meeting — no client-side state is consulted or trusted for this.
CREATE TABLE IF NOT EXISTS live_session_join_events (
  join_event_id      TEXT PRIMARY KEY,
  live_session_id     TEXT NOT NULL REFERENCES live_sessions(live_session_id),
  user_id             TEXT NOT NULL REFERENCES users(user_id),
  decision            TEXT NOT NULL,              -- 'allow' | 'deny'
  reason              TEXT,
  attendance_status   TEXT NOT NULL DEFAULT 'registered',
  -- registered | authorized | joined | attended | completed | absent | excused
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_sessions_org ON live_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_lesson ON live_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_join_events_session ON live_session_join_events(live_session_id);
CREATE INDEX IF NOT EXISTS idx_join_events_user ON live_session_join_events(user_id);
