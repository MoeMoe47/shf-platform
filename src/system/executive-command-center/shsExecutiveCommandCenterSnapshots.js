import { createExecutiveSnapshot } from "./shsExecutiveCommandCenterTypes";

export function createSnapshotFromExecutiveState(state = {}, operatorNote = "") {
  const metrics = state.metrics || {};
  return createExecutiveSnapshot({
    overall_status: state.overall_status,
    overall_readiness_score: state.readiness?.readiness_score,
    overall_health_score: state.health?.health_score,
    layers_total: metrics.total_layers,
    layers_healthy: metrics.healthy_layers,
    layers_attention: metrics.attention_layers,
    layers_blocked: metrics.blocked_layers,
    commands_pending: metrics.commands_pending,
    events_recent: metrics.recent_events,
    jobs_due: metrics.jobs_due,
    alerts_open: metrics.alerts_open,
    workflows_active: metrics.active_workflows,
    agent_tasks_open: metrics.agent_tasks_open,
    governance_items_open: metrics.governance_items_open,
    report_items_open: metrics.reports_needing_attention,
    client_risks: metrics.client_risks,
    revenue_signals: metrics.revenue_signals,
    top_priorities: (state.priorities || []).slice(0, 5),
    top_risks: (state.risks || []).slice(0, 5),
    safe_next_actions: state.safe_next_actions || [],
    data_posture_summary: metrics.data_posture_summary,
    safety_summary: state.safety,
    operator_note: operatorNote,
  });
}

export function compareExecutiveSnapshots(current = {}, previous = {}) {
  if (!previous.snapshot_id) {
    return {
      available: false,
      summary: "No previous local snapshot available for comparison.",
      readiness_delta: 0,
      health_delta: 0,
    };
  }
  return {
    available: true,
    summary: "Local snapshot comparison only; no external export performed.",
    readiness_delta: Number(current.overall_readiness_score || 0) - Number(previous.overall_readiness_score || 0),
    health_delta: Number(current.overall_health_score || 0) - Number(previous.overall_health_score || 0),
    blocked_layer_delta: Number(current.layers_blocked || 0) - Number(previous.layers_blocked || 0),
  };
}
