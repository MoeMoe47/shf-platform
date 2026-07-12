import { clampScore, statusFromScore } from "./shsExecutiveCommandCenterTypes";

function hasLayer(layers, id, predicate = () => true) {
  const layer = layers.find((item) => item.layer_id === id);
  return layer ? predicate(layer) : false;
}

export function calculateExecutiveReadiness(layers = [], safety = {}) {
  let score = 100;
  const deductions = [];
  const criticalBlockers = layers.filter((layer) => layer.status === "blocked" || layer.blockers?.some((item) => String(item).toLowerCase().includes("critical")));

  function deduct(condition, points, reason, detail = {}) {
    if (!condition) return;
    score -= points;
    deductions.push({ reason, points, ...detail });
  }

  deduct(criticalBlockers.length > 0, 30, "critical_blocker_exists", { layers: criticalBlockers.map((layer) => layer.layer_id) });
  deduct(!safety.all_dangerous_flags_false, 25, "dangerous_capability_flag_enabled");
  deduct(hasLayer(layers, "governance_truth_oracle", (layer) => layer.status === "blocked"), 20, "governance_checks_blocked");
  deduct(hasLayer(layers, "governance_truth_oracle", (layer) => ["unavailable", "degraded"].includes(layer.status)), 20, "truth_spine_unavailable_or_failed");
  deduct(!safety.shs_shf_boundary_intact, 20, "route_identity_boundary_failed");
  deduct(hasLayer(layers, "command_bus", (layer) => (layer.metrics?.blocked_commands || 0) > 0), 15, "command_bus_blocked_high_risk_commands");
  deduct(hasLayer(layers, "job_scheduler", (layer) => (layer.metrics?.blocked_count || 0) > 0), 15, "scheduler_failed_or_blocked_jobs");
  deduct(hasLayer(layers, "notification_alert_fabric", (layer) => (layer.metrics?.blocked_count || 0) > 0), 15, "critical_alerts_unresolved");
  deduct(hasLayer(layers, "system_orchestrator", (layer) => (layer.metrics?.blocked_count || 0) > 0), 15, "orchestrator_blocked_plans");
  deduct(hasLayer(layers, "system_registry", (layer) => layer.status === "blocked"), 15, "system_registry_dependency_conflicts");
  deduct(hasLayer(layers, "durable_persistence", (layer) => layer.readiness_score < 80), 10, "persistence_readiness_below_threshold");
  deduct(hasLayer(layers, "tracking_intelligence", (layer) => layer.open_items > 0), 10, "tracking_safety_review_items");
  deduct(hasLayer(layers, "event_bus", (layer) => (layer.metrics?.invalid_events || 0) > 0), 10, "event_bus_invalid_events");
  deduct(hasLayer(layers, "agent_workflow_engine", (layer) => layer.open_items > 0), 10, "agent_workflows_unresolved_blockers");
  deduct(hasLayer(layers, "shs_reports", (layer) => layer.open_items > 0), 10, "report_readiness_unresolved_issues");
  deduct(layers.filter((layer) => ["sample", "unavailable"].includes(layer.data_posture)).length > layers.length / 3, 5, "data_posture_primarily_sample_or_unavailable");

  const readiness_score = clampScore(score);
  return {
    readiness_score,
    status: statusFromScore(readiness_score, criticalBlockers.length > 0),
    deductions,
    critical_blockers: criticalBlockers.map((layer) => layer.layer_id),
  };
}
