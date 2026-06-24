import backendAgentContracts from "../../../services/shf-agent-fabric/contracts/agents/agents.json";
import { SHS_AGENT_WORKFORCE_V1 } from "./shsAgentWorkforce";

export const AGENT_CONTRACT_BRIDGE_REQUIRED_AGENT_IDS = [
  "shs_sales_agent",
  "shs_project_agent",
  "shs_library_agent",
  "shs_qa_agent",
  "shs_clientops_agent",
  "shs_report_agent",
  "shs_governance_agent",
  "shs_executive_agent",
];

export const AGENT_CONTRACT_BRIDGE_DANGEROUS_FLAGS = [
  "can_execute_production_actions",
  "can_publish_reports",
  "can_mutate_public_data",
  "can_mark_public_approved",
  "can_mutate_shf_impact_data",
  "can_send_external_messages",
  "can_send_webhooks",
  "can_write_warehouse_records",
  "can_modify_auth",
  "execution_allowed",
  "execution_enabled",
  "production_action_executed",
  "public_approved_mutated",
  "shf_impact_data_mutated",
  "webhook_sent",
  "notification_sent",
  "warehouse_write_performed",
];

const CAMEL_FLAG_ALIASES = {
  can_execute_production_actions: "canExecuteProductionActions",
  can_publish_reports: "canPublishReports",
  can_mutate_public_data: "canMutatePublicData",
  can_mark_public_approved: "canMarkPublicApproved",
  can_mutate_shf_impact_data: "canMutateShfImpactData",
  can_send_external_messages: "canSendExternalMessages",
  can_send_webhooks: "canSendWebhooks",
  can_write_warehouse_records: "canWriteWarehouseRecords",
  can_modify_auth: "canModifyAuth",
};

const BLOCKED_POWER_TERMS = [
  "execute_production",
  "mutate_production",
  "publish_report",
  "mark_public_approved",
  "mutate_shf_impact_data",
  "send_external_webhook",
  "send_notification",
  "write_warehouse_record",
  "modify_auth",
  "warehouse_write",
];

function getAgentId(agent, fallback = "") {
  return agent?.id || agent?.agent_id || agent?.agentId || fallback;
}

function getPolicy(agent) {
  return agent?.policy && typeof agent.policy === "object" ? agent.policy : {};
}

function getFlagValue(agent, flag) {
  const policy = getPolicy(agent);
  const alias = CAMEL_FLAG_ALIASES[flag];
  if (Object.prototype.hasOwnProperty.call(agent || {}, flag)) return agent[flag];
  if (Object.prototype.hasOwnProperty.call(policy, flag)) return policy[flag];
  if (alias && Object.prototype.hasOwnProperty.call(policy, alias)) return policy[alias];
  if (alias && Object.prototype.hasOwnProperty.call(agent || {}, alias)) return agent[alias];
  return false;
}

function scanDangerousFlags(agent, source) {
  const agentId = getAgentId(agent);
  return AGENT_CONTRACT_BRIDGE_DANGEROUS_FLAGS
    .filter((flag) => getFlagValue(agent, flag) === true)
    .map((flag) => `${source}:${agentId}:${flag}`);
}

function hasBlockedPower(agent) {
  const values = [
    ...(Array.isArray(agent?.allowed_capabilities) ? agent.allowed_capabilities : []),
    ...(Array.isArray(agent?.capabilities) ? agent.capabilities : []),
    ...(Array.isArray(agent?.allowedTools) ? agent.allowedTools : []),
    ...(Array.isArray(agent?.allowed_tools) ? agent.allowed_tools : []),
  ].join(" ").toLowerCase();
  return BLOCKED_POWER_TERMS.some((term) => values.includes(term));
}

function compareCapabilities(frontendAgent, backendAgent) {
  const frontendCapabilities = new Set(frontendAgent?.allowed_capabilities || []);
  const backendCapabilities = new Set(backendAgent?.capabilities || []);
  const missingBackendCapabilities = [...frontendCapabilities].filter((capability) => !backendCapabilities.has(capability));
  const extraBackendCapabilities = [...backendCapabilities].filter((capability) => !frontendCapabilities.has(capability));
  return { missingBackendCapabilities, extraBackendCapabilities };
}

export function buildAgentContractBridgeSummary({
  frontendAgents = SHS_AGENT_WORKFORCE_V1,
  backendAgents = backendAgentContracts,
} = {}) {
  const frontendById = Object.fromEntries(frontendAgents.map((agent) => [getAgentId(agent), agent]));
  const backendById = backendAgents || {};
  const frontendIds = frontendAgents.map((agent) => getAgentId(agent));
  const backendIds = Object.keys(backendById);
  const matchedAgents = AGENT_CONTRACT_BRIDGE_REQUIRED_AGENT_IDS.filter(
    (agentId) => frontendById[agentId] && backendById[agentId]
  );
  const missingFrontendAgents = AGENT_CONTRACT_BRIDGE_REQUIRED_AGENT_IDS.filter((agentId) => !frontendById[agentId]);
  const missingBackendAgents = AGENT_CONTRACT_BRIDGE_REQUIRED_AGENT_IDS.filter((agentId) => !backendById[agentId]);
  const extraBackendAgents = backendIds.filter((agentId) => !AGENT_CONTRACT_BRIDGE_REQUIRED_AGENT_IDS.includes(agentId));
  const dangerousFlagsEnabled = [
    ...frontendAgents.flatMap((agent) => scanDangerousFlags(agent, "frontend")),
    ...AGENT_CONTRACT_BRIDGE_REQUIRED_AGENT_IDS.flatMap((agentId) => (
      backendById[agentId] ? scanDangerousFlags(backendById[agentId], "backend") : []
    )),
  ];
  const humanApprovalMissing = AGENT_CONTRACT_BRIDGE_REQUIRED_AGENT_IDS.filter((agentId) => {
    const frontendAgent = frontendById[agentId];
    const backendAgent = backendById[agentId];
    return frontendAgent?.human_approval_required !== true || getPolicy(backendAgent).humanApproval !== true;
  });
  const auditRequiredMissing = AGENT_CONTRACT_BRIDGE_REQUIRED_AGENT_IDS.filter((agentId) => {
    const frontendAgent = frontendById[agentId];
    const backendAgent = backendById[agentId];
    return frontendAgent?.audit_required !== true || getPolicy(backendAgent).auditRequired !== true;
  });
  const capabilityMismatches = AGENT_CONTRACT_BRIDGE_REQUIRED_AGENT_IDS
    .map((agentId) => {
      const frontendAgent = frontendById[agentId];
      const backendAgent = backendById[agentId];
      if (!frontendAgent || !backendAgent) return null;
      const comparison = compareCapabilities(frontendAgent, backendAgent);
      return {
        agent_id: agentId,
        ...comparison,
      };
    })
    .filter((item) => item && (item.missingBackendCapabilities.length || item.extraBackendCapabilities.length));
  const blockedPowerAgents = [
    ...frontendAgents.filter(hasBlockedPower).map((agent) => `frontend:${getAgentId(agent)}`),
    ...AGENT_CONTRACT_BRIDGE_REQUIRED_AGENT_IDS
      .filter((agentId) => backendById[agentId] && hasBlockedPower(backendById[agentId]))
      .map((agentId) => `backend:${agentId}`),
  ];
  const warnings = [];
  const blockers = [];

  if (extraBackendAgents.length) warnings.push("extra_backend_agents_present");
  if (capabilityMismatches.length) warnings.push("capability_boundary_review");
  if (missingFrontendAgents.length) blockers.push("required_frontend_agents_missing");
  if (missingBackendAgents.length) blockers.push("required_backend_agents_missing");
  if (dangerousFlagsEnabled.length) blockers.push("dangerous_flags_enabled");
  if (humanApprovalMissing.length) blockers.push("human_approval_required_missing");
  if (auditRequiredMissing.length) blockers.push("audit_required_missing");
  if (blockedPowerAgents.length) blockers.push("blocked_power_in_allowed_surface");

  return {
    ok: true,
    layer: "agent_contract_bridge",
    canonical_agent_count: frontendAgents.length,
    required_agent_count: AGENT_CONTRACT_BRIDGE_REQUIRED_AGENT_IDS.length,
    backend_agent_count: backendIds.length,
    frontend_agent_count: frontendIds.length,
    matched_agents: matchedAgents,
    missing_frontend_agents: missingFrontendAgents,
    missing_backend_agents: missingBackendAgents,
    extra_backend_agents: extraBackendAgents,
    capability_mismatches: capabilityMismatches,
    dangerous_flags_enabled: dangerousFlagsEnabled,
    execution_enabled: false,
    contracts_readable: Boolean(backendAgents),
    alignment_status: blockers.length ? "blocked" : warnings.length ? "needs_review" : "aligned",
    warnings,
    blockers,
    human_approval_missing: humanApprovalMissing,
    audit_required_missing: auditRequiredMissing,
    blocked_power_agents: blockedPowerAgents,
    backend_contract_source: "services/shf-agent-fabric/contracts/agents/agents.json",
    frontend_canonical_source: "src/data/agents/shsAgentWorkforce.js",
  };
}

export const AGENT_CONTRACT_BRIDGE_SUMMARY_V1 = buildAgentContractBridgeSummary();
