-- SHF Ecosystem Phase 12.2 — Native External Calendar Integration: stable
-- SHF-projection-to-provider-mirror mapping.
--
-- One row per (connection, SHF projected event) that has ever been
-- mirrored to that connection's provider Calendar — the UNIQUE constraint
-- below is the structural guarantee behind phase brief §17/§18: the same
-- SHF projected event always reconciles to the same provider mirror for a
-- given connection, never a duplicate. `shf_projection_id` is the exact
-- stable id Phase 9's Calendar Projection Service already produces
-- (`${sourceDomain}:${sourceRecordId}`, see calendar-event.ts) — never a
-- title, date, or array index.
--
-- Mirroring direction is one-way, SHF -> provider, always (phase brief
-- §16) — this table has no column that could represent a provider-
-- originated write back into SHF; it exists purely to let a future sync
-- pass find "the provider event I already created for this SHF event,"
-- nothing else.
CREATE TABLE IF NOT EXISTS external_calendar_event_links (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES external_account_connections(id) ON DELETE CASCADE,
  shf_projection_id TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  provider_calendar_id TEXT NOT NULL DEFAULT 'primary',
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- User-level mirror suppression (phase brief §25): presentation state
  -- only — set when a learner deletes the provider-side mirror and this
  -- app chooses not to recreate it, never a signal that the underlying
  -- SHF event itself was cancelled.
  suppressed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (connection_id, shf_projection_id)
);

CREATE INDEX IF NOT EXISTS idx_external_calendar_event_links_connection
  ON external_calendar_event_links(connection_id);
