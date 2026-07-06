import { SHS_NOTIFICATION_DANGEROUS_CAPABILITIES, SHS_NOTIFICATION_SAFETY_COPY } from "./shsNotificationTypes";

const BLOCKED_KEY_PATTERNS = [
  /email/i,
  /sms/i,
  /phone/i,
  /webhook/i,
  /push/i,
  /third[_-]?party/i,
  /credential/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /oauth/i,
  /private[_-]?key/i,
  /warehouse/i,
  /public_approved/i,
  /shf_impact_data/i,
];

const BLOCKED_VALUE_PATTERNS = [
  /send email/i,
  /send sms/i,
  /send webhook/i,
  /push notification/i,
  /third-party alert/i,
  /external delivery/i,
  /publish report/i,
  /write warehouse/i,
  /mutate production/i,
  /bearer\s+/i,
  /oauth/i,
];

function scanPayload(value, path = "payload") {
  const issues = [];
  if (value == null) return issues;
  if (typeof value === "string") {
    BLOCKED_VALUE_PATTERNS.forEach((pattern) => {
      if (pattern.test(value)) issues.push({ path, reason: `blocked value pattern: ${pattern.source}`, severity: "critical" });
    });
    return issues;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => issues.push(...scanPayload(item, `${path}[${index}]`)));
    return issues;
  }
  if (typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      BLOCKED_KEY_PATTERNS.forEach((pattern) => {
        if (pattern.test(key)) issues.push({ path: `${path}.${key}`, reason: `blocked key pattern: ${pattern.source}`, severity: "critical" });
      });
      issues.push(...scanPayload(nested, `${path}.${key}`));
    });
  }
  return issues;
}

export function scanNotificationSafety(notification = {}) {
  const issues = [];
  if (notification.visibility && notification.visibility !== "internal_admin_only") {
    issues.push({ path: "visibility", reason: "notifications must remain internal_admin_only", severity: "critical" });
  }
  if (notification.delivery_mode && notification.delivery_mode !== "local_inbox_only") {
    issues.push({ path: "delivery_mode", reason: "external delivery is blocked in V1", severity: "critical" });
  }
  Object.entries(SHS_NOTIFICATION_DANGEROUS_CAPABILITIES).forEach(([flag, enabled]) => {
    if (enabled) issues.push({ path: flag, reason: "dangerous notification capability enabled", severity: "critical" });
  });
  issues.push(...scanPayload(notification.payload || {}));
  const critical = issues.filter((issue) => issue.severity === "critical");
  return {
    safe: critical.length === 0,
    safety_status: critical.length ? "blocked" : "allowed",
    issue_count: issues.length,
    issues,
    dangerous_capabilities: SHS_NOTIFICATION_DANGEROUS_CAPABILITIES,
    safety_copy: SHS_NOTIFICATION_SAFETY_COPY,
  };
}

export function createBlockedExternalDeliveryPreview() {
  return scanNotificationSafety({
    visibility: "internal_admin_only",
    delivery_mode: "local_inbox_only",
    payload: {
      blocked_email_marker: "send email",
      blocked_sms_marker: "send sms",
      blocked_webhook_marker: "send webhook",
      blocked_push_marker: "push notification",
    },
  });
}

