import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import type { ArcadeRuntimeSession, ArcadeRuntimeSessionAction, ArcadeRuntimeSessionStatus } from "../model/runtime-session.js";

function fromRow(row: any): ArcadeRuntimeSession {
  const iso = (value: any) => value instanceof Date ? value.toISOString() : value;
  return {
    id: row.runtime_session_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    experienceId: row.experience_id,
    arcadeActivityId: row.arcade_activity_id,
    family: row.family,
    sessionType: row.session_type,
    status: row.status,
    startedAt: iso(row.started_at),
    lastActivityAt: iso(row.last_activity_at),
    completedAt: iso(row.completed_at),
    abandonedAt: iso(row.abandoned_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    version: Number(row.version),
  };
}

const COLUMNS = `runtime_session_id, organization_id, tenant_id, user_id, experience_id,
  arcade_activity_id, family, session_type, status, started_at, last_activity_at,
  completed_at, abandoned_at, created_at, updated_at, version`;

export class ArcadeRuntimeSessionRepo {
  constructor(private readonly dbQuery: typeof query = query) {}

  async start(input: {
    organizationId: string; tenantId: string; userId: string; experienceId: string;
    arcadeActivityId: string | null; family: string; sessionType: string; idempotencyKey: string | null;
  }): Promise<{ session: ArcadeRuntimeSession; reused: boolean }> {
    const sessionId = `arcade_runtime_${randomUUID()}`;
    const inserted = await this.dbQuery(
      `INSERT INTO arcade_runtime_sessions
        (runtime_session_id, organization_id, tenant_id, user_id, experience_id, arcade_activity_id, family, session_type, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (organization_id, tenant_id, user_id, idempotency_key)
         WHERE idempotency_key IS NOT NULL DO NOTHING
       RETURNING ${COLUMNS}`,
      [sessionId, input.organizationId, input.tenantId, input.userId, input.experienceId, input.arcadeActivityId, input.family, input.sessionType, input.idempotencyKey],
    );
    if (inserted.rows[0]) return { session: fromRow(inserted.rows[0]), reused: false };
    const existing = await this.dbQuery(
      `SELECT ${COLUMNS} FROM arcade_runtime_sessions
       WHERE organization_id=$1 AND tenant_id=$2 AND user_id=$3 AND idempotency_key=$4`,
      [input.organizationId, input.tenantId, input.userId, input.idempotencyKey],
    );
    if (!existing.rows[0]) throw new Error("RUNTIME_SESSION_START_CONFLICT");
    return { session: fromRow(existing.rows[0]), reused: true };
  }

  async getForOwner(id: string, organizationId: string, tenantId: string, userId: string): Promise<ArcadeRuntimeSession | null> {
    const result = await this.dbQuery(
      `SELECT ${COLUMNS} FROM arcade_runtime_sessions
       WHERE runtime_session_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4`,
      [id, organizationId, tenantId, userId],
    );
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  async listForOwner(organizationId: string, tenantId: string, userId: string, status?: ArcadeRuntimeSessionStatus): Promise<ArcadeRuntimeSession[]> {
    const result = await this.dbQuery(
      `SELECT ${COLUMNS} FROM arcade_runtime_sessions
       WHERE organization_id=$1 AND tenant_id=$2 AND user_id=$3 AND ($4::text IS NULL OR status=$4)
       ORDER BY created_at DESC, runtime_session_id DESC LIMIT 50`,
      [organizationId, tenantId, userId, status ?? null],
    );
    return result.rows.map(fromRow);
  }

  async transition(input: {
    id: string; organizationId: string; tenantId: string; userId: string;
    action: ArcadeRuntimeSessionAction; allowedStatuses: ArcadeRuntimeSessionStatus[];
  }): Promise<ArcadeRuntimeSession | null> {
    const statusByAction: Record<ArcadeRuntimeSessionAction, ArcadeRuntimeSessionStatus> = {
      PAUSE: "PAUSED", RESUME: "ACTIVE", COMPLETE: "COMPLETED", ABANDON: "ABANDONED",
    };
    const result = await this.dbQuery(
      `UPDATE arcade_runtime_sessions
       SET status=$5,
           last_activity_at=NOW(), updated_at=NOW(), version=version+1,
           completed_at=CASE WHEN $6='COMPLETE' THEN NOW() ELSE completed_at END,
           abandoned_at=CASE WHEN $6='ABANDON' THEN NOW() ELSE abandoned_at END
       WHERE runtime_session_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4
         AND status=ANY($7::text[])
       RETURNING ${COLUMNS}`,
      [input.id, input.organizationId, input.tenantId, input.userId, statusByAction[input.action], input.action, input.allowedStatuses],
    );
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }
}
