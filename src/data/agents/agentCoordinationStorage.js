import { AGENT_CONTEXT_PACKET_STORAGE_KEY } from "./agentContextPackets";
import { AGENT_COORDINATION_PLAN_SEED_V1, AGENT_COORDINATION_PLAN_STORAGE_KEY } from "./agentCoordinationPlans";
import { AGENT_HANDOFF_SEED_V1, AGENT_HANDOFF_STORAGE_KEY } from "./agentHandoffRecords";
import { AGENT_COORDINATION_TEMPLATES_V1, getAgentCoordinationTemplate, getNextBestAgentForPlan } from "./agentCoordinationTemplates";
import { SHS_AGENT_WORKFORCE_V1 } from "./shsAgentWorkforce";
import {
  AGENT_COORDINATION_DANGEROUS_FLAGS_FALSE,
  applyAgentCoordinationSafetyDefaults,
  buildAgentCoordinationAuditEvent,
  scanAgentCoordinationSafety,
} from "./agentCoordinationSafety";

function canUseStorage() {
  try {
    return Boolean(globalThis?.localStorage);
  } catch {
    return false;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function readJson(key, fallback) {
  if (!canUseStorage()) return clone(fallback);
  try {
    const stored = globalThis.localStorage.getItem(key);
    if (!stored) {
      const seed = clone(fallback);
      globalThis.localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function saveJson(key, value) {
  if (canUseStorage()) {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  }
  return value;
}

function getStoredContextPackets() {
  return readJson(AGENT_CONTEXT_PACKET_STORAGE_KEY, []);
}

const CANONICAL_AGENTS_BY_ID = Object.freeze(Object.fromEntries(SHS_AGENT_WORKFORCE_V1.map((agent) => [agent.id, agent])));

function normalizePlan(plan, handoffs = getAgentHandoffs()) {
  const nextBestAgent = getNextBestAgentForPlan(plan, handoffs);
  return applyAgentCoordinationSafetyDefaults({
    ...plan,
    next_best_agent_id: plan.next_best_agent_id || nextBestAgent,
    next_best_action: plan.next_best_action || `${nextBestAgent} reviews the next internal coordination step.`,
    human_review_required: true,
    approval_required: true,
    ...AGENT_COORDINATION_DANGEROUS_FLAGS_FALSE,
  }, { agentsById: CANONICAL_AGENTS_BY_ID, contextPackets: getStoredContextPackets() });
}

function normalizeHandoff(handoff) {
  return {
    ...handoff,
    human_review_required: true,
    execution_enabled_v1: false,
    updated_at: handoff.updated_at || nowIso(),
    audit_events: Array.isArray(handoff.audit_events) ? handoff.audit_events : [],
  };
}

export function getAgentCoordinationPlans() {
  return readJson(AGENT_COORDINATION_PLAN_STORAGE_KEY, AGENT_COORDINATION_PLAN_SEED_V1).map((plan) => normalizePlan(plan));
}

export function saveAgentCoordinationPlans(plans) {
  return saveJson(AGENT_COORDINATION_PLAN_STORAGE_KEY, (Array.isArray(plans) ? plans : []).map((plan) => normalizePlan(plan)));
}

export function resetAgentCoordinationPlans() {
  return saveAgentCoordinationPlans(clone(AGENT_COORDINATION_PLAN_SEED_V1));
}

export function getAgentHandoffs() {
  return readJson(AGENT_HANDOFF_STORAGE_KEY, AGENT_HANDOFF_SEED_V1).map((handoff) => normalizeHandoff(handoff));
}

export function saveAgentHandoffs(handoffs) {
  return saveJson(AGENT_HANDOFF_STORAGE_KEY, (Array.isArray(handoffs) ? handoffs : []).map((handoff) => normalizeHandoff(handoff)));
}

export function resetAgentHandoffs() {
  return saveAgentHandoffs(clone(AGENT_HANDOFF_SEED_V1));
}

export function createCoordinationPlanFromTemplate(workflowType, { tasks = [], memoryRecords = [], contextPackets = [] } = {}) {
  const template = getAgentCoordinationTemplate(workflowType);
  const plans = getAgentCoordinationPlans();
  const createdAt = nowIso();
  const nextAgentId = template.recommended_sequence.find((agentId) => agentId !== template.default_owner_agent_id)
    || template.default_owner_agent_id;
  const relatedTaskIds = tasks.slice(0, 3).map((task) => task.task_id);
  const relatedMemoryIds = memoryRecords
    .filter((record) => template.participating_agent_ids.includes(record.related_agent_id))
    .slice(0, 3)
    .map((record) => record.memory_id);
  const relatedContextPacketIds = contextPackets
    .filter((packet) => relatedTaskIds.includes(packet.task_id) || template.participating_agent_ids.includes(packet.agent_id))
    .slice(0, 2)
    .map((packet) => packet.context_packet_id);
  const blockedItems = contextPackets
    .filter((packet) => relatedContextPacketIds.includes(packet.context_packet_id))
    .flatMap((packet) => packet.blocked_items || []);
  const plan = normalizePlan({
    coordination_plan_id: `coord_${String(plans.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`,
    title: `${template.display_name} coordination plan`,
    workflow_type: template.workflow_type,
    status: blockedItems.length ? "blocked" : "draft",
    priority: template.workflow_type === "launch_readiness" ? "urgent" : "high",
    risk_level: ["report_generation", "clientops_review", "launch_readiness"].includes(template.workflow_type) ? "high" : "medium",
    owner_agent_id: template.default_owner_agent_id,
    participating_agent_ids: template.participating_agent_ids,
    related_task_ids: relatedTaskIds,
    related_memory_ids: relatedMemoryIds,
    related_context_packet_ids: relatedContextPacketIds,
    coordination_summary: `Coordinate ${template.display_name} across ${template.participating_agent_ids.length} SHS agents for internal operator review.`,
    next_best_agent_id: nextAgentId,
    next_best_action: `${nextAgentId} starts the next internal review step.`,
    human_review_required: true,
    approval_required: true,
    created_at: createdAt,
    updated_at: createdAt,
    blockers: blockedItems.length ? [...new Set(blockedItems)] : [],
    warnings: relatedContextPacketIds.length ? [] : ["No context packet is linked yet."],
    audit_events: [buildAgentCoordinationAuditEvent("coordination_plan_created", "Created from safe V1 workflow template.")],
    ...AGENT_COORDINATION_DANGEROUS_FLAGS_FALSE,
  });
  return saveAgentCoordinationPlans([plan, ...plans]);
}

export function updateCoordinationPlan(planId, updater) {
  const plans = getAgentCoordinationPlans();
  const handoffs = getAgentHandoffs();
  const nextPlans = plans.map((plan) => {
    if (plan.coordination_plan_id !== planId) return plan;
    const next = typeof updater === "function" ? updater({ ...plan }) : { ...plan, ...updater };
    return normalizePlan({ ...next, updated_at: nowIso() }, handoffs);
  });
  return saveAgentCoordinationPlans(nextPlans);
}

export function applyCoordinationPlanAction(planId, action, note = "") {
  const statusByAction = {
    review: "in_review",
    approve: "approved",
    block: "blocked",
    complete: "completed",
    note: undefined,
  };
  return updateCoordinationPlan(planId, (plan) => ({
    ...plan,
    status: action === "complete" && plan.blockers?.length ? "blocked" : statusByAction[action] || plan.status,
    warnings: [...new Set([
      ...(plan.warnings || []),
      ...(action === "approve" ? ["Approval changes coordination status only; execution remains disabled."] : []),
      ...(action === "complete" && plan.blockers?.length ? ["Completion blocked until coordination blockers are resolved."] : []),
    ])],
    blockers: action === "block" ? [...new Set([...(plan.blockers || []), note || "operator_blocked"])] : plan.blockers,
    audit_events: [
      ...(plan.audit_events || []),
      buildAgentCoordinationAuditEvent(`coordination_${action}`, note || `Operator action: ${action}. Execution remains disabled.`),
    ],
  }));
}

export function createAgentHandoff({ plan, fromAgentId, toAgentId, handoffType = "context", note = "" }) {
  const handoffs = getAgentHandoffs();
  const createdAt = nowIso();
  const draft = normalizeHandoff({
    handoff_id: `handoff_${String(handoffs.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`,
    coordination_plan_id: plan?.coordination_plan_id || "",
    from_agent_id: fromAgentId || plan?.owner_agent_id || "",
    to_agent_id: toAgentId || plan?.next_best_agent_id || "",
    handoff_type: handoffType,
    handoff_summary: `Internal ${handoffType} handoff for operator-supervised coordination.`,
    included_task_ids: plan?.related_task_ids || [],
    included_memory_ids: plan?.related_memory_ids || [],
    included_context_packet_ids: plan?.related_context_packet_ids || [],
    status: "sent_for_review",
    operator_note: note || "Human review required before accepting this handoff.",
    created_at: createdAt,
    updated_at: createdAt,
    audit_events: [buildAgentCoordinationAuditEvent("handoff_created", "Created safe internal handoff. No execution performed.")],
    human_review_required: true,
    execution_enabled_v1: false,
  });
  return saveAgentHandoffs([draft, ...handoffs]);
}

export function updateAgentHandoffStatus(handoffId, status, note = "") {
  const handoffs = getAgentHandoffs();
  const nextHandoffs = handoffs.map((handoff) => {
    if (handoff.handoff_id !== handoffId) return handoff;
    return normalizeHandoff({
      ...handoff,
      status,
      operator_note: note || handoff.operator_note,
      updated_at: nowIso(),
      audit_events: [
        ...(handoff.audit_events || []),
        buildAgentCoordinationAuditEvent(`handoff_${status}`, note || `Handoff marked ${status}. Execution remains disabled.`),
      ],
    });
  });
  return saveAgentHandoffs(nextHandoffs);
}

export function getHandoffsForPlan(planId, handoffs = getAgentHandoffs()) {
  return (handoffs || []).filter((handoff) => handoff.coordination_plan_id === planId);
}

export function getCoordinationTemplates() {
  return AGENT_COORDINATION_TEMPLATES_V1;
}
