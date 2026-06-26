export const AGENT_WORKFLOW_DANGEROUS_FLAGS_FALSE = Object.freeze({
  execution_enabled_v1: false,
  production_action_executed: false,
  report_published: false,
  public_data_mutated: false,
  public_approved_mutated: false,
  shf_impact_data_mutated: false,
  external_message_sent: false,
  webhook_sent: false,
  warehouse_write_performed: false,
});

export const AGENT_WORKFLOW_BLOCKED_PATTERNS = Object.freeze([
  { key: "requested_public_approval", pattern: /\b(public[_ -]?approved|mark[_ -]?public[_ -]?approved|public approval)\b/i },
  { key: "requested_report_publish", pattern: /\b(publish(ed)?\s+report|report_published)\b/i },
  { key: "requested_external_delivery", pattern: /\b(send|sent)\s+(external|message|email)|external_message\b/i },
  { key: "requested_notification", pattern: /\bnotification\b/i },
  { key: "requested_webhook", pattern: /\bwebhook\b/i },
  { key: "requested_warehouse_write", pattern: /\bwarehouse\b/i },
  { key: "requested_auth_mutation", pattern: /\b(auth|permission|role)\s+(change|mutation|update|modify)\b/i },
  { key: "requested_shf_mutation", pattern: /\bshf[_ -]?impact[_ -]?data|impact data spine\b/i },
  { key: "requested_production_execution", pattern: /\bexecute(d)?\s+production|production\s+action|autonomous execution\b/i },
]);

const GENERATED_WORKFLOW_BLOCKER_KEYS = new Set([
  "critical_risk_requires_review",
  "workflow_blocked",
  "step_blocked",
  "completion_requires_finished_steps",
  ...AGENT_WORKFLOW_BLOCKED_PATTERNS.map((rule) => rule.key),
]);

function isGeneratedWorkflowBlocker(blocker = "") {
  return GENERATED_WORKFLOW_BLOCKER_KEYS.has(blocker)
    || blocker.startsWith("missing_agent:")
    || blocker.startsWith("context_packet_blocked:")
    || blocker.startsWith("step_blocked:")
    || blocker.endsWith("_not_false");
}

function textForScan(record = {}) {
  return [
    record.title,
    record.workflow_type,
    record.description,
    record.operator_note,
    ...(Array.isArray(record.blocked_actions) ? record.blocked_actions : []),
  ].join(" ");
}

export function buildAgentWorkflowAuditEvent(eventType, message, actor = "shs_operator") {
  const createdAt = new Date().toISOString();
  const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    event_id: `wfevt_${suffix}`,
    event_type: eventType,
    actor,
    message,
    created_at: createdAt,
  };
}

export function scanAgentWorkflowSafety(record = {}, { agentsById = {}, contextPackets = [], steps = [] } = {}) {
  const blockedItems = AGENT_WORKFLOW_BLOCKED_PATTERNS
    .filter((rule) => rule.pattern.test(textForScan(record)))
    .map((rule) => rule.key);

  if (record.risk_level === "critical") blockedItems.push("critical_risk_requires_review");

  (record.participating_agent_ids || [record.owning_agent_id].filter(Boolean)).forEach((agentId) => {
    if (!agentsById[agentId]) blockedItems.push(`missing_agent:${agentId}`);
  });

  const linkedContextIds = record.related_context_packet_ids || [];
  contextPackets
    .filter((packet) => linkedContextIds.includes(packet.context_packet_id))
    .forEach((packet) => {
      if (packet.blocked_items?.length || packet.safe_for_execution_stub === false) {
        blockedItems.push(`context_packet_blocked:${packet.context_packet_id}`);
      }
    });

  (steps || []).forEach((step) => {
    if (step.status === "blocked" || step.blockers?.length) {
      blockedItems.push(`step_blocked:${step.workflow_step_id}`);
    }
  });

  Object.entries(AGENT_WORKFLOW_DANGEROUS_FLAGS_FALSE).forEach(([key, expected]) => {
    if (record[key] !== undefined && record[key] !== expected) blockedItems.push(`${key}_not_false`);
  });

  return {
    blocked_items: [...new Set(blockedItems)],
    recommended_status: blockedItems.length ? "blocked" : record.status || "draft",
    risk_summary: blockedItems.length
      ? "Workflow requires operator review before local status advancement."
      : "No deterministic V1 workflow blockers detected.",
    ...AGENT_WORKFLOW_DANGEROUS_FLAGS_FALSE,
  };
}

export function applyAgentWorkflowSafetyDefaults(record = {}, options = {}) {
  const scan = scanAgentWorkflowSafety(record, options);
  const operatorBlockers = (record.blockers || []).filter((blocker) => !isGeneratedWorkflowBlocker(blocker));
  return {
    ...record,
    ...AGENT_WORKFLOW_DANGEROUS_FLAGS_FALSE,
    blockers: [...new Set([...operatorBlockers, ...scan.blocked_items])],
    updated_at: record.updated_at || new Date().toISOString(),
  };
}
