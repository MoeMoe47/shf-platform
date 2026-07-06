export const SHS_NOTIFICATION_FABRIC_VERSION = "shs.bos.notification-fabric.v1";

export const SHS_NOTIFICATION_SAFETY_COPY =
  "SHS BOS Notification & Alert Fabric V1 creates internal admin-only operator awareness records. It does not send external email, SMS, push notifications, webhooks, third-party alerts, network delivery, report publishing, production mutation, auth mutation, or warehouse writes.";

export const SHS_ALERT_TYPES = [
  "governance",
  "readiness",
  "report",
  "agent",
  "workflow",
  "persistence",
  "tracking",
  "registry",
  "scheduler",
  "system",
];

export const SHS_ALERT_SEVERITIES = ["info", "notice", "warning", "critical"];
export const SHS_ALERT_STATUSES = ["inbox", "queued", "acknowledged", "escalation_preview", "blocked", "archived"];

export const SHS_NOTIFICATION_DANGEROUS_CAPABILITIES = Object.freeze({
  external_email_enabled: false,
  sms_send_enabled: false,
  webhook_send_enabled: false,
  push_send_enabled: false,
  third_party_alert_enabled: false,
  network_delivery_enabled: false,
  production_mutation_enabled: false,
  public_approval_mutation_enabled: false,
  shf_impact_data_mutation_enabled: false,
  report_publish_enabled: false,
  warehouse_write_enabled: false,
  auth_mutation_enabled: false,
  credential_storage_enabled: false,
});

export function createNotification(input = {}) {
  return {
    notification_id: input.notification_id || `notification_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    alert_type: input.alert_type || "system",
    title: input.title || "Internal operator alert",
    message: input.message || "Local admin awareness record.",
    source_layer: input.source_layer || "SHS BOS",
    entity_type: input.entity_type || "system",
    entity_id: input.entity_id || "",
    severity: input.severity || "info",
    status: input.status || "inbox",
    visibility: "internal_admin_only",
    delivery_mode: "local_inbox_only",
    escalation_path: input.escalation_path || [],
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    safety_status: input.safety_status || "needs_review",
    created_at: input.created_at || new Date().toISOString(),
    updated_at: input.updated_at || new Date().toISOString(),
    operator_note: input.operator_note || "",
  };
}

