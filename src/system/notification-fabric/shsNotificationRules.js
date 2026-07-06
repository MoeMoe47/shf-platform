import { SHS_ALERT_TYPES } from "./shsNotificationTypes";

export const SHS_NOTIFICATION_RULES = Object.freeze([
  { alert_type: "governance", label: "Governance alert", severity: "warning", owner_layer: "Governance" },
  { alert_type: "readiness", label: "Readiness alert", severity: "warning", owner_layer: "Readiness Gate" },
  { alert_type: "report", label: "Report alert", severity: "notice", owner_layer: "Reports" },
  { alert_type: "agent", label: "Agent alert", severity: "notice", owner_layer: "Agent Workbench" },
  { alert_type: "workflow", label: "Workflow alert", severity: "notice", owner_layer: "Workflow Engine" },
  { alert_type: "persistence", label: "Persistence alert", severity: "warning", owner_layer: "Durable Persistence" },
  { alert_type: "tracking", label: "Tracking alert", severity: "notice", owner_layer: "Tracking Intelligence" },
  { alert_type: "registry", label: "Registry alert", severity: "info", owner_layer: "System Registry" },
  { alert_type: "scheduler", label: "Scheduler alert", severity: "notice", owner_layer: "Job Scheduler" },
  { alert_type: "system", label: "System alert", severity: "info", owner_layer: "SHS BOS" },
]);

export function getNotificationRule(alertType = "system") {
  return SHS_NOTIFICATION_RULES.find((rule) => rule.alert_type === alertType) || SHS_NOTIFICATION_RULES[9];
}

export function listMissingAlertTypes() {
  const declared = new Set(SHS_NOTIFICATION_RULES.map((rule) => rule.alert_type));
  return SHS_ALERT_TYPES.filter((type) => !declared.has(type));
}

