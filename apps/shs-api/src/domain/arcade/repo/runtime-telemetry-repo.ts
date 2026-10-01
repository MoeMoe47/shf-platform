import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import type { ArcadeRuntimeTelemetryEvent, ArcadeRuntimeTelemetryEventType } from "../model/runtime-telemetry.js";

function fromRow(row: any): ArcadeRuntimeTelemetryEvent {
  const iso = (value: any) => value instanceof Date ? value.toISOString() : value;
  return {
    id: row.runtime_event_id,
    sessionId: row.session_id,
    sequence: Number(row.sequence),
    eventType: row.event_type,
    occurredAt: iso(row.occurred_at),
    serverReceivedAt: iso(row.server_received_at),
    payload: row.payload,
  };
}

export class ArcadeRuntimeTelemetryRepo {
  constructor(private readonly dbQuery: typeof query = query) {}

  async appendForOwner(input: {
    sessionId: string;
    organizationId: string;
    tenantId: string;
    userId: string;
    sequence: number;
    eventType: ArcadeRuntimeTelemetryEventType;
    occurredAt: string;
    payload: string;
  }): Promise<{ event: ArcadeRuntimeTelemetryEvent | null; sessionFound: boolean; status: string | null; currentSequence: number }> {
    return withTransaction(async (db) => {
      const sessionResult = await db.query(
        `SELECT status FROM arcade_runtime_sessions
         WHERE runtime_session_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4
         FOR UPDATE`,
        [input.sessionId, input.organizationId, input.tenantId, input.userId],
      );
      if (!sessionResult.rows[0]) return { event: null, sessionFound: false, status: null, currentSequence: 0 };
      const status = String(sessionResult.rows[0].status);
      if (status !== "ACTIVE") return { event: null, sessionFound: true, status, currentSequence: 0 };

      const sequenceResult = await db.query(
        "SELECT COALESCE(MAX(sequence),0)::int AS current_sequence FROM arcade_runtime_events WHERE session_id=$1",
        [input.sessionId],
      );
      const currentSequence = Number(sequenceResult.rows[0]?.current_sequence || 0);
      if (input.sequence !== currentSequence + 1) {
        return { event: null, sessionFound: true, status, currentSequence };
      }

      const inserted = await db.query(
        `INSERT INTO arcade_runtime_events
          (runtime_event_id, session_id, sequence, event_type, occurred_at, payload)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb)
         ON CONFLICT (session_id, sequence) DO NOTHING
         RETURNING runtime_event_id, session_id, sequence, event_type, occurred_at, server_received_at, payload`,
        [randomUUID(), input.sessionId, input.sequence, input.eventType, input.occurredAt, input.payload],
      );
      if (!inserted.rows[0]) {
        return { event: null, sessionFound: true, status, currentSequence };
      }
      return { event: fromRow(inserted.rows[0]), sessionFound: true, status, currentSequence };
    });
  }

  async listForOwner(input: {
    sessionId: string;
    organizationId: string;
    tenantId: string;
    userId: string;
    afterSequence: number;
    limit: number;
  }): Promise<ArcadeRuntimeTelemetryEvent[] | null> {
    const result = await this.dbQuery(
      `SELECT event.runtime_event_id, event.session_id, event.sequence, event.event_type,
              event.occurred_at, event.server_received_at, event.payload
       FROM arcade_runtime_events event
       JOIN arcade_runtime_sessions session ON session.runtime_session_id=event.session_id
       WHERE event.session_id=$1 AND session.organization_id=$2 AND session.tenant_id=$3 AND session.user_id=$4
         AND event.sequence > $5
       ORDER BY event.sequence ASC
       LIMIT $6`,
      [input.sessionId, input.organizationId, input.tenantId, input.userId, input.afterSequence, input.limit],
    );
    const owner = await this.dbQuery(
      `SELECT 1 FROM arcade_runtime_sessions
       WHERE runtime_session_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4`,
      [input.sessionId, input.organizationId, input.tenantId, input.userId],
    );
    if (!owner.rows[0]) return null;
    return result.rows.map(fromRow);
  }
}
