-- NCA-2 — Canonical Notification Persistence, Recipient Resolution & Preferences.
--
-- Minimal, evidence-gated persistence addition. NCA-0 confirmed no user
-- communication-preference mechanism exists anywhere in the repository
-- (docs/architecture/NCA-0_SYSTEM_WIDE_NOTIFICATION_COMMUNICATION_ARCHITECTURE_AUDIT.md
-- §10). NCA-2 is explicitly instructed to implement the smallest canonical
-- preference model needed (not merely document one), and no existing
-- table/column can safely represent "does this user want OPTIONAL_PRODUCT
-- or DIGEST_ELIGIBLE in-app notifications" — it is new, stable, per-user
-- canonical NCA state, not derivable from `notifications` (per-event rows),
-- `users`, or `memberships` (identity/org state, not a communication
-- choice).
--
-- Deliberately does NOT contain: organization_id (a communication
-- preference is a personal choice, not an organization-scoped one — see
-- NCA-2 report §14/§17; mirrors the same user-only scoping precedent as
-- migration 056_accessibility_profiles.sql, which this table is explicitly
-- NOT a substitute for — accessibility preferences and communication
-- preferences remain separate systems), any email/SMS/push column (no
-- channel beyond IN_APP is wired to the general notification path yet —
-- see NCA-0 §9/§39; adding those columns now would be exactly the
-- speculative-future-feature column the NCA-2 migration rule forbids),
-- and any category outside the two the canonical classification registry
-- (apps/shs-api/src/domain/notifications/contracts/notification-classification.ts)
-- marks as user-suppressible. MANDATORY_OPERATIONAL, REQUIRED_ACTION,
-- TRANSACTIONAL, and MARKETING rows are rejected by the CHECK constraint —
-- required/operational communication cannot be represented as
-- user-suppressible at the schema level, not merely by service-layer
-- convention.
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT NOT NULL REFERENCES users(user_id),
  category TEXT NOT NULL CHECK (category IN ('OPTIONAL_PRODUCT', 'DIGEST_ELIGIBLE')),
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, category)
);
