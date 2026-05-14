export interface AuditEvent {
  audit_event_id: string;
  organization_id: string;
  actor_user_id?: string | null;
  target_object_type: string;
  target_object_id: string;
  action_type: string;
  correlation_id: string;
  source_channel: string;
  reason_text?: string | null;
  event_timestamp?: string;
}
