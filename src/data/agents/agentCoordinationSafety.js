export const AGENT_COORDINATION_DANGEROUS_FLAGS_FALSE = Object.freeze({
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

export const AGENT_COORDINATION_BLOCKED_PATTERNS = Object.freeze([
  { key: "requested_public_approval", pattern: /\b(public[_ -]?approved|mark[_ -]?public[_ -]?approved|public approval)\b/i },
  { key: "requested_report_publish", pattern: /\b(publish(ed)?\s+report|report_published|publish)\b/i },
  { key: "requested_external_delivery", pattern: /\b(send|sent)\s+(external|message|email)|external_message|notification\b/i },
  { key: "requested_webhook", pattern: /\bwebhook\b/i },
  { key: "requested_warehouse_write", pattern: /\bwarehouse\b/i },
  { key: "requested_auth_mutation", pattern: /\b(auth|permission|role)\s+(change|mutation|update|modify)\b/i },
  { key: "requested_shf_mutation", pattern: /\bshf[_ -]?impact[_ -]?data|impact data spine\b/i },
  { key: "requested_production_execution", pattern: /\bexecute(d)?\s+production|production\s+action|autonomous execution\b/i },
]);

const GENERATED_COORDINATION_BLOCKER_KEYS = new Set([
  "critical_risk_requires_review",
  ...AGENT_COORDINATION_BLOCKED_PATTERNS.map((rule) => rule.key),
]);

function isGeneratedCoordinationBlocker(blocker = "") {
  return GENERATED_COORDINATION_BLOCKER_KEYS.has(blocker)
    || blocker.startsWith("missing_agent:")
    || blocker.startsWith("context_packet_blocked:")
    || blocker.endsWith("_not_false");
}

function textForScan(record = {}) {
  return [
    record.title,
    record.workflow_type,
    record.coordination_summary,
    record.next_best_action,
    record.handoff_summary,
    record.operator_note,
    ...(Array.isArray(record.blockers) ? record.blockers : []),
    ...(Array.isArray(record.warnings) ? record.warnings : []),
    ...(Array.isArray(record.blocked_actions) ? record.blocked_actions : []),
  ].join(" ");
}

export function buildAgentCoordinationAuditEvent(eventType, message, actor = "shs_operator") {
  const createdAt = new Date().toISOString();
  const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    event_id: `coevt_${suffix}`,
    event_type: eventType,
    actor,
    message,
    created_at: createdAt,
  };
}

export function scanAgentCoordinationSafety(record = {}, { agentsById = {}, contextPackets = [] } = {}) {
  const blockedItems = AGENT_COORDINATION_BLOCKED_PATTERNS
    .filter((rule) => rule.pattern.test(textForScan(record)))
    .map((rule) => rule.key);

  if (record.risk_level === "critical") blockedItems.push("critical_risk_requires_review");
  (record.participating_agent_ids || []).forEach((agentId) => {
    if (!agentsById[agentId]) blockedItems.push(`missing_agent:${agentId}`);
  });
  const linkedPackets = contextPackets.filter((packet) => (record.related_context_packet_ids || record.included_context_packet_ids || []).includes(packet.context_packet_id));
  linkedPackets.forEach((packet) => {
    if (packet.blocked_items?.length || packet.safe_for_execution_stub === false) {
      blockedItems.push(`context_packet_blocked:${packet.context_packet_id}`);
    }
  });

  Object.entries(AGENT_COORDINATION_DANGEROUS_FLAGS_FALSE).forEach(([key, expected]) => {
    if (record[key] !== undefined && record[key] !== expected) blockedItems.push(`${key}_not_false`);
  });

  return {
    blocked_items: [...new Set(blockedItems)],
    recommended_status: blockedItems.length ? "blocked" : record.status || "draft",
    risk_summary: blockedItems.length
      ? "Coordination requires operator review before simulated next steps."
      : "No deterministic V1 coordination blockers detected.",
    ...AGENT_COORDINATION_DANGEROUS_FLAGS_FALSE,
  };
}

export function applyAgentCoordinationSafetyDefaults(record = {}, options = {}) {
  const scan = scanAgentCoordinationSafety(record, options);
  const operatorBlockers = (record.blockers || []).filter((blocker) => !isGeneratedCoordinationBlocker(blocker));
  return {
    ...record,
    ...AGENT_COORDINATION_DANGEROUS_FLAGS_FALSE,
    blockers: [...new Set([...operatorBlockers, ...scan.blocked_items])],
    updated_at: record.updated_at || new Date().toISOString(),
  };
}
