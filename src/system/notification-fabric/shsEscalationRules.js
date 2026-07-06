export const SHS_ESCALATION_RULES = Object.freeze([
  { severity: "info", preview_path: ["operator_inbox"], sla_minutes: 240 },
  { severity: "notice", preview_path: ["operator_inbox", "owner_review"], sla_minutes: 120 },
  { severity: "warning", preview_path: ["operator_inbox", "owner_review", "governance_review"], sla_minutes: 60 },
  { severity: "critical", preview_path: ["operator_inbox", "owner_review", "governance_review", "release_engineering_review"], sla_minutes: 30 },
]);

export function createEscalationPreview(notification = {}) {
  const rule = SHS_ESCALATION_RULES.find((item) => item.severity === notification.severity) || SHS_ESCALATION_RULES[0];
  return {
    notification_id: notification.notification_id,
    severity: notification.severity || "info",
    preview_path: rule.preview_path,
    sla_minutes: rule.sla_minutes,
    local_preview_only: true,
    external_delivery: false,
  };
}

