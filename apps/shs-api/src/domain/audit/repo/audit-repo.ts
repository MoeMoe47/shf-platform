import { query } from "../../../db/client.js";

export class AuditRepo {
  async listAuditEvents(scope: { organization_id: string; tenant_id?: string }) {
    const res = await query(
      `SELECT audit_event_id, organization_id, actor_user_id, target_object_type, target_object_id,
              action_type, reason_text, correlation_id, source_channel, event_timestamp, created_at
       FROM audit_events
       WHERE organization_id = $1
       ORDER BY event_timestamp DESC`,
      [scope.organization_id]
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
