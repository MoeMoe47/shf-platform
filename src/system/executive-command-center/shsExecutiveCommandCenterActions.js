import { scanExecutiveSafety } from "./shsExecutiveCommandCenterSafety";

export function createCommandPreviewIntent(layer = {}) {
  const preview = {
    intent_type: "command_preview",
    preview_only: true,
    execution_enabled: false,
    source_layer: "SHS BOS Executive Command Center",
    target_layer: layer.layer_name || "Command Bus",
    recommended_route: "admin.html#/ops/command-bus",
    payload: {
      review_layer_id: layer.layer_id || "system",
      requested_action: "review_only",
      dispatch_requested: false,
    },
  };
  return { ...preview, safety: scanExecutiveSafety(preview) };
}

export function createOrchestrationPreviewIntent(priority = {}) {
  const preview = {
    intent_type: "orchestration_preview",
    preview_only: true,
    execution_enabled: false,
    source_layer: "SHS BOS Executive Command Center",
    target_layer: "System Orchestrator",
    recommended_route: "admin.html#/ops/orchestrator",
    payload: {
      priority_id: priority.priority_id || "",
      activate_requested: false,
      mutation_requested: false,
    },
  };
  return { ...preview, safety: scanExecutiveSafety(preview) };
}

export function buildSafeNextActions(priorities = [], layers = []) {
  const top = priorities[0];
  const firstLayer = layers.find((layer) => layer.layer_id === top?.entity_id) || layers[0] || {};
  return [
    {
      action_id: "refresh_local_summaries",
      label: "Refresh local summaries",
      action_type: "local_refresh",
      preview_only: true,
      execution_enabled: false,
      route: "admin.html#/ops/executive-command",
    },
    {
      action_id: "open_top_priority_source",
      label: "Open top priority source",
      action_type: "safe_navigation",
      preview_only: true,
      execution_enabled: false,
      route: top?.recommended_route || firstLayer.route || "admin.html#/ops/executive-command",
    },
    {
      action_id: "prepare_command_preview",
      label: "Prepare Command Bus preview",
      action_type: "command_preview",
      preview_only: true,
      execution_enabled: false,
      route: "admin.html#/ops/command-bus",
      preview: createCommandPreviewIntent(firstLayer),
    },
    {
      action_id: "prepare_orchestration_preview",
      label: "Prepare Orchestrator preview",
      action_type: "orchestration_preview",
      preview_only: true,
      execution_enabled: false,
      route: "admin.html#/ops/orchestrator",
      preview: createOrchestrationPreviewIntent(top),
    },
  ];
}
