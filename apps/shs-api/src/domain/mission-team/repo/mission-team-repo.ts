// Phase 5 — persistence for multiplayer participation facts (migration 156).
// Never touches Mission Runtime rows: progression stays with Mission Runtime.
import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";

export type MissionTeamStatus = "FORMING" | "ACTIVE" | "COMPLETED" | "DISBANDED";
export type MissionParticipantStatus = "JOINED" | "LEFT" | "REMOVED";
export type MissionTeamEventType =
  | "TEAM_CREATED" | "PARTICIPANT_JOINED" | "PARTICIPANT_REJOINED" | "PARTICIPANT_LEFT" | "PARTICIPANT_REMOVED"
  | "ROLE_ASSIGNED" | "PARTICIPANT_READY" | "PARTICIPANT_NOT_READY" | "TEAM_ACTIVATED" | "TEAM_COMPLETED" | "TEAM_DISBANDED";

export interface MissionTeamRow {
  teamId: string;
  organizationId: string;
  tenantId: string;
  runtimeId: string;
  hostUserId: string;
  status: MissionTeamStatus;
  createdAt: string;
  activatedAt: string | null;
  closedAt: string | null;
}

export interface MissionParticipantRow {
  participantId: string;
  teamId: string;
  userId: string;
  missionRole: string;
  status: MissionParticipantStatus;
  ready: boolean;
  joinedAt: string;
  leftAt: string | null;
}

export interface MissionTeamEventRow {
  sequence: number;
  eventType: MissionTeamEventType;
  participantId: string | null;
  missionRole: string | null;
  observedRuntimeRevision: number;
  occurredAt: string;
}

const iso = (value: any) => (value instanceof Date ? value.toISOString() : value ?? null);
const teamFromRow = (row: any): MissionTeamRow => ({
  teamId: row.mission_team_id, organizationId: row.organization_id, tenantId: row.tenant_id, runtimeId: row.mission_runtime_id,
  hostUserId: row.host_user_id, status: row.status, createdAt: iso(row.created_at), activatedAt: iso(row.activated_at), closedAt: iso(row.closed_at),
});
const participantFromRow = (row: any): MissionParticipantRow => ({
  participantId: row.participant_id, teamId: row.mission_team_id, userId: row.user_id, missionRole: row.mission_role,
  status: row.status, ready: row.ready, joinedAt: iso(row.joined_at), leftAt: iso(row.left_at),
});

export interface TeamScope { organizationId: string; tenantId: string }

export class MissionTeamRepo {
  async findByRuntime(scope: TeamScope, runtimeId: string) {
    const result = await query("SELECT * FROM mission_teams WHERE organization_id=$1 AND tenant_id=$2 AND mission_runtime_id=$3", [scope.organizationId, scope.tenantId, runtimeId]);
    return result.rows[0] ? teamFromRow(result.rows[0]) : null;
  }

  async listParticipants(teamId: string) {
    const result = await query("SELECT * FROM mission_team_participants WHERE mission_team_id=$1 ORDER BY joined_at, participant_id", [teamId]);
    return result.rows.map(participantFromRow);
  }

  async listEvents(teamId: string) {
    const result = await query("SELECT * FROM mission_team_events WHERE mission_team_id=$1 ORDER BY sequence", [teamId]);
    return result.rows.map((row: any): MissionTeamEventRow => ({
      sequence: Number(row.sequence), eventType: row.event_type, participantId: row.participant_id, missionRole: row.mission_role,
      observedRuntimeRevision: Number(row.observed_runtime_revision), occurredAt: iso(row.occurred_at),
    }));
  }

  async listOperational(scope: TeamScope) {
    const result = await query(
      `SELECT * FROM mission_teams WHERE organization_id=$1 AND tenant_id=$2 AND status IN ('FORMING','ACTIVE') ORDER BY created_at LIMIT 200`,
      [scope.organizationId, scope.tenantId],
    );
    return result.rows.map(teamFromRow);
  }

  // Creates the single team for a runtime and seats the host, atomically. Idempotent per runtime.
  async createTeam(input: TeamScope & { runtimeId: string; hostUserId: string; hostRole: string; runtimeRevision: number }) {
    return withTransaction(async (db) => {
      const teamId = `mission_team_${randomUUID()}`;
      const inserted = await db.query(
        `INSERT INTO mission_teams (mission_team_id, organization_id, tenant_id, mission_runtime_id, host_user_id)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (mission_runtime_id) DO NOTHING RETURNING *`,
        [teamId, input.organizationId, input.tenantId, input.runtimeId, input.hostUserId],
      );
      if (!inserted.rows[0]) {
        const existing = await db.query("SELECT * FROM mission_teams WHERE mission_runtime_id=$1", [input.runtimeId]);
        return { team: teamFromRow(existing.rows[0]), created: false };
      }
      const participantId = `mission_participant_${randomUUID()}`;
      await db.query(
        `INSERT INTO mission_team_participants (participant_id, mission_team_id, organization_id, tenant_id, mission_runtime_id, user_id, mission_role)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [participantId, teamId, input.organizationId, input.tenantId, input.runtimeId, input.hostUserId, input.hostRole],
      );
      await this.appendEvent(db, teamId, input, "TEAM_CREATED", null, null, input.runtimeRevision);
      await this.appendEvent(db, teamId, input, "PARTICIPANT_JOINED", participantId, input.hostRole, input.runtimeRevision);
      return { team: teamFromRow(inserted.rows[0]), created: true };
    });
  }

  // Runs a membership mutation under the team row lock: capacity/role/readiness checks see a consistent roster.
  async withTeamLock<T>(teamId: string, fn: (tx: TeamTx) => Promise<T>): Promise<T> {
    return withTransaction(async (db) => {
      const team = await db.query("SELECT * FROM mission_teams WHERE mission_team_id=$1 FOR UPDATE", [teamId]);
      if (!team.rows[0]) throw new Error("MISSION_TEAM_NOT_FOUND");
      const participants = await db.query("SELECT * FROM mission_team_participants WHERE mission_team_id=$1 ORDER BY joined_at, participant_id", [teamId]);
      const current = teamFromRow(team.rows[0]);
      return fn({
        team: current,
        participants: participants.rows.map(participantFromRow),
        insertParticipant: async (userId, missionRole) => {
          const participantId = `mission_participant_${randomUUID()}`;
          await db.query(
            `INSERT INTO mission_team_participants (participant_id, mission_team_id, organization_id, tenant_id, mission_runtime_id, user_id, mission_role)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [participantId, teamId, current.organizationId, current.tenantId, current.runtimeId, userId, missionRole],
          );
          return participantId;
        },
        updateParticipant: async (participantId, patch) => {
          await db.query(
            `UPDATE mission_team_participants SET
               status = COALESCE($2, status), mission_role = COALESCE($3, mission_role), ready = COALESCE($4, ready),
               left_at = CASE WHEN COALESCE($2, status) = 'JOINED' THEN NULL WHEN $2 IS NOT NULL THEN NOW() ELSE left_at END,
               joined_at = CASE WHEN $5 THEN NOW() ELSE joined_at END, updated_at = NOW()
             WHERE participant_id=$1 AND mission_team_id=$6`,
            [participantId, patch.status ?? null, patch.missionRole ?? null, patch.ready ?? null, patch.rejoin === true, teamId],
          );
        },
        updateTeamStatus: async (status) => {
          await db.query(
            `UPDATE mission_teams SET status=$2, updated_at=NOW(),
               activated_at = CASE WHEN $2='ACTIVE' THEN NOW() ELSE activated_at END,
               closed_at = CASE WHEN $2 IN ('COMPLETED','DISBANDED') THEN NOW() ELSE closed_at END
             WHERE mission_team_id=$1`,
            [teamId, status],
          );
        },
        appendEvent: (eventType, participantId, missionRole, runtimeRevision) => this.appendEvent(db, teamId, current, eventType, participantId, missionRole, runtimeRevision),
      });
    });
  }

  private async appendEvent(db: any, teamId: string, scope: TeamScope & { runtimeId: string }, eventType: MissionTeamEventType, participantId: string | null, missionRole: string | null, runtimeRevision: number) {
    await db.query(
      `INSERT INTO mission_team_events (mission_team_event_id, mission_team_id, organization_id, tenant_id, mission_runtime_id, sequence, event_type, participant_id, mission_role, observed_runtime_revision)
       VALUES ($1,$2,$3,$4,$5,(SELECT COALESCE(MAX(sequence),0)+1 FROM mission_team_events WHERE mission_team_id=$2),$6,$7,$8,$9)`,
      [randomUUID(), teamId, scope.organizationId, scope.tenantId, scope.runtimeId, eventType, participantId, missionRole, runtimeRevision],
    );
  }
}

export interface TeamTx {
  team: MissionTeamRow;
  participants: MissionParticipantRow[];
  insertParticipant(userId: string, missionRole: string): Promise<string>;
  updateParticipant(participantId: string, patch: { status?: MissionParticipantStatus; missionRole?: string; ready?: boolean; rejoin?: boolean }): Promise<void>;
  updateTeamStatus(status: MissionTeamStatus): Promise<void>;
  appendEvent(eventType: MissionTeamEventType, participantId: string | null, missionRole: string | null, runtimeRevision: number): Promise<void>;
}
