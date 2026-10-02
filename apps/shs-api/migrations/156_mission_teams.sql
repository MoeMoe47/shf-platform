-- Phase 5: Multiplayer / Team Missions — participation and coordination facts only.
--
-- Mission Runtime remains the canonical Mission state authority: lifecycle, objectives,
-- stages, revision/CAS, canonical events and results stay in mission_runtime_sessions/events.
-- These tables hold multiplayer-native operational facts (team, membership, mission role,
-- readiness) and a team-lifecycle history. Presence is ephemeral and is not stored here.
-- Mission roles are participation roles declared by the frozen MissionDefinition; they are
-- never Identity/RBAC roles. No profile/PII is copied: user_id is the only identity reference.

CREATE TABLE IF NOT EXISTS mission_teams (
  mission_team_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  -- A team belongs to exactly one Mission Runtime and does not outlive it operationally.
  mission_runtime_id TEXT NOT NULL REFERENCES mission_runtime_sessions(mission_runtime_id) ON DELETE CASCADE,
  host_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'FORMING' CHECK (status IN ('FORMING', 'ACTIVE', 'COMPLETED', 'DISBANDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT mission_teams_host_same_org_fk FOREIGN KEY (organization_id, host_user_id) REFERENCES users(organization_id, user_id),
  -- Phase 5 supports SINGLE_TEAM Missions only: one team per runtime.
  CONSTRAINT mission_teams_one_per_runtime UNIQUE (mission_runtime_id),
  -- Composite key so participants and events cannot disagree with their owning team's scope.
  CONSTRAINT mission_teams_scope_uk UNIQUE (mission_team_id, organization_id, tenant_id, mission_runtime_id)
);

-- mission_runtime_sessions exposes no composite (id, organization, tenant, owner) key, and this
-- migration does not alter the Mission Runtime authority's table. The team ↔ runtime scope is
-- therefore enforced here: a team's organization, tenant and host must equal its runtime's
-- organization, tenant and owner, and that scope can never be changed afterwards.
CREATE OR REPLACE FUNCTION enforce_mission_team_runtime_scope() RETURNS trigger AS $$
DECLARE
  runtime_row RECORD;
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.organization_id, NEW.tenant_id, NEW.mission_runtime_id, NEW.host_user_id)
      IS DISTINCT FROM (OLD.organization_id, OLD.tenant_id, OLD.mission_runtime_id, OLD.host_user_id) THEN
    RAISE EXCEPTION 'Mission team scope is immutable';
  END IF;
  SELECT organization_id, tenant_id, user_id INTO runtime_row FROM mission_runtime_sessions WHERE mission_runtime_id = NEW.mission_runtime_id;
  IF NOT FOUND OR runtime_row.organization_id <> NEW.organization_id OR runtime_row.tenant_id <> NEW.tenant_id OR runtime_row.user_id <> NEW.host_user_id THEN
    RAISE EXCEPTION 'Mission team scope must match its Mission Runtime organization, tenant and owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_teams_runtime_scope
  BEFORE INSERT OR UPDATE ON mission_teams
  FOR EACH ROW EXECUTE FUNCTION enforce_mission_team_runtime_scope();

CREATE TABLE IF NOT EXISTS mission_team_participants (
  participant_id TEXT PRIMARY KEY,
  mission_team_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  mission_runtime_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  mission_role TEXT NOT NULL CHECK (char_length(mission_role) BETWEEN 1 AND 128),
  status TEXT NOT NULL DEFAULT 'JOINED' CHECK (status IN ('JOINED', 'LEFT', 'REMOVED')),
  ready BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id),
  CHECK ((status = 'JOINED') = (left_at IS NULL)),
  CHECK (NOT (ready AND status <> 'JOINED')),
  -- Cross-organization membership is structurally impossible.
  CONSTRAINT mission_team_participants_user_same_org_fk FOREIGN KEY (organization_id, user_id) REFERENCES users(organization_id, user_id),
  -- A user holds at most one membership row per team; rejoin reuses it (no duplicates).
  CONSTRAINT mission_team_participants_one_per_user UNIQUE (mission_team_id, user_id),
  -- Copied scope can never disagree with the owning team.
  CONSTRAINT mission_team_participants_team_scope_fk FOREIGN KEY (mission_team_id, organization_id, tenant_id, mission_runtime_id)
    REFERENCES mission_teams(mission_team_id, organization_id, tenant_id, mission_runtime_id) ON DELETE CASCADE,
  -- Lets team events prove a referenced participant belongs to the same team.
  CONSTRAINT mission_team_participants_team_uk UNIQUE (participant_id, mission_team_id)
);

CREATE INDEX IF NOT EXISTS mission_team_participants_user_idx
  ON mission_team_participants (organization_id, tenant_id, user_id, status);

-- Team-lifecycle history (created, joined, left, role, ready, activated, completed, disbanded).
-- Mission progression is never recorded here; learner actions are canonical Mission Runtime
-- events. observed_runtime_revision relates each team event to runtime event ordering.
-- Append-only by service, like mission_runtime_events; history is removed only with its runtime.
CREATE TABLE IF NOT EXISTS mission_team_events (
  mission_team_event_id TEXT PRIMARY KEY,
  mission_team_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  mission_runtime_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'TEAM_CREATED', 'PARTICIPANT_JOINED', 'PARTICIPANT_REJOINED', 'PARTICIPANT_LEFT', 'PARTICIPANT_REMOVED',
    'ROLE_ASSIGNED', 'PARTICIPANT_READY', 'PARTICIPANT_NOT_READY', 'TEAM_ACTIVATED', 'TEAM_COMPLETED', 'TEAM_DISBANDED'
  )),
  participant_id TEXT,
  mission_role TEXT,
  observed_runtime_revision INTEGER NOT NULL CHECK (observed_runtime_revision > 0),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mission_team_events_sequence_uk UNIQUE (mission_team_id, sequence),
  CHECK (tenant_id = 'tenant:' || organization_id),
  -- Copied scope can never disagree with the owning team.
  CONSTRAINT mission_team_events_team_scope_fk FOREIGN KEY (mission_team_id, organization_id, tenant_id, mission_runtime_id)
    REFERENCES mission_teams(mission_team_id, organization_id, tenant_id, mission_runtime_id) ON DELETE CASCADE,
  -- A referenced participant must belong to this same team (unchecked when participant_id is NULL).
  -- NO ACTION (deliberately not CASCADE): a participant row can never be deleted on its own while
  -- retained history references it. NO ACTION is checked at the end of the statement, so the
  -- runtime → team cascade that removes participants and events together still succeeds.
  CONSTRAINT mission_team_events_participant_same_team_fk FOREIGN KEY (participant_id, mission_team_id)
    REFERENCES mission_team_participants(participant_id, mission_team_id) ON DELETE NO ACTION
);
