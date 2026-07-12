export const SHS_EXECUTIVE_COMMAND_CENTER_VERSION = "shs.bos.executive-command-center.v1";

export const SHS_EXECUTIVE_COMMAND_CENTER_ROUTE = "admin.html#/ops/executive-command";

export const SHS_EXECUTIVE_COMMAND_CENTER_SAFETY_STATEMENT =
  "SHS BOS Executive Command Center V1 provides governed visibility, triage, safe previews, and navigation across internal operating layers. It does not autonomously execute commands, mutate production systems, publish reports, change public approval, mutate SHF Impact Data, send external messages, write warehouse records, modify authentication, or create live external integrations.";

export const DATA_POSTURES = Object.freeze([
  "live_local",
  "persisted_local",
  "derived_local",
  "sample",
  "unavailable",
  "needs_review",
]);

export const LAYER_STATUSES = Object.freeze([
  "healthy",
  "ready",
  "attention",
  "blocked",
  "degraded",
  "unavailable",
  "needs_review",
]);

export const LAYER_CATEGORIES = Object.freeze([
  "governance",
  "runtime",
  "intelligence",
  "operations",
  "agents",
  "reports",
  "integration",
  "business",
]);

export const PRIORITY_LEVELS = Object.freeze(["P0", "P1", "P2", "P3", "P4"]);

export const SHS_EXECUTIVE_DANGEROUS_FLAGS = Object.freeze({
  execution_enabled: false,
  autonomous_execution_enabled: false,
  production_mutation_enabled: false,
  public_publish_enabled: false,
  public_approved_mutation_enabled: false,
  shf_impact_data_mutation_enabled: false,
  external_delivery_enabled: false,
  webhook_delivery_enabled: false,
  email_delivery_enabled: false,
  sms_delivery_enabled: false,
  push_delivery_enabled: false,
  warehouse_write_enabled: false,
  auth_mutation_enabled: false,
  shell_execution_enabled: false,
  python_execution_enabled: false,
  external_api_enabled: false,
  banking_connection_enabled: false,
  oauth_connection_enabled: false,
  payment_execution_enabled: false,
});

export const EXECUTIVE_SOURCE_GROUPS = Object.freeze([
  "system_registry",
  "system_orchestrator",
  "command_bus",
  "event_bus",
  "job_scheduler",
  "notification_alert_fabric",
  "tracking_intelligence",
  "durable_persistence",
  "agent_workbench",
  "agent_workflow_engine",
  "controlled_executor",
  "production_automation",
  "direct_connect_proof",
  "shs_reports",
  "governance_truth_oracle",
  "client_operations_business_signals",
]);

export function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

export function statusFromScore(score, hasCriticalBlocker = false) {
  const value = clampScore(score);
  if (hasCriticalBlocker || value === 0) return "blocked";
  if (value >= 90) return "healthy";
  if (value >= 80) return "ready";
  if (value >= 60) return "attention";
  return "degraded";
}

export function createLayerStatus(input = {}) {
  const readiness = clampScore(input.readiness_score ?? 75);
  const health = clampScore(input.health_score ?? readiness);
  const blockers = Array.isArray(input.blockers) ? input.blockers : [];
  const warnings = Array.isArray(input.warnings) ? input.warnings : [];
  const dangerous = Boolean(input.dangerous_flags_enabled);
  const unavailable = input.data_posture === "unavailable";
  return {
    layer_id: input.layer_id || "unknown_layer",
    layer_name: input.layer_name || "Unknown Layer",
    category: input.category || "operations",
    route: input.route || "",
    status: input.status || (unavailable ? "unavailable" : statusFromScore(Math.min(readiness, health), blockers.some((item) => String(item).toLowerCase().includes("critical")) || dangerous)),
    readiness_score: readiness,
    health_score: health,
    data_posture: DATA_POSTURES.includes(input.data_posture) ? input.data_posture : "needs_review",
    open_items: Number(input.open_items || blockers.length + warnings.length || 0),
    blockers,
    warnings,
    last_activity_at: input.last_activity_at ?? null,
    last_validated_at: input.last_validated_at ?? null,
    source_reference: input.source_reference || "not_verified",
    admin_only: input.admin_only !== false,
    dangerous_flags_enabled: dangerous,
    metrics: input.metrics || {},
  };
}

export function createPriority(input = {}) {
  return {
    priority_id: input.priority_id || `priority_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    priority_level: PRIORITY_LEVELS.includes(input.priority_level) ? input.priority_level : "P3",
    title: input.title || "Review operating item",
    summary: input.summary || "Operator review recommended.",
    source_layer: input.source_layer || "SHS BOS",
    entity_type: input.entity_type || "layer",
    entity_id: input.entity_id || "",
    reason: input.reason || "deterministic_local_rule",
    risk_level: input.risk_level || "medium",
    recommended_route: input.recommended_route || "admin.html#/ops/executive-command",
    recommended_action: input.recommended_action || "Review source layer.",
    approval_required: input.approval_required !== false,
    execution_enabled: false,
    reviewed: Boolean(input.reviewed),
  };
}

export function createExecutiveSnapshot(input = {}) {
  return {
    snapshot_id: input.snapshot_id || `exec_snapshot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: input.created_at || new Date().toISOString(),
    created_by: "local_operator",
    overall_status: input.overall_status || "attention",
    overall_readiness_score: clampScore(input.overall_readiness_score),
    overall_health_score: clampScore(input.overall_health_score),
    layers_total: Number(input.layers_total || 0),
    layers_healthy: Number(input.layers_healthy || 0),
    layers_attention: Number(input.layers_attention || 0),
    layers_blocked: Number(input.layers_blocked || 0),
    commands_pending: Number(input.commands_pending || 0),
    events_recent: Number(input.events_recent || 0),
    jobs_due: Number(input.jobs_due || 0),
    alerts_open: Number(input.alerts_open || 0),
    workflows_active: Number(input.workflows_active || 0),
    agent_tasks_open: Number(input.agent_tasks_open || 0),
    governance_items_open: Number(input.governance_items_open || 0),
    report_items_open: Number(input.report_items_open || 0),
    client_risks: Number(input.client_risks || 0),
    revenue_signals: Number(input.revenue_signals || 0),
    top_priorities: input.top_priorities || [],
    top_risks: input.top_risks || [],
    safe_next_actions: input.safe_next_actions || [],
    data_posture_summary: input.data_posture_summary || {},
    safety_summary: input.safety_summary || {},
    operator_note: input.operator_note || "",
  };
}
