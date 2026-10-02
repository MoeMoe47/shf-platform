import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import type { MissionDefinition } from "../../mission-content/model/mission-definition.js";
import type { MissionObjectiveState, MissionRuntimeEvent, MissionRuntimeSession, MissionRuntimeStatus, MissionStageState } from "../model/mission-runtime.js";

function iso(value: any) {
  return value instanceof Date ? value.toISOString() : value;
}

function fromRow(row: any): MissionRuntimeSession {
  return {
    id: row.mission_runtime_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    missionId: row.mission_id,
    missionVersion: Number(row.mission_version),
    definitionSnapshot: row.definition_snapshot,
    status: row.status,
    revision: Number(row.revision),
    objectiveStates: row.objective_states,
    stageStates: row.stage_states,
    runtimeState: row.runtime_state,
    arcadeRuntimeSessionId: row.arcade_runtime_session_id,
    startedAt: iso(row.started_at),
    pausedAt: iso(row.paused_at),
    completedAt: iso(row.completed_at),
    failedAt: iso(row.failed_at),
    abandonedAt: iso(row.abandoned_at),
    expiredAt: iso(row.expired_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function eventFromRow(row: any): MissionRuntimeEvent {
  return {
    id: row.mission_runtime_event_id,
    sequence: Number(row.sequence),
    eventType: row.event_type,
    payload: row.payload,
    occurredAt: iso(row.occurred_at),
    serverReceivedAt: iso(row.server_received_at),
  };
}

const COLUMNS = `mission_runtime_id, organization_id, tenant_id, user_id, mission_id,
  mission_version, definition_snapshot, status, revision, objective_states, stage_states,
  runtime_state, arcade_runtime_session_id, idempotency_key, started_at, paused_at,
  completed_at, failed_at, abandoned_at, expired_at, created_at, updated_at`;

export interface MissionRuntimeScope {
  organizationId: string;
  tenantId: string;
  userId: string;
}

export interface MissionRuntimeMutation {
  status: MissionRuntimeStatus;
  objectiveStates: MissionObjectiveState[];
  stageStates: MissionStageState[];
  runtimeState: Record<string, string | number | boolean>;
  pausedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  abandonedAt?: string | null;
  expiredAt?: string | null;
  event?: { eventType: string; payload: Record<string, unknown>; occurredAt: string };
  noChange?: boolean;
}

export interface MissionDirectorDecisionWrite {
  idempotencyKey: string;
  capability: "missionDirector";
  proposal: unknown;
  executorKind: "DETERMINISTIC" | "FIXTURE";
  providerExecutionRef: string | null;
  policyVersion: string;
  contextDigest: string;
}

export type MissionRuntimeMutationResult =
  | { kind: "NOT_FOUND" }
  | { kind: "REVISION_CONFLICT"; currentRevision: number }
  | { kind: "EVENT_LIMIT" }
  | { kind: "OK"; session: MissionRuntimeSession; event: MissionRuntimeEvent | null };

export class MissionRuntimeRepo {
  constructor(private readonly dbQuery: typeof query = query) {}

  async start(input: MissionRuntimeScope & {
    missionId: string;
    missionVersion: number;
    definition: MissionDefinition;
    objectiveStates: MissionObjectiveState[];
    stageStates: MissionStageState[];
    runtimeState: Record<string, string | number | boolean>;
    startedAt: string;
    arcadeRuntimeSessionId: string | null;
    idempotencyKey: string | null;
    missionRuntimeId?: string;
    // Runtime-owned events recorded atomically with session creation (Phase 4G frozen projections).
    initialEvents?: Array<{ eventType: string; payload: Record<string, unknown>; occurredAt: string }>;
  }): Promise<{ session: MissionRuntimeSession | null; reused: boolean }> {
    const id = input.missionRuntimeId ?? `mission_runtime_${randomUUID()}`;
    return withTransaction(async (db) => {
      if (input.arcadeRuntimeSessionId) {
        const arcadeSession = await db.query(
          `SELECT 1 FROM arcade_runtime_sessions
           WHERE runtime_session_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4`,
          [input.arcadeRuntimeSessionId, input.organizationId, input.tenantId, input.userId],
        );
        if (!arcadeSession.rows[0]) return { session: null, reused: false };
      }
      const inserted = await db.query(
        `INSERT INTO mission_runtime_sessions
          (mission_runtime_id, organization_id, tenant_id, user_id, mission_id, mission_version,
           definition_snapshot, status, objective_states, stage_states, runtime_state,
           arcade_runtime_session_id, idempotency_key, started_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,'ACTIVE',$8::jsonb,$9::jsonb,$13::jsonb,$10,$11,$12)
         ON CONFLICT (organization_id, tenant_id, user_id, idempotency_key)
           WHERE idempotency_key IS NOT NULL DO NOTHING
         RETURNING ${COLUMNS}`,
        [id, input.organizationId, input.tenantId, input.userId, input.missionId, input.missionVersion,
          JSON.stringify(input.definition), JSON.stringify(input.objectiveStates), JSON.stringify(input.stageStates),
          input.arcadeRuntimeSessionId, input.idempotencyKey, input.startedAt, JSON.stringify(input.runtimeState)],
      );
      if (inserted.rows[0]) {
        for (const [index, event] of (input.initialEvents ?? []).entries()) {
          await db.query(
            `INSERT INTO mission_runtime_events
              (mission_runtime_event_id, mission_runtime_id, sequence, event_type, payload, occurred_at)
             VALUES ($1,$2,$3,$4,$5::jsonb,$6)`,
            [randomUUID(), id, index + 1, event.eventType, JSON.stringify(event.payload), event.occurredAt],
          );
        }
        return { session: fromRow(inserted.rows[0]), reused: false };
      }
      const existing = await db.query(
        `SELECT ${COLUMNS} FROM mission_runtime_sessions
         WHERE organization_id=$1 AND tenant_id=$2 AND user_id=$3 AND idempotency_key=$4`,
        [input.organizationId, input.tenantId, input.userId, input.idempotencyKey],
      );
      if (!existing.rows[0]) throw new Error("MISSION_RUNTIME_START_CONFLICT");
      return { session: fromRow(existing.rows[0]), reused: true };
    });
  }

  async getOwned(id: string, scope: MissionRuntimeScope): Promise<MissionRuntimeSession | null> {
    const result = await this.dbQuery(
      `SELECT ${COLUMNS} FROM mission_runtime_sessions
       WHERE mission_runtime_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4`,
      [id, scope.organizationId, scope.tenantId, scope.userId],
    );
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  async listOwned(scope: MissionRuntimeScope): Promise<MissionRuntimeSession[]> {
    const result = await this.dbQuery(
      `SELECT ${COLUMNS} FROM mission_runtime_sessions
       WHERE organization_id=$1 AND tenant_id=$2 AND user_id=$3
       ORDER BY started_at DESC, mission_runtime_id DESC LIMIT 50`,
      [scope.organizationId, scope.tenantId, scope.userId],
    );
    return result.rows.map(fromRow);
  }

  async listEventsOwned(id: string, scope: MissionRuntimeScope): Promise<MissionRuntimeEvent[] | null> {
    const owner = await this.dbQuery(
      `SELECT 1 FROM mission_runtime_sessions
       WHERE mission_runtime_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4`,
      [id, scope.organizationId, scope.tenantId, scope.userId],
    );
    if (!owner.rows[0]) return null;
    const result = await this.dbQuery(
      `SELECT event.* FROM mission_runtime_events event
       JOIN mission_runtime_sessions session ON session.mission_runtime_id=event.mission_runtime_id
       WHERE event.mission_runtime_id=$1 AND session.organization_id=$2 AND session.tenant_id=$3 AND session.user_id=$4
       ORDER BY event.sequence ASC LIMIT 500`,
      [id, scope.organizationId, scope.tenantId, scope.userId],
    );
    return result.rows.map(eventFromRow);
  }

  async mutateOwned(input: {
    id: string;
    scope: MissionRuntimeScope;
    expectedRevision: number;
    idempotentStatus?: MissionRuntimeStatus;
    directorDecision?: MissionDirectorDecisionWrite;
    derive: (session: MissionRuntimeSession, events: MissionRuntimeEvent[]) => MissionRuntimeMutation;
  }): Promise<MissionRuntimeMutationResult> {
    return withTransaction(async (db) => {
      const selected = await db.query(
        `SELECT ${COLUMNS} FROM mission_runtime_sessions
         WHERE mission_runtime_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4 FOR UPDATE`,
        [input.id, input.scope.organizationId, input.scope.tenantId, input.scope.userId],
      );
      if (!selected.rows[0]) return { kind: "NOT_FOUND" };
      const session = fromRow(selected.rows[0]);
      if (input.idempotentStatus && session.status === input.idempotentStatus) return { kind: "OK", session, event: null };
      if (session.revision !== input.expectedRevision) return { kind: "REVISION_CONFLICT", currentRevision: session.revision };
      const eventRows = await db.query(
        `SELECT * FROM mission_runtime_events WHERE mission_runtime_id=$1 ORDER BY sequence ASC`,
        [input.id],
      );
      const events = eventRows.rows.map(eventFromRow);
      const mutation = input.derive(session, events);
      if (mutation.noChange && input.directorDecision) throw new Error("MISSION_DIRECTOR_APPLY_WITHOUT_MUTATION");
      if (mutation.noChange) return { kind: "OK", session, event: null };
      if (mutation.event && events.length >= 500) return { kind: "EVENT_LIMIT" };
      const eventId = mutation.event ? randomUUID() : null;
      const sequence = mutation.event ? events.length + 1 : null;
      const updated = await db.query(
        `UPDATE mission_runtime_sessions
         SET status=$5, objective_states=$6::jsonb, stage_states=$7::jsonb,
             runtime_state=$8::jsonb, revision=revision+1, updated_at=NOW(),
             paused_at=$9, completed_at=$10, failed_at=$11, abandoned_at=$12, expired_at=$13
         WHERE mission_runtime_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4 AND revision=$14
         RETURNING ${COLUMNS}`,
        [input.id, input.scope.organizationId, input.scope.tenantId, input.scope.userId, mutation.status,
          JSON.stringify(mutation.objectiveStates), JSON.stringify(mutation.stageStates), JSON.stringify(mutation.runtimeState),
          mutation.pausedAt ?? session.pausedAt, mutation.completedAt ?? session.completedAt,
          mutation.failedAt ?? session.failedAt, mutation.abandonedAt ?? session.abandonedAt,
          mutation.expiredAt ?? session.expiredAt, input.expectedRevision],
      );
      if (!updated.rows[0]) return { kind: "REVISION_CONFLICT", currentRevision: session.revision };
      let event: MissionRuntimeEvent | null = null;
      if (mutation.event) {
        const inserted = await db.query(
          `INSERT INTO mission_runtime_events
            (mission_runtime_event_id, mission_runtime_id, sequence, event_type, payload, occurred_at)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING *`,
          [eventId, input.id, sequence, mutation.event.eventType, JSON.stringify(mutation.event.payload), mutation.event.occurredAt],
        );
        event = eventFromRow(inserted.rows[0]);
      }
      if (input.directorDecision) {
        // Same transaction as the runtime mutation: a provenance failure (including an
        // idempotency-key collision) must roll the runtime change back, so no ON CONFLICT here.
        await db.query(
          `INSERT INTO mission_director_decisions
           (director_decision_id, organization_id, tenant_id, mission_runtime_session_id, mission_id,
            mission_version, expected_runtime_revision, observed_runtime_revision, capability, idempotency_key,
            proposal, decision_status, executor_kind, provider_execution_ref, policy_version, context_digest)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,'APPLIED',$12,$13,$14,$15)`,
          [randomUUID(), session.organizationId, session.tenantId, session.id, session.missionId,
            session.missionVersion, input.expectedRevision, session.revision, input.directorDecision.capability,
            input.directorDecision.idempotencyKey, JSON.stringify(input.directorDecision.proposal),
            input.directorDecision.executorKind, input.directorDecision.providerExecutionRef,
            input.directorDecision.policyVersion, input.directorDecision.contextDigest],
        );
      }
      return { kind: "OK", session: fromRow(updated.rows[0]), event };
    });
  }
}
