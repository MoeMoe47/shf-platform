import { query } from "../../../db/client.js";

export async function writeAuditEvent(input: {
  audit_event_id: string;
  organization_id: string;
  actor_user_id?: string | null;
  actor_system_id?: string | null;
  target_object_type: string;
  target_object_id: string;
  action_type: string;
  previous_state_json?: unknown;
  new_state_json?: unknown;
  reason_code?: string | null;
  reason_text?: string | null;
  correlation_id: string;
  source_channel: string;
}, executor: any = { query }) {
  const res = await executor.query(
    `INSERT INTO audit_events (
      audit_event_id, organization_id, actor_user_id, actor_system_id,
      target_object_type, target_object_id, action_type,
      previous_state_json, new_state_json, reason_code, reason_text,
      correlation_id, source_channel
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11,$12,$13)
    RETURNING audit_event_id, organization_id, actor_user_id, target_object_type, target_object_id,
              action_type, reason_text, correlation_id, source_channel, event_timestamp, created_at`,
    [
      input.audit_event_id,
      input.organization_id,
      input.actor_user_id || null,
      input.actor_system_id || null,
      input.target_object_type,
      input.target_object_id,
      input.action_type,
      input.previous_state_json ? JSON.stringify(input.previous_state_json) : null,
      input.new_state_json ? JSON.stringify(input.new_state_json) : null,
      input.reason_code || null,
      input.reason_text || null,
      input.correlation_id,
      input.source_channel,
    ]
  );
  return res.rows[0];
}
