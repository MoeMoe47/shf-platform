import { createPriority } from "./shsExecutiveCommandCenterTypes";

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };

export function rankExecutivePriorities(layers = [], reviewedIds = []) {
  const priorities = [];
  layers.forEach((layer) => {
    if (layer.status === "blocked") {
      priorities.push(createPriority({
        priority_id: `priority_${layer.layer_id}_blocked`,
        priority_level: "P0",
        title: `${layer.layer_name} is blocked`,
        summary: layer.blockers?.[0] || "Layer reports a blocker.",
        source_layer: layer.layer_name,
        entity_id: layer.layer_id,
        reason: "blocked_layer",
        risk_level: "critical",
        recommended_route: layer.route,
        recommended_action: "Open source layer and resolve blocker before next operational step.",
        approval_required: true,
        execution_enabled: false,
        reviewed: reviewedIds.includes(`priority_${layer.layer_id}_blocked`),
      }));
    } else if (layer.dangerous_flags_enabled) {
      priorities.push(createPriority({
        priority_id: `priority_${layer.layer_id}_dangerous_flag`,
        priority_level: "P0",
        title: `${layer.layer_name} dangerous flag review`,
        summary: "A dangerous capability flag is enabled.",
        source_layer: layer.layer_name,
        entity_id: layer.layer_id,
        reason: "dangerous_capability_flag",
        risk_level: "critical",
        recommended_route: layer.route,
        approval_required: true,
        execution_enabled: false,
      }));
    } else if (layer.open_items > 0 || layer.status === "attention") {
      priorities.push(createPriority({
        priority_id: `priority_${layer.layer_id}_attention`,
        priority_level: layer.category === "governance" ? "P1" : "P2",
        title: `${layer.layer_name} needs attention`,
        summary: layer.warnings?.[0] || `${layer.open_items} open local item(s).`,
        source_layer: layer.layer_name,
        entity_id: layer.layer_id,
        reason: "open_items_or_attention_status",
        risk_level: layer.category === "governance" ? "high" : "medium",
        recommended_route: layer.route,
        recommended_action: "Review source posture and clear local open items.",
        approval_required: true,
        execution_enabled: false,
        reviewed: reviewedIds.includes(`priority_${layer.layer_id}_attention`),
      }));
    } else if (["sample", "unavailable", "needs_review"].includes(layer.data_posture)) {
      priorities.push(createPriority({
        priority_id: `priority_${layer.layer_id}_posture`,
        priority_level: "P4",
        title: `${layer.layer_name} data posture review`,
        summary: `Current posture is ${layer.data_posture}.`,
        source_layer: layer.layer_name,
        entity_id: layer.layer_id,
        reason: "data_posture_truthfulness",
        risk_level: "low",
        recommended_route: layer.route,
        recommended_action: "Confirm whether a stable source summary is available.",
        approval_required: true,
        execution_enabled: false,
        reviewed: reviewedIds.includes(`priority_${layer.layer_id}_posture`),
      }));
    }
  });

  return priorities.sort((a, b) => PRIORITY_ORDER[a.priority_level] - PRIORITY_ORDER[b.priority_level]);
}
