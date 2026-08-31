// SHF Ecosystem Phase 12.2 — External Calendar Event Link repo.
import { query } from "../../../db/client.js";

export interface ExternalCalendarEventLinkRow {
  id: string;
  connectionId: string;
  shfProjectionId: string;
  providerEventId: string;
  providerCalendarId: string;
  lastSyncedAt: string;
  suppressedAt: string | null;
}

function fromRow(row: any): ExternalCalendarEventLinkRow {
  return {
    id: row.id,
    connectionId: row.connection_id,
    shfProjectionId: row.shf_projection_id,
    providerEventId: row.provider_event_id,
    providerCalendarId: row.provider_calendar_id,
    lastSyncedAt: row.last_synced_at,
    suppressedAt: row.suppressed_at,
  };
}

export class ExternalCalendarEventLinkRepo {
  async listForConnection(connectionId: string): Promise<ExternalCalendarEventLinkRow[]> {
    const res = await query(`SELECT * FROM external_calendar_event_links WHERE connection_id = $1`, [connectionId]);
    return res.rows.map(fromRow);
  }

  async findForConnectionAndProjection(connectionId: string, shfProjectionId: string): Promise<ExternalCalendarEventLinkRow | null> {
    const res = await query(
      `SELECT * FROM external_calendar_event_links WHERE connection_id = $1 AND shf_projection_id = $2`,
      [connectionId, shfProjectionId],
    );
    return res.rows[0] ? fromRow(res.rows[0]) : null;
  }

  async upsert(id: string, connectionId: string, shfProjectionId: string, providerEventId: string, providerCalendarId: string): Promise<ExternalCalendarEventLinkRow> {
    const res = await query(
      `INSERT INTO external_calendar_event_links (id, connection_id, shf_projection_id, provider_event_id, provider_calendar_id, last_synced_at, suppressed_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NULL, NOW())
       ON CONFLICT (connection_id, shf_projection_id) DO UPDATE SET
         provider_event_id = EXCLUDED.provider_event_id,
         provider_calendar_id = EXCLUDED.provider_calendar_id,
         last_synced_at = NOW(),
         updated_at = NOW()
       RETURNING *`,
      [id, connectionId, shfProjectionId, providerEventId, providerCalendarId],
    );
    return fromRow(res.rows[0]);
  }

  async suppress(connectionId: string, shfProjectionId: string): Promise<void> {
    await query(
      `UPDATE external_calendar_event_links SET suppressed_at = NOW(), updated_at = NOW()
       WHERE connection_id = $1 AND shf_projection_id = $2`,
      [connectionId, shfProjectionId],
    );
  }

  async delete(connectionId: string, shfProjectionId: string): Promise<void> {
    await query(`DELETE FROM external_calendar_event_links WHERE connection_id = $1 AND shf_projection_id = $2`, [connectionId, shfProjectionId]);
  }

  async deleteAllForConnection(connectionId: string): Promise<void> {
    await query(`DELETE FROM external_calendar_event_links WHERE connection_id = $1`, [connectionId]);
  }
}
