export function calculateExecutiveMetrics(layers = []) {
  const byStatus = layers.reduce((acc, layer) => {
    acc[layer.status] = (acc[layer.status] || 0) + 1;
    return acc;
  }, {});
  const byPosture = layers.reduce((acc, layer) => {
    acc[layer.data_posture] = (acc[layer.data_posture] || 0) + 1;
    return acc;
  }, {});
  const find = (id) => layers.find((layer) => layer.layer_id === id) || {};

  return {
    total_layers: layers.length,
    healthy_layers: byStatus.healthy || 0,
    ready_layers: byStatus.ready || 0,
    attention_layers: byStatus.attention || 0,
    blocked_layers: byStatus.blocked || 0,
    degraded_layers: byStatus.degraded || 0,
    unavailable_layers: byStatus.unavailable || 0,
    active_workflows: find("agent_workflow_engine").open_items || 0,
    commands_pending: find("command_bus").metrics?.queued_commands || 0,
    recent_events: find("event_bus").metrics?.total_events || 0,
    jobs_due: (find("job_scheduler").metrics?.queued_count || 0) + (find("job_scheduler").metrics?.delayed_count || 0),
    alerts_open: (find("notification_alert_fabric").metrics?.inbox_count || 0) + (find("notification_alert_fabric").metrics?.queued_count || 0),
    agent_tasks_open: find("agent_workbench").open_items || 0,
    reports_needing_attention: find("shs_reports").open_items || 0,
    governance_items_open: find("governance_truth_oracle").open_items || 0,
    client_risks: 1,
    revenue_signals: 1,
    data_posture_summary: byPosture,
  };
}
