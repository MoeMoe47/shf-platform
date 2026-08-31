-- SHF Ecosystem Phase 7 — canonical Credential Definition + Learner
-- Credential (issuance) foundation.
--
-- Credential Definition is global reference data (no organization_id/
-- tenant_id) — mirrors careers/career_families (migration 033): what a
-- credential IS, not who has earned it. Learner Credential is the
-- org-scoped issuance record — a specific learner actually issued a
-- specific credential by a specific organization.
--
-- Deliberately NOT modeled: a persisted PENDING/ELIGIBLE/EXPIRED status.
-- Eligibility is a query-time evaluation (see credential-service.ts), not
-- a row. EXPIRED is derived from expires_at < now() at read time, never a
-- mutable stored state — avoids two sources of truth for the same fact.
CREATE TABLE IF NOT EXISTS credential_definitions (
  credential_definition_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  credential_type TEXT NOT NULL CHECK (credential_type IN ('INTERNAL', 'EXTERNAL')),
  issuing_authority TEXT NOT NULL,
  description TEXT,
  -- Optional relevance tag (mirrors career_events/opportunities' own
  -- single nullable career_id — a relevance/category signal, never an
  -- access-control or requirement rule by itself).
  career_id TEXT REFERENCES careers(career_id),
  -- The one real, deterministic eligibility rule this phase implements.
  -- Additional requirement sources (course completion, external
  -- evidence) are a documented, deferred non-goal — see
  -- docs/SHF_CREDENTIAL_ARCHITECTURE.md.
  requires_accepted_capstone BOOLEAN NOT NULL DEFAULT FALSE,
  -- NULL = lifetime credential, never expires.
  validity_period_months INTEGER CHECK (validity_period_months IS NULL OR validity_period_months > 0),
  -- Only meaningful alongside a validity period — a lifetime credential
  -- must never get a fake renewal date.
  renewal_window_days INTEGER CHECK (renewal_window_days IS NULL OR renewal_window_days > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (renewal_window_days IS NULL OR validity_period_months IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS learner_credentials (
  learner_credential_id TEXT PRIMARY KEY,
  credential_definition_id TEXT NOT NULL REFERENCES credential_definitions(credential_definition_id),
  learner_user_id TEXT NOT NULL REFERENCES users(user_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  -- Bounded lifecycle: only a fact an authorized issuer actually recorded.
  -- No self-issuance path exists at the service layer (see
  -- credential-service.ts) — enforced there, not just here.
  status TEXT NOT NULL CHECK (status IN ('ISSUED', 'REVOKED')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Copied from the definition's validity_period_months at issuance time
  -- (a later change to the definition's policy must never retroactively
  -- alter an already-issued credential's own expiration).
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  issued_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  revoked_by_user_id TEXT REFERENCES users(user_id),
  -- Stable public-facing identifier reserved for a future verifier
  -- surface (deferred this phase — no QR/public verification UI exists
  -- to point at yet). Generated now so no later migration is needed.
  verification_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((status = 'REVOKED') = (revoked_at IS NOT NULL))
);

-- A learner may hold at most one currently-ISSUED row per credential
-- definition at a time (re-issuance after revocation is allowed — the
-- constraint only applies to the ISSUED partition).
CREATE UNIQUE INDEX IF NOT EXISTS learner_credentials_one_active_per_definition
  ON learner_credentials (credential_definition_id, learner_user_id)
  WHERE status = 'ISSUED';

CREATE INDEX IF NOT EXISTS learner_credentials_org_learner_idx
  ON learner_credentials (organization_id, learner_user_id);
CREATE INDEX IF NOT EXISTS learner_credentials_expires_at_idx
  ON learner_credentials (organization_id, expires_at) WHERE expires_at IS NOT NULL;
