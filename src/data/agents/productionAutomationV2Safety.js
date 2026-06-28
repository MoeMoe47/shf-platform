import {
  PRODUCTION_AUTOMATION_V2_ALLOWED_LOCAL_ACTIONS,
  PRODUCTION_AUTOMATION_V2_BLOCKED_ACTIONS,
} from "./productionAutomationV2Recipes";
import { PRODUCTION_AUTOMATION_V2_DANGEROUS_FLAGS_FALSE } from "./productionAutomationV2Runs";

export const PRODUCTION_AUTOMATION_V2_SAFETY_COPY = "Production Automation V2 creates approved local/internal automation records only. It does not execute production changes, publish reports, mutate SHF public data, send messages, write warehouse records, or modify auth.";

const BLOCKED_PAYLOAD_KEYS = [
  "public_approved",
  "public_approved_mutated",
  "report_published",
  "public_data_mutated",
  "shf_impact_data_mutated",
  "production_action_executed",
  "external_message_sent",
  "webhook_sent",
  "notification_sent",
  "warehouse_write_performed",
  "auth_modified",
  "deploy_code",
  "execute_shell",
  "call_external_api",
];

function nowIso() {
  return new Date().toISOString();
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[\s-]+/g, "_");
}

function flattenPayload(value, prefix = "") {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === "object" && !Array.isArray(item)) return flattenPayload(item, nextKey);
    return [{ key: nextKey, value: item }];
  });
}

export function buildProductionAutomationV2AuditEvent(eventType, message, actor = "shs_operator") {
  return {
    event_id: `pa2evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    event_type: eventType,
    actor,
    message,
    created_at: nowIso(),
  };
}

export function applyProductionAutomationV2SafetyDefaults(run = {}) {
  return {
    ...run,
    human_approval_required: true,
    approval_required: true,
    execution_enabled_v2: false,
    ...PRODUCTION_AUTOMATION_V2_DANGEROUS_FLAGS_FALSE,
  };
}

export function scanProductionAutomationV2Payload(payload = {}) {
  const blockers = [];
  const text = normalize(JSON.stringify(payload || {}));
  flattenPayload(payload).forEach(({ key, value }) => {
    const normalizedKey = normalize(key);
    if (BLOCKED_PAYLOAD_KEYS.includes(normalizedKey) && value === true) {
      blockers.push(`payload_blocked_flag:${normalizedKey}`);
    }
  });
  PRODUCTION_AUTOMATION_V2_BLOCKED_ACTIONS.forEach((action) => {
    if (text.includes(action)) blockers.push(`payload_blocked_action:${action}`);
  });
  return [...new Set(blockers)];
}

function actionBlockers(run, recipe) {
  const allowed = Array.isArray(recipe?.allowed_local_actions) ? recipe.allowed_local_actions : PRODUCTION_AUTOMATION_V2_ALLOWED_LOCAL_ACTIONS;
  const blocked = Array.isArray(recipe?.blocked_actions) ? recipe.blocked_actions : PRODUCTION_AUTOMATION_V2_BLOCKED_ACTIONS;
  const planned = Array.isArray(run?.local_actions_planned) ? run.local_actions_planned : [];
  const blockers = [];
  planned.forEach((action) => {
    if (!allowed.includes(action)) blockers.push(`local_action_not_allowlisted:${action}`);
    if (blocked.includes(action)) blockers.push(`blocked_action_requested:${action}`);
  });
  return blockers;
}

export function calculateProductionAutomationV2Readiness(run = {}, recipe = {}, context = {}) {
  const blockers = [];
  const warnings = [];
  const payloadBlockers = scanProductionAutomationV2Payload(run.requested_payload || {});
  const relatedWorkflow = context.workflowRuns?.find((item) => item.workflow_run_id === run.related_workflow_run_id);
  const relatedContextPackets = (context.contextPackets || []).filter((packet) => run.related_context_packet_ids?.includes(packet.context_packet_id));
  const relatedApprovalCount = Array.isArray(run.related_approval_ids) ? run.related_approval_ids.length : 0;
  const hasWorkflowOrContext = Boolean(run.related_workflow_run_id || run.related_coordination_plan_id || run.related_task_ids?.length || run.related_context_packet_ids?.length);
  const unsafeContextPackets = relatedContextPackets.filter((packet) => packet.blocked_items?.length || packet.safe_for_execution_stub === false);
  const plannedActionBlockers = actionBlockers(run, recipe);

  if (run.risk_level === "critical") blockers.push("critical_risk_blocked");
  if (!run.human_approval_required || !run.approval_required) blockers.push("missing_human_approval_path");
  if (relatedWorkflow?.status === "blocked" || relatedWorkflow?.blockers?.length) blockers.push("related_workflow_blocked");
  if (unsafeContextPackets.length) blockers.push("related_context_packet_blocked");
  if (payloadBlockers.length) blockers.push(...payloadBlockers);
  if (plannedActionBlockers.length) blockers.push(...plannedActionBlockers);
  if (run.execution_enabled_v2 !== false) blockers.push("execution_enabled_v2_not_false");
  if (Object.keys(PRODUCTION_AUTOMATION_V2_DANGEROUS_FLAGS_FALSE).some((key) => run[key] !== false)) blockers.push("dangerous_flag_not_false");

  if (!relatedApprovalCount) warnings.push("no_approval_record_linked");
  if (!hasWorkflowOrContext) warnings.push("no_workflow_or_context_linked");
  if (run.warnings?.length) warnings.push(...run.warnings);

  let score = 100;
  if (run.risk_level === "critical") score -= 30;
  if (!relatedApprovalCount) score -= 20;
  if (!hasWorkflowOrContext) score -= 20;
  if (run.blockers?.length || blockers.length) score -= 15;
  if (warnings.length) score -= 10;
  if (plannedActionBlockers.length) score -= 25;
  if (payloadBlockers.length) score -= 50;
  score = Math.max(0, score);

  const uniqueBlockers = [...new Set([...(run.blockers || []), ...blockers])];
  return {
    readiness_score: score,
    ready: score >= 80 && uniqueBlockers.length === 0 && run.human_approval_required === true && run.execution_enabled_v2 === false,
    blockers: uniqueBlockers,
    warnings: [...new Set(warnings)],
    ...PRODUCTION_AUTOMATION_V2_DANGEROUS_FLAGS_FALSE,
  };
}
