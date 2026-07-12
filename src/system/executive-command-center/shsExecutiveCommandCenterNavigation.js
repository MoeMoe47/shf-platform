export const EXECUTIVE_NAVIGATION_TARGETS = Object.freeze({
  system_registry: "admin.html#/ops/system-registry",
  system_orchestrator: "admin.html#/ops/orchestrator",
  command_bus: "admin.html#/ops/command-bus",
  event_bus: "admin.html#/ops/event-bus",
  job_scheduler: "admin.html#/ops/scheduler",
  notification_alert_fabric: "admin.html#/ops/notifications",
  tracking_intelligence: "admin.html#/ops/tracking",
  durable_persistence: "admin.html#/ops/persistence",
  agent_workbench: "admin.html#/ops/agents",
  agent_workflow_engine: "admin.html#/ops/agents",
  controlled_executor: "admin.html#/ops/agents",
  production_automation: "admin.html#/ops/production",
  direct_connect_proof: "admin.html#/ops/direct-connect",
  shs_reports: "admin.html#/ops/reports",
  governance_truth_oracle: "admin.html#/truth-spine",
  client_operations_business_signals: "admin.html#/hub",
});

export function getExecutiveNavigationTarget(layerId) {
  return EXECUTIVE_NAVIGATION_TARGETS[layerId] || "admin.html#/ops/executive-command";
}

export function buildSafeNavigationLink(layer = {}) {
  return {
    layer_id: layer.layer_id,
    label: layer.layer_name || layer.layer_id,
    route: layer.route || getExecutiveNavigationTarget(layer.layer_id),
    admin_only: true,
    external: false,
  };
}

export function listExecutiveNavigationLinks(layers = []) {
  return layers.map(buildSafeNavigationLink);
}
