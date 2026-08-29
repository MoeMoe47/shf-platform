import { query } from "../../../db/client.js";

export class AuditRepo {
  async listAuditEvents() {
    const res = await query(
      `SELECT audit_event_id, organization_id, actor_user_id, target_object_type, target_object_id,
              action_type, reason_text, correlation_id, source_channel, event_timestamp, created_at
       FROM audit_events
       ORDER BY event_timestamp DESC`
    );
    return res.rows;
  }

  async getAuditEventById(auditEventId: string) {
    const res = await query(
      `SELECT audit_event_id, organization_id, actor_user_id, target_object_type, target_object_id,
              action_type, reason_text, correlation_id, source_channel, event_timestamp, created_at
       FROM audit_events
       WHERE audit_event_id = $1
       LIMIT 1`,
      [auditEventId]
    );
    return res.rows[0] || null;
  }
}
