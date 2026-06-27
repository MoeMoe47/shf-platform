import { appendAgentTaskAuditEvent, applyAgentTaskAction, getAgentTasks, updateAgentTask } from "./agentTaskStorage";
import { getAgentContextPackets } from "./agentMemoryStorage";
import {
  applyCoordinationPlanAction,
  getAgentCoordinationPlans,
  getAgentHandoffs,
  updateAgentHandoffStatus,
  updateCoordinationPlan,
} from "./agentCoordinationStorage";
import {
  applyWorkflowRunAction,
  applyWorkflowStepAction,
  getAgentWorkflowRuns,
  getAgentWorkflowSteps,
} from "./agentWorkflowStorage";
import {
  AGENT_EXECUTION_RECORD_STORAGE_KEY,
  AGENT_EXECUTION_RECOMMENDATION_STORAGE_KEY,
  AGENT_EXECUTION_REQUEST_STORAGE_KEY,
} from "./agentExecutionRecords";
import {
  AGENT_EXECUTION_ALLOWED_ACTION_TYPES,
  applyAgentExecutionDangerousFlagDefaults,
  buildAgentExecutionAuditEvent,
  evaluateControlledExecutionRequest,
} from "./agentExecutionSafety";

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

function readJson(key) {
  if (!canUseStorage()) return [];
  try {
    const stored = globalThis.localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveJson(key, value) {
  const safeValue = Array.isArray(value) ? value : [];
  if (canUseStorage()) {
    globalThis.localStorage.setItem(key, JSON.stringify(safeValue));
  }
  return safeValue;
}

export function getAgentExecutionRequests() {
  return readJson(AGENT_EXECUTION_REQUEST_STORAGE_KEY);
}

export function saveAgentExecutionRequests(requests) {
  return saveJson(AGENT_EXECUTION_REQUEST_STORAGE_KEY, requests);
}

export function resetAgentExecutionRequests() {
  return saveAgentExecutionRequests([]);
}

export function getAgentExecutionRecords() {
  return readJson(AGENT_EXECUTION_RECORD_STORAGE_KEY);
}

export function saveAgentExecutionRecords(records) {
  return saveJson(AGENT_EXECUTION_RECORD_STORAGE_KEY, records);
}

export function resetAgentExecutionRecords() {
  return saveAgentExecutionRecords([]);
}

export function getAgentExecutionRecommendationPackets() {
  return readJson(AGENT_EXECUTION_RECOMMENDATION_STORAGE_KEY);
}

export function saveAgentExecutionRecommendationPackets(packets) {
  return saveJson(AGENT_EXECUTION_RECOMMENDATION_STORAGE_KEY, packets);
}

export function resetAgentExecutionRecommendationPackets() {
  return saveAgentExecutionRecommendationPackets([]);
}

function buildRequest({
  task,
  agent,
  approval,
  actionType,
  requestedPayload = {},
  workflowRun,
  workflowStep,
  coordinationPlan,
  handoff,
  contextPacket,
}) {
  const createdAt = nowIso();
  const request = {
    execution_request_id: `exec_req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    task_id: task?.task_id || workflowStep?.related_task_id || coordinationPlan?.related_task_ids?.[0] || "",
    agent_id: agent?.id || task?.assigned_agent_id || workflowStep?.owning_agent_id || coordinationPlan?.owner_agent_id || "",
    approval_id: approval?.approval_id || "",
    workflow_run_id: workflowRun?.workflow_run_id || workflowStep?.workflow_run_id || "",
    workflow_step_id: workflowStep?.workflow_step_id || "",
    coordination_plan_id: coordinationPlan?.coordination_plan_id || handoff?.coordination_plan_id || "",
    handoff_id: handoff?.handoff_id || "",
    context_packet_id: contextPacket?.context_packet_id || "",
    action_type: actionType,
    requested_by: "operator",
    risk_level: requestedPayload.risk_level || task?.risk_level || workflowStep?.risk_level || coordinationPlan?.risk_level || "medium",
    status: "draft",
    requested_payload: requestedPayload,
    created_at: createdAt,
    updated_at: createdAt,
    blockers: [],
    warnings: [],
    human_approval_required: true,
    approval_required: true,
    execution_allowed_v1: AGENT_EXECUTION_ALLOWED_ACTION_TYPES.includes(actionType),
    ...applyAgentExecutionDangerousFlagDefaults(),
  };
  return request;
}

function buildRecord(request, status, resultSummary, { localChanges = [], blockedChanges = [], operatorNote = "" } = {}) {
  return applyAgentExecutionDangerousFlagDefaults({
    execution_record_id: `exec_rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    execution_request_id: request.execution_request_id,
    task_id: request.task_id,
    agent_id: request.agent_id,
    approval_id: request.approval_id,
    action_type: request.action_type,
    status,
    result_summary: resultSummary,
    local_changes: localChanges,
    blocked_changes: blockedChanges,
    audit_events: [
      buildAgentExecutionAuditEvent(
        status === "executed_local" ? "controlled_execution_recorded" : `controlled_execution_${status}`,
        resultSummary
      ),
    ],
    created_at: nowIso(),
    operator_note: operatorNote,
  });
}

function persistRequest(request) {
  return saveAgentExecutionRequests([request, ...getAgentExecutionRequests()]);
}

function persistRecord(record) {
  return saveAgentExecutionRecords([record, ...getAgentExecutionRecords()]);
}

function refreshState() {
  return {
    tasks: getAgentTasks(),
    workflowRuns: getAgentWorkflowRuns(),
    workflowSteps: getAgentWorkflowSteps(),
    coordinationPlans: getAgentCoordinationPlans(),
    handoffs: getAgentHandoffs(),
    contextPackets: getAgentContextPackets(),
    executionRequests: getAgentExecutionRequests(),
    executionRecords: getAgentExecutionRecords(),
    recommendationPackets: getAgentExecutionRecommendationPackets(),
  };
}

export function createControlledExecutionRequest(options = {}, context = {}) {
  const request = buildRequest(options);
  const evaluation = evaluateControlledExecutionRequest(request, context);
  const evaluatedRequest = {
    ...request,
    approval_id: evaluation.approval?.approval_id || request.approval_id,
    status: evaluation.status,
    blockers: evaluation.blockers,
    warnings: evaluation.warnings,
    execution_allowed_v1: evaluation.execution_allowed_v1,
    updated_at: nowIso(),
    ...applyAgentExecutionDangerousFlagDefaults(),
  };
  persistRequest(evaluatedRequest);
  return evaluatedRequest;
}

export function runControlledExecutionRequest(options = {}, context = {}) {
  const request = createControlledExecutionRequest(options, context);
  const operatorNote = options.requestedPayload?.operator_note || options.operatorNote || "";

  if (request.status !== "eligible") {
    const record = buildRecord(
      request,
      "blocked",
      "Controlled Executor V1 blocked this request. No production, public, external, warehouse, or auth action executed.",
      {
        blockedChanges: request.blockers,
        operatorNote,
      }
    );
    persistRecord(record);
    return { request: { ...request, status: "blocked" }, record, ...refreshState() };
  }

  let localChanges = [];
  let resultSummary = "Controlled Executor V1 recorded the allowlisted local action.";

  if (request.action_type === "mark_task_simulated_complete" && request.task_id) {
    applyAgentTaskAction(request.task_id, "complete", operatorNote || "Controlled Executor V1 simulated completion only.");
    localChanges.push(`task:${request.task_id}:status_completed_local`);
    resultSummary = "Task marked simulated complete in local Agent Workbench state only.";
  }

  if (request.action_type === "add_operator_note" && request.task_id) {
    appendAgentTaskAuditEvent(
      request.task_id,
      "controlled_executor_operator_note",
      operatorNote || "Controlled Executor V1 operator note recorded."
    );
    localChanges.push(`task:${request.task_id}:operator_note_added`);
  }

  if (request.action_type === "add_operator_note" && request.workflow_run_id) {
    applyWorkflowRunAction(request.workflow_run_id, "note", operatorNote || "Controlled Executor V1 operator note recorded.");
    localChanges.push(`workflow:${request.workflow_run_id}:operator_note_added`);
  }

  if (request.action_type === "add_operator_note" && request.coordination_plan_id) {
    applyCoordinationPlanAction(request.coordination_plan_id, "note", operatorNote || "Controlled Executor V1 operator note recorded.");
    localChanges.push(`coordination:${request.coordination_plan_id}:operator_note_added`);
  }

  if (request.action_type === "attach_context_packet" && request.task_id && request.context_packet_id) {
    updateAgentTask(request.task_id, (task) => ({
      ...task,
      context_packet_ids: [...new Set([...(task.context_packet_ids || []), request.context_packet_id])],
      audit_events: [
        ...(task.audit_events || []),
        buildAgentExecutionAuditEvent("context_packet_attached", "Controlled Executor V1 attached context packet to local task state."),
      ],
    }));
    localChanges.push(`task:${request.task_id}:context_packet_attached:${request.context_packet_id}`);
  }

  if (request.action_type === "attach_context_packet" && request.coordination_plan_id && request.context_packet_id) {
    updateCoordinationPlan(request.coordination_plan_id, (plan) => ({
      ...plan,
      related_context_packet_ids: [...new Set([...(plan.related_context_packet_ids || []), request.context_packet_id])],
      audit_events: [
        ...(plan.audit_events || []),
        buildAgentExecutionAuditEvent("context_packet_attached", "Controlled Executor V1 attached context packet to local coordination state."),
      ],
    }));
    localChanges.push(`coordination:${request.coordination_plan_id}:context_packet_attached:${request.context_packet_id}`);
  }

  if (request.action_type === "create_recommendation_packet") {
    const packet = applyAgentExecutionDangerousFlagDefaults({
      recommendation_packet_id: `recpkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      execution_request_id: request.execution_request_id,
      task_id: request.task_id,
      agent_id: request.agent_id,
      summary: options.requestedPayload?.recommendation || "Internal recommendation packet created for operator review.",
      status: "operator_review",
      created_at: nowIso(),
      public_approved: false,
      safe_for_public: false,
      audit_events: [
        buildAgentExecutionAuditEvent("recommendation_packet_created", "Internal recommendation packet created locally. No report published."),
      ],
    });
    saveAgentExecutionRecommendationPackets([packet, ...getAgentExecutionRecommendationPackets()]);
    localChanges.push(`recommendation_packet:${packet.recommendation_packet_id}:created_local`);
    resultSummary = "Internal recommendation packet created locally for operator review.";
  }

  if (request.action_type === "mark_workflow_step_reviewed" && request.workflow_step_id) {
    applyWorkflowStepAction(
      request.workflow_step_id,
      options.requestedPayload?.step_action === "complete" ? "complete" : "review",
      operatorNote || "Controlled Executor V1 marked workflow step reviewed."
    );
    localChanges.push(`workflow_step:${request.workflow_step_id}:reviewed_local`);
    resultSummary = "Workflow step marked reviewed in local Workflow Engine state.";
  }

  if (request.action_type === "mark_coordination_handoff_reviewed" && request.handoff_id) {
    const status = options.requestedPayload?.handoff_status === "rejected" ? "rejected" : "accepted";
    updateAgentHandoffStatus(
      request.handoff_id,
      status,
      operatorNote || "Controlled Executor V1 marked coordination handoff reviewed."
    );
    localChanges.push(`handoff:${request.handoff_id}:${status}_local`);
    resultSummary = "Coordination handoff marked reviewed in local coordination state.";
  }

  if (request.action_type === "create_execution_record") {
    localChanges.push(`execution_request:${request.execution_request_id}:record_created`);
    resultSummary = "Execution record created locally. No other local object was changed.";
  }

  const record = buildRecord(request, "executed_local", resultSummary, { localChanges, operatorNote });
  persistRecord(record);
  const nextRequests = getAgentExecutionRequests().map((item) => (
    item.execution_request_id === request.execution_request_id
      ? { ...item, status: "executed_local", updated_at: nowIso(), ...applyAgentExecutionDangerousFlagDefaults() }
      : item
  ));
  saveAgentExecutionRequests(nextRequests);

  return {
    request: { ...request, status: "executed_local" },
    record,
    ...refreshState(),
  };
}
