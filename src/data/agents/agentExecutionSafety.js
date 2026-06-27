import { getLatestApprovalForTask } from "./agentApprovalLedger";

export const AGENT_EXECUTION_ALLOWED_ACTION_TYPES = [
  "create_execution_record",
  "mark_task_simulated_complete",
  "add_operator_note",
  "attach_context_packet",
  "create_recommendation_packet",
  "mark_workflow_step_reviewed",
  "mark_coordination_handoff_reviewed",
];

export const AGENT_EXECUTION_BLOCKED_ACTION_TYPES = [
  "publish_report",
  "mark_public_approved",
  "mutate_shf_impact_data",
  "send_webhook",
  "send_notification",
  "write_warehouse_record",
  "mutate_auth",
  "mutate_production_record",
  "execute_shell",
  "call_external_api",
  "write_arbitrary_file",
  "bypass_approval",
  "bypass_governance",
];

export const AGENT_EXECUTION_DANGEROUS_FLAGS_FALSE = {
  production_action_executed: false,
  report_published: false,
  public_data_mutated: false,
  public_approved_mutated: false,
  shf_impact_data_mutated: false,
  external_message_sent: false,
  webhook_sent: false,
  notification_sent: false,
  warehouse_write_performed: false,
  auth_modified: false,
};

export const AGENT_EXECUTION_PAYLOAD_BLOCKED_KEYS = [
  "production_action_executed",
  "report_published",
  "public_data_mutated",
  "public_approved",
  "public_approved_mutated",
  "shf_impact_data_mutated",
  "webhook_sent",
  "notification_sent",
  "warehouse_write_performed",
  "auth_modified",
  "execute_shell",
  "call_external_api",
  "write_arbitrary_file",
];

export const AGENT_EXECUTION_PAYLOAD_BLOCKED_PATTERNS = [
  "publish_report",
  "mark_public_approved",
  "mutate_shf_impact_data",
  "send_webhook",
  "send_notification",
  "write_warehouse_record",
  "mutate_auth",
  "mutate_production_record",
  "execute_shell",
  "call_external_api",
  "write_arbitrary_file",
  "bypass_approval",
  "bypass_governance",
];

function nowIso() {
  return new Date().toISOString();
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "_");
}

function flattenPayload(value, prefix = "") {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === "object" && !Array.isArray(item)) return flattenPayload(item, nextKey);
    return [{ key: nextKey, value: item }];
  });
}

export function buildAgentExecutionAuditEvent(eventType, message, actor = "shs_operator") {
  return {
    event_id: `exevt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    event_type: eventType,
    actor,
    message,
    created_at: nowIso(),
  };
}

export function applyAgentExecutionDangerousFlagDefaults(value = {}) {
  return {
    ...value,
    ...AGENT_EXECUTION_DANGEROUS_FLAGS_FALSE,
  };
}

export function scanExecutionPayload(payload = {}) {
  const flattened = flattenPayload(payload);
  const blockers = [];
  const normalizedText = normalize(JSON.stringify(payload || {}));

  flattened.forEach(({ key, value }) => {
    const normalizedKey = normalize(key);
    if (AGENT_EXECUTION_PAYLOAD_BLOCKED_KEYS.includes(normalizedKey) && value === true) {
      blockers.push(`payload_blocked_flag:${normalizedKey}`);
    }
  });

  AGENT_EXECUTION_PAYLOAD_BLOCKED_PATTERNS.forEach((pattern) => {
    if (normalizedText.includes(pattern)) blockers.push(`payload_blocked_pattern:${pattern}`);
  });

  return [...new Set(blockers)];
}

function agentDangerousFlagsAreFalse(agent) {
  if (!agent) return false;
  return [
    "can_execute_production_actions",
    "can_publish_reports",
    "can_mutate_public_data",
    "can_mark_public_approved",
    "can_mutate_shf_impact_data",
    "can_send_external_messages",
    "can_send_webhooks",
    "can_write_warehouse_records",
    "can_modify_auth",
  ].every((flag) => agent[flag] === false);
}

function agentBlocksAction(agent, actionType) {
  const normalizedAction = normalize(actionType);
  const blocked = Array.isArray(agent?.blocked_capabilities) ? agent.blocked_capabilities : [];
  return blocked.some((capability) => normalizedAction.includes(normalize(capability)));
}

export function evaluateControlledExecutionRequest(request, context = {}) {
  const {
    task,
    agent,
    approvalLedger = [],
    contextPacket,
    contextPackets = [],
    coordinationPlan,
    handoff,
    workflowRun,
    workflowStep,
  } = context;
  const blockers = [];
  const warnings = [];
  const actionType = request?.action_type || "";
  const riskLevel = request?.risk_level || task?.risk_level || "medium";
  const approval = request?.approval_id
    ? approvalLedger.find((record) => record.approval_id === request.approval_id) || null
    : getLatestApprovalForTask(task?.task_id, approvalLedger);
  const allContextPackets = [
    ...(Array.isArray(contextPackets) ? contextPackets : []),
    ...(contextPacket ? [contextPacket] : []),
  ];
  const payloadBlockers = scanExecutionPayload(request?.requested_payload || {});

  if (!AGENT_EXECUTION_ALLOWED_ACTION_TYPES.includes(actionType)) blockers.push("action_not_allowlisted");
  if (AGENT_EXECUTION_BLOCKED_ACTION_TYPES.includes(actionType)) blockers.push("blocked_action_type");
  if (!agent) blockers.push("unknown_agent");
  if (agent && !agentDangerousFlagsAreFalse(agent)) blockers.push("agent_dangerous_flags_not_false");
  if (agent && agentBlocksAction(agent, actionType)) blockers.push("action_blocked_by_capability_matrix");
  if (!task?.task_id && !workflowRun?.workflow_run_id && !coordinationPlan?.coordination_plan_id) blockers.push("missing_task_workflow_or_coordination_context");
  if (!approval || approval.approval_status !== "approved") blockers.push("missing_or_unapproved_human_approval");
  if (request?.human_approval_required !== true || request?.approval_required !== true) blockers.push("human_approval_required");
  if (riskLevel === "critical") blockers.push("critical_risk_blocked");
  if (payloadBlockers.length) blockers.push(...payloadBlockers);

  const blockedPackets = allContextPackets.filter((packet) => packet?.blocked_items?.length || packet?.safe_for_execution_stub === false);
  if (blockedPackets.length) blockers.push("context_packet_blocked_items");
  if (coordinationPlan?.status === "blocked" || coordinationPlan?.blockers?.length) blockers.push("coordination_plan_blocked_items");
  if (handoff?.status === "blocked" || handoff?.blockers?.length) blockers.push("coordination_handoff_blocked_items");
  if (workflowRun?.status === "blocked" || workflowRun?.blockers?.length) blockers.push("workflow_run_blocked_items");
  if (workflowStep?.status === "blocked" || workflowStep?.blockers?.length) blockers.push("workflow_step_blocked_items");

  if (!contextPacket) warnings.push("no_context_packet_selected");
  if (!workflowRun) warnings.push("no_workflow_run_selected");
  if (!coordinationPlan) warnings.push("no_coordination_plan_selected");
  if (!handoff) warnings.push("no_coordination_handoff_selected");

  const uniqueBlockers = [...new Set(blockers)];
  const eligible = uniqueBlockers.length === 0;
  return {
    eligible,
    approval,
    blockers: uniqueBlockers,
    warnings: [...new Set(warnings)],
    status: eligible ? "eligible" : "blocked",
    execution_allowed_v1: eligible && AGENT_EXECUTION_ALLOWED_ACTION_TYPES.includes(actionType),
    ...AGENT_EXECUTION_DANGEROUS_FLAGS_FALSE,
  };
}
