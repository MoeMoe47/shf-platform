-- SHF AIEL Phase 3 — Personal Accessibility Profile persistence.
--
-- Canonical, user-scoped store for Personal Accessibility Preferences and
-- Learning Support preferences (see docs/SHF_AIEL_PERSISTENCE_API_CONTRACT_V1.md
-- §3/§6). Deliberately does NOT contain: organization_id (personal
-- preferences are user-scoped, not org-scoped, per
-- docs/SHF_ACCESSIBILITY_INCLUSIVE_EXPERIENCE_CONSTITUTION_V1.md §7),
-- membership_id, any Authorized Accommodation field, any diagnosis/
-- disability field, any speculative TTS field (speech rate/voice/
-- language), and any Content/Application Accessibility Capability field —
-- all of those belong to other domains or a future, separate,
-- institutionally-authorized table, never this one (Constitution §6).
--
-- One row per user, enforced by UNIQUE(user_id) — a row is created only on
-- a learner's first real preference write (Phase 2 §15), never at user
-- creation or at read time; a GET with no row returns the canonical
-- default in memory without persisting anything.
CREATE TABLE IF NOT EXISTS user_accessibility_profiles (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL UNIQUE REFERENCES users(user_id),
  profile_version   INTEGER NOT NULL DEFAULT 1,
  revision          INTEGER NOT NULL DEFAULT 1,
  preferences       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
