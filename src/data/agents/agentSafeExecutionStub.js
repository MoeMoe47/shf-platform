import {
  AGENT_DANGEROUS_EXECUTION_FLAGS_FALSE,
  getApprovedLedgerRecordForTask,
  updateApprovalStubStatus,
} from "./agentApprovalLedger";

export const AGENT_SAFE_EXECUTION_STUB_STORAGE_KEY = "shs.agentWorkbench.safeExecutionStubRuns.v1";

export const SAFE_EXECUTION_STUB_DANGEROUS_FLAG_NAMES = [
  "execution_allowed_v1",
  "production_action_executed",
  "report_published",
  "public_data_mutated",
  "public_approved_mutated",
  "shf_impact_data_mutated",
  "external_message_sent",
  "webhook_sent",
  "warehouse_write_performed",
];

export const SAFE_EXECUTION_BLOCKED_PATTERNS = [
  "execute_production_action",
  "mutate_production_record",
  "publish_report",
  "publish",
  "report_published",
  "public_approved",
  "mark_public_approved",
  "mutate_shf_impact_data",
  "shf_impact_data",
  "external_message",
  "send_external",
  "webhook",
  "notification",
  "warehouse",
  "modify_auth",
  "auth_or_permission",
];

function canUseStorage() {
  try {
    return Boolean(globalThis?.localStorage);
  } catch {
    return false;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "_");
}

function taskRequestedActionText(task) {
  return [
    task?.task_type,
    task?.intended_action,
    task?.title,
    task?.agent_recommendation,
    ...(Array.isArray(task?.blockers) ? task.blockers : []),
    ...(Array.isArray(task?.warnings) ? task.warnings : []),
  ].map(normalize).join(" ");
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

function requestedActionIsBlocked(task, agent) {
  const requested = taskRequestedActionText(task);
  const blockedCapabilities = Array.isArray(agent?.blocked_capabilities) ? agent.blocked_capabilities : [];
  return blockedCapabilities.some((capability) => requested.includes(normalize(capability)))
    || SAFE_EXECUTION_BLOCKED_PATTERNS.some((pattern) => requested.includes(pattern));
}

export function getSafeExecutionStubRuns() {
  if (!canUseStorage()) return [];

  try {
    const stored = globalThis.localStorage.getItem(AGENT_SAFE_EXECUTION_STUB_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSafeExecutionStubRuns(runs) {
  const safeRuns = Array.isArray(runs) ? runs : [];
  if (canUseStorage()) {
    globalThis.localStorage.setItem(AGENT_SAFE_EXECUTION_STUB_STORAGE_KEY, JSON.stringify(safeRuns));
  }
  return safeRuns;
}

export function resetSafeExecutionStubRuns() {
  return saveSafeExecutionStubRuns([]);
}

export function getLatestSafeExecutionStubRunForTask(taskId, runs = getSafeExecutionStubRuns()) {
  return [...(runs || [])]
    .filter((run) => run.task_id === taskId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
}

export function evaluateSafeExecutionEligibility({ task, agent, approvalLedger }) {
  const approval = task?.task_id ? getApprovedLedgerRecordForTask(task.task_id, approvalLedger) : null;
  const eligibilityChecks = [];
  const blockedReasons = [];

  if (task) {
    eligibilityChecks.push("task_exists");
  } else {
    blockedReasons.push("missing_task");
  }

  if (agent) {
    eligibilityChecks.push("agent_exists");
  } else {
    blockedReasons.push("agent_not_found");
  }

  if (approval) {
    eligibilityChecks.push("human_approval_record_present");
  } else if (task?.approval_status === "rejected") {
    blockedReasons.push("rejected_approval");
  } else {
    blockedReasons.push("missing_human_approval");
  }

  if (agentDangerousFlagsAreFalse(agent)) {
    eligibilityChecks.push("agent_dangerous_flags_false");
  } else if (agent) {
    blockedReasons.push("agent_dangerous_flags_not_false");
  }

  if (task?.risk_level === "critical") {
    blockedReasons.push("critical_risk_blocked");
  } else if (task) {
    eligibilityChecks.push("risk_not_critical");
  }

  if (task && agent && requestedActionIsBlocked(task, agent)) {
    blockedReasons.push("requested_action_blocked");
  } else if (task && agent) {
    eligibilityChecks.push("requested_action_not_blocked");
  }

  return {
    approval,
    eligible: blockedReasons.length === 0,
    eligibility_checks: eligibilityChecks,
    blocked_reasons: blockedReasons,
  };
}

export function buildSafeExecutionStubResult({ task, agent, approvalLedger }) {
  const evaluation = evaluateSafeExecutionEligibility({ task, agent, approvalLedger });
  const createdAt = nowIso();
  const simulated = evaluation.eligible;
  const approvalId = evaluation.approval?.approval_id || "";

  return {
    stub_run_id: `stub_${task?.task_id || "unknown"}_${Date.now().toString(36)}`,
    task_id: task?.task_id || "",
    agent_id: agent?.id || task?.assigned_agent_id || "",
    requested_action: task?.task_type || task?.intended_action || "",
    approval_id: approvalId,
    stub_status: simulated ? "simulated" : "blocked",
    eligibility_checks: evaluation.eligibility_checks,
    blocked_reasons: evaluation.blocked_reasons,
    simulated_steps: simulated
      ? [
          "read task context",
          "check agent capability",
          "check approval",
          "check blocked actions",
          "prepare internal recommendation",
          "record audit event",
        ]
      : [],
    operator_message: simulated
      ? "Safe Execution Stub V1 simulated readiness only. No production action executed in V1."
      : "Safe Execution Stub V1 blocked this task. No production action executed in V1.",
    ...AGENT_DANGEROUS_EXECUTION_FLAGS_FALSE,
    created_at: createdAt,
  };
}

export function recordSafeExecutionStubRun({ task, agent, approvalLedger }) {
  const result = buildSafeExecutionStubResult({ task, agent, approvalLedger });
  const runs = getSafeExecutionStubRuns();
  const nextRuns = saveSafeExecutionStubRuns([result, ...runs]);

  if (result.approval_id) {
    updateApprovalStubStatus(
      result.approval_id,
      result.stub_status,
      result.stub_status === "simulated"
        ? "Safe execution stub simulated readiness only. No production action executed."
        : "Safe execution stub blocked readiness. No production action executed."
    );
  }

  return {
    result,
    runs: nextRuns,
  };
}
