-- Phase 4D: frozen Mission review submissions, immutable scoped releases,
-- and append-only publication lifecycle audit.
CREATE TABLE IF NOT EXISTS mission_review_submissions (
  submission_id UUID PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  draft_id UUID NOT NULL REFERENCES mission_definition_drafts(draft_id) ON DELETE RESTRICT,
  draft_revision INTEGER NOT NULL CHECK (draft_revision > 0),
  mission_id TEXT NOT NULL,
  mission_version INTEGER NOT NULL CHECK (mission_version > 0),
  definition_snapshot JSONB NOT NULL CHECK (jsonb_typeof(definition_snapshot) = 'object'),
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED')),
  submitted_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  submission_note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by_user_id TEXT REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ,
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mission_submission_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT mission_submission_decision_pair CHECK (
    (status = 'SUBMITTED' AND reviewed_by_user_id IS NULL AND reviewed_at IS NULL)
    OR (status IN ('APPROVED', 'REJECTED') AND reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL)
  ),
  UNIQUE (organization_id, tenant_id, draft_id, draft_revision)
);

CREATE INDEX IF NOT EXISTS mission_review_queue_idx
  ON mission_review_submissions (organization_id, tenant_id, status, submitted_at ASC);

CREATE TABLE IF NOT EXISTS mission_published_releases (
  release_id UUID PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  mission_version INTEGER NOT NULL CHECK (mission_version > 0),
  definition_snapshot JSONB NOT NULL CHECK (jsonb_typeof(definition_snapshot) = 'object'),
  source_submission_id UUID NOT NULL REFERENCES mission_review_submissions(submission_id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'RETIRED')),
  published_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_by_user_id TEXT REFERENCES users(user_id),
  retired_at TIMESTAMPTZ,
  retirement_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mission_release_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT mission_release_retirement_pair CHECK (
    (status = 'PUBLISHED' AND retired_by_user_id IS NULL AND retired_at IS NULL AND retirement_note IS NULL)
    OR (status = 'RETIRED' AND retired_by_user_id IS NOT NULL AND retired_at IS NOT NULL AND retirement_note IS NOT NULL)
  ),
  UNIQUE (organization_id, tenant_id, mission_id, mission_version),
  UNIQUE (organization_id, tenant_id, source_submission_id)
);

CREATE INDEX IF NOT EXISTS mission_release_resolver_idx
  ON mission_published_releases (organization_id, tenant_id, mission_id, mission_version, status);

CREATE TABLE IF NOT EXISTS mission_publication_events (
  event_id UUID PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  mission_version INTEGER NOT NULL CHECK (mission_version > 0),
  submission_id UUID REFERENCES mission_review_submissions(submission_id) ON DELETE RESTRICT,
  release_id UUID REFERENCES mission_published_releases(release_id) ON DELETE RESTRICT,
  actor_user_id TEXT NOT NULL REFERENCES users(user_id),
  event_type TEXT NOT NULL CHECK (event_type IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'RETIRED')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT mission_publication_event_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT mission_publication_event_subject CHECK (submission_id IS NOT NULL OR release_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS mission_publication_events_history_idx
  ON mission_publication_events (organization_id, tenant_id, mission_id, mission_version, occurred_at ASC, event_id ASC);

CREATE OR REPLACE FUNCTION prevent_mission_release_content_mutation() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Mission releases are retained and cannot be deleted';
  END IF;
  IF NEW.release_id <> OLD.release_id
    OR NEW.organization_id <> OLD.organization_id
    OR NEW.tenant_id <> OLD.tenant_id
    OR NEW.mission_id <> OLD.mission_id
    OR NEW.mission_version <> OLD.mission_version
    OR NEW.definition_snapshot <> OLD.definition_snapshot
    OR NEW.source_submission_id <> OLD.source_submission_id
    OR NEW.published_by_user_id <> OLD.published_by_user_id
    OR NEW.published_at <> OLD.published_at THEN
    RAISE EXCEPTION 'Published Mission release content and identity are immutable';
  END IF;
  IF OLD.status = 'RETIRED' THEN
    RAISE EXCEPTION 'Retired Mission releases are immutable';
  END IF;
  IF OLD.status = 'PUBLISHED'
    AND NEW.status = 'RETIRED'
    AND OLD.retired_by_user_id IS NULL
    AND OLD.retired_at IS NULL
    AND OLD.retirement_note IS NULL
    AND NEW.retired_by_user_id IS NOT NULL
    AND NEW.retired_at IS NOT NULL
    AND NEW.retirement_note IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
    OR NEW.retired_by_user_id IS DISTINCT FROM OLD.retired_by_user_id
    OR NEW.retired_at IS DISTINCT FROM OLD.retired_at
    OR NEW.retirement_note IS DISTINCT FROM OLD.retirement_note THEN
    RAISE EXCEPTION 'Published Mission release lifecycle is immutable except for the first retire transition';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_published_release_immutable
  BEFORE UPDATE OR DELETE ON mission_published_releases
  FOR EACH ROW EXECUTE FUNCTION prevent_mission_release_content_mutation();

CREATE OR REPLACE FUNCTION prevent_mission_publication_event_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Mission publication events are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_publication_events_append_only
  BEFORE UPDATE OR DELETE ON mission_publication_events
  FOR EACH ROW EXECUTE FUNCTION prevent_mission_publication_event_mutation();

CREATE OR REPLACE FUNCTION prevent_mission_submission_snapshot_mutation() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Mission review submissions are retained';
  END IF;
  IF NEW.submission_id <> OLD.submission_id
    OR NEW.organization_id <> OLD.organization_id
    OR NEW.tenant_id <> OLD.tenant_id
    OR NEW.draft_id <> OLD.draft_id
    OR NEW.draft_revision <> OLD.draft_revision
    OR NEW.mission_id <> OLD.mission_id
    OR NEW.mission_version <> OLD.mission_version
    OR NEW.definition_snapshot <> OLD.definition_snapshot
    OR NEW.submitted_by_user_id <> OLD.submitted_by_user_id
    OR NEW.submitted_at <> OLD.submitted_at
    OR NEW.submission_note IS DISTINCT FROM OLD.submission_note THEN
    RAISE EXCEPTION 'Submitted Mission snapshot is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_review_submission_snapshot_immutable
  BEFORE UPDATE OR DELETE ON mission_review_submissions
  FOR EACH ROW EXECUTE FUNCTION prevent_mission_submission_snapshot_mutation();
