import { query } from "../../../db/client.js";
import type { ArcadeRuntimeSaveState } from "../model/runtime-save-state.js";

function fromRow(row: any): ArcadeRuntimeSaveState {
  const iso = (value: any) => value instanceof Date ? value.toISOString() : value;
  return {
    sessionId: row.session_id,
    revision: Number(row.revision),
    payload: row.payload,
    savedAt: iso(row.saved_at),
    updatedAt: iso(row.updated_at),
  };
}

export class ArcadeRuntimeSaveStateRepo {
  constructor(private readonly dbQuery: typeof query = query) {}

  async getForOwner(sessionId: string, organizationId: string, tenantId: string, userId: string): Promise<ArcadeRuntimeSaveState | null> {
    const result = await this.dbQuery(
      `SELECT save.session_id, save.revision, save.payload, save.saved_at, save.updated_at
       FROM arcade_runtime_save_states save
       JOIN arcade_runtime_sessions session ON session.runtime_session_id=save.session_id
       WHERE save.session_id=$1 AND session.organization_id=$2 AND session.tenant_id=$3 AND session.user_id=$4`,
      [sessionId, organizationId, tenantId, userId],
    );
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  async saveWithExpectedRevision(input: {
    sessionId: string;
    organizationId: string;
    tenantId: string;
    userId: string;
    expectedRevision: number;
    payload: string;
  }): Promise<ArcadeRuntimeSaveState | null> {
    const result = await this.dbQuery(
      `WITH scoped_session AS MATERIALIZED (
         SELECT runtime_session_id
         FROM arcade_runtime_sessions
         WHERE runtime_session_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4
           AND status IN ('ACTIVE','PAUSED')
         FOR UPDATE
       )
       INSERT INTO arcade_runtime_save_states (session_id, revision, payload, saved_at, created_at, updated_at)
       SELECT scoped_session.runtime_session_id, 1, $6::jsonb, NOW(), NOW(), NOW()
       FROM scoped_session
       WHERE $5=0 OR EXISTS (
           SELECT 1 FROM arcade_runtime_save_states existing
           WHERE existing.session_id=scoped_session.runtime_session_id
         )
       ON CONFLICT (session_id) DO UPDATE
       SET revision=arcade_runtime_save_states.revision+1,
           payload=EXCLUDED.payload,
           saved_at=NOW(),
           updated_at=NOW()
       WHERE arcade_runtime_save_states.revision=$5
       RETURNING session_id, revision, payload, saved_at, updated_at`,
      [input.sessionId, input.organizationId, input.tenantId, input.userId, input.expectedRevision, input.payload],
    );
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }
}
