-- 057_authorized_accommodations.sql
--
-- SHF AIEL Phase 5 — Authorized Accommodation domain. Institutionally
-- granted accommodations (extended assessment time, additional breaks,
-- alternate presentation, alternate input method) — CONCEPTUALLY AND
-- STRUCTURALLY SEPARATE from user_accessibility_profiles (migration 056,
-- learner-controlled Personal Accessibility Preferences). A learner can
-- never write a row in this table; only an institutional
-- accommodation.manage actor can.
--
-- Subject scope: (organization_id, user_id) composite FK to users,
-- mirroring the enrollments domain's own real precedent (migration 041's
-- `enrollments_learner_same_org_fk`), not membership_id. Verified this
-- session: no domain in this repository FKs to memberships.membership_id
-- — that field is a session/auth-resolution construct
-- (organization-context.ts's fallbackMembershipFromUser()) that is
-- frequently a synthetic `legacy:<user_id>:<org_id>` value with no
-- backing row, for any user without a real seeded membership. A hard FK
-- to it would reject grants for most real and fixture users in this
-- database. membership_id is still recorded below, informationally only
-- (not FK'd), for audit/correlation with req.user.membership_id.
--
-- Lifecycle: only two STORED states — ACTIVE and REVOKED (REVOKED is
-- terminal; a revoked accommodation is never reactivated, a new one is
-- granted instead). SCHEDULED and EXPIRED are derived, not stored: an
-- ACTIVE row whose effective_at is still in the future reads as
-- SCHEDULED; an ACTIVE row whose expires_at has passed reads as EXPIRED.
-- This avoids inventing a background job to flip status columns on a
-- timer while still giving every consumer an honest four-state view.
--
-- No diagnosis, disability type, medical condition, or medical narrative
-- field exists anywhere in this table, by design (Constitution §8.1/8.2).
-- No link to Truth Spine, Operational Events, Evidence, or the Personal
-- Accessibility Profile.

CREATE TABLE IF NOT EXISTS authorized_accommodations (
  accommodation_id      TEXT PRIMARY KEY,
  organization_id       TEXT NOT NULL REFERENCES organizations(organization_id),
  user_id                TEXT NOT NULL,
  -- Informational correlation only — see header. Never FK'd, never used
  -- as an authorization boundary by itself.
  membership_id          TEXT,

  accommodation_type     TEXT NOT NULL
    CHECK (accommodation_type IN (
      'EXTENDED_ASSESSMENT_TIME',
      'ADDITIONAL_BREAKS',
      'ALTERNATE_PRESENTATION',
      'ALTERNATE_INPUT_METHOD'
    )),
  -- Normalized, type-specific shape — validated at the application layer
  -- per accommodation_type (see model/accommodation-value.ts). Never
  -- arbitrary/unvalidated JSON accepted as execution policy.
  value                  JSONB NOT NULL DEFAULT '{}'::jsonb,

  status                 TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'REVOKED')),

  effective_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at             TIMESTAMPTZ,
  CHECK (expires_at IS NULL OR expires_at > effective_at),

  granted_by_user_id     TEXT NOT NULL REFERENCES users(user_id),
  granted_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  revoked_by_user_id     TEXT REFERENCES users(user_id),
  revoked_at             TIMESTAMPTZ,
  CHECK (
    (status = 'REVOKED' AND revoked_by_user_id IS NOT NULL AND revoked_at IS NOT NULL)
    OR
    (status = 'ACTIVE' AND revoked_by_user_id IS NULL AND revoked_at IS NULL)
  ),

  revision               INTEGER NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT authorized_accommodations_subject_same_org_fk
    FOREIGN KEY (organization_id, user_id) REFERENCES users(organization_id, user_id)
);

-- At most one ACTIVE (or scheduled-but-not-yet-effective) row per
-- subject/org/type at a time — prevents duplicate concurrent grants of
-- the same accommodation type while still preserving full history via
-- REVOKED rows, which fall outside this partial index.
CREATE UNIQUE INDEX IF NOT EXISTS uq_authorized_accommodations_active_subject_type
  ON authorized_accommodations (organization_id, user_id, accommodation_type)
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_authorized_accommodations_org_user
  ON authorized_accommodations (organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_authorized_accommodations_status
  ON authorized_accommodations (status);
CREATE INDEX IF NOT EXISTS idx_authorized_accommodations_type
  ON authorized_accommodations (accommodation_type);
