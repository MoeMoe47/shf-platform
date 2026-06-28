import { createAgentTask, getAgentTasks, updateAgentTask } from "./agentTaskStorage";
import { getAgentMemoryRecords } from "./agentMemoryStorage";
import {
  createCoordinationPlanFromTemplate,
  getAgentCoordinationPlans,
  getAgentHandoffs,
} from "./agentCoordinationStorage";
import {
  createWorkflowRunFromTemplate,
  getAgentWorkflowRuns,
  getAgentWorkflowSteps,
} from "./agentWorkflowStorage";
import { getAgentApprovalLedger } from "./agentApprovalLedger";
import { getProductionAutomationV2Recipe, PRODUCTION_AUTOMATION_V2_RECIPES } from "./productionAutomationV2Recipes";
import {
  PRODUCTION_AUTOMATION_V2_RECOMMENDATION_STORAGE_KEY,
  PRODUCTION_AUTOMATION_V2_RUN_STORAGE_KEY,
} from "./productionAutomationV2Runs";
import {
  applyProductionAutomationV2SafetyDefaults,
  buildProductionAutomationV2AuditEvent,
  calculateProductionAutomationV2Readiness,
} from "./productionAutomationV2Safety";

export { calculateProductionAutomationV2Metrics } from "./productionAutomationV2Metrics";

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

function readJson(key, fallback = []) {
  if (!canUseStorage()) return clone(fallback);
  try {
    const stored = globalThis.localStorage.getItem(key);
    if (!stored) return clone(fallback);
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function saveJson(key, value) {
  const safeValue = Array.isArray(value) ? value : [];
  if (canUseStorage()) {
    globalThis.localStorage.setItem(key, JSON.stringify(safeValue));
  }
  return safeValue;
}

export function getProductionAutomationV2Recipes() {
  return PRODUCTION_AUTOMATION_V2_RECIPES;
}

export function getProductionAutomationV2Runs() {
  return readJson(PRODUCTION_AUTOMATION_V2_RUN_STORAGE_KEY, []);
}

export function saveProductionAutomationV2Runs(runs) {
  return saveJson(PRODUCTION_AUTOMATION_V2_RUN_STORAGE_KEY, runs);
}

export function resetProductionAutomationV2Runs() {
  return saveProductionAutomationV2Runs([]);
}

export function getProductionAutomationV2Recommendations() {
  return readJson(PRODUCTION_AUTOMATION_V2_RECOMMENDATION_STORAGE_KEY, []);
}

export function saveProductionAutomationV2Recommendations(recommendations) {
  return saveJson(PRODUCTION_AUTOMATION_V2_RECOMMENDATION_STORAGE_KEY, recommendations);
}

export function resetProductionAutomationV2Recommendations() {
  return saveProductionAutomationV2Recommendations([]);
}

function buildChecklist(recipe) {
  if (recipe.recipe_type === "report_readiness") {
    return ["Confirm required sources", "Review governance blockers", "Prepare export metadata reminder", "Keep report unpublished"];
  }
  if (recipe.recipe_type === "launch_handoff" || recipe.recipe_type === "private_beta_demo") {
    return ["Confirm route smoke plan", "Review QA blockers", "Confirm owner approval reminder", "Keep external launch disabled"];
  }
  if (recipe.recipe_type === "daily_governance") {
    return ["Review governance checks", "Review runtime hygiene", "Review SHS/SHF boundary", "Do not run shell commands automatically"];
  }
  return ["Review source context", "Confirm operator approval", "Create local handoff checklist", "Keep production mutation disabled"];
}

function refreshState() {
  return {
    runs: getProductionAutomationV2Runs(),
    recommendations: getProductionAutomationV2Recommendations(),
    tasks: getAgentTasks(),
    workflowRuns: getAgentWorkflowRuns(),
    workflowSteps: getAgentWorkflowSteps(),
    coordinationPlans: getAgentCoordinationPlans(),
    handoffs: getAgentHandoffs(),
  };
}

function normalizeRunWithReadiness(run, recipe, context = {}) {
  const safeRun = applyProductionAutomationV2SafetyDefaults(run);
  const readiness = calculateProductionAutomationV2Readiness(safeRun, recipe, context);
  const status = safeRun.status === "draft" && readiness.ready ? "ready" : safeRun.status;
  return applyProductionAutomationV2SafetyDefaults({
    ...safeRun,
    status: readiness.blockers.length ? "blocked" : status,
    readiness_score: readiness.readiness_score,
    blockers: readiness.blockers,
    warnings: readiness.warnings,
    updated_at: nowIso(),
  });
}

export function createProductionAutomationV2RunFromRecipe(recipeId, options = {}) {
  const recipe = getProductionAutomationV2Recipe(recipeId);
  const createdAt = nowIso();
  const existingRuns = getProductionAutomationV2Runs();
  const selectedTask = options.selectedTask || null;
  const selectedApproval = options.selectedApprovalRecord || null;
  const memoryRecords = options.memoryRecords || getAgentMemoryRecords();
  const contextPackets = options.contextPackets || [];
  const approvalLedger = options.approvalLedger || getAgentApprovalLedger();
  const localChanges = [];

  const nextTasks = createAgentTask({
    title: `${recipe.title} checklist`,
    task_type: `${recipe.recipe_type}_automation_checklist`,
    assigned_agent_id: recipe.owner_agent_id,
    source_system: "production_automation_v2",
    risk_level: recipe.risk_level === "high" ? "high" : "medium",
    intended_action: "Create local Production Automation V2 checklist only. No production action will execute.",
    agent_recommendation: recipe.description,
    operator_note: "Production Automation V2 local checklist task.",
  });
  const createdTask = nextTasks[0] || null;
  if (createdTask) localChanges.push(`task:${createdTask.task_id}:created_local_checklist`);

  const nextCoordinationPlans = createCoordinationPlanFromTemplate(recipe.required_workflow_type, {
    tasks: nextTasks,
    memoryRecords,
    contextPackets,
  });
  const createdCoordinationPlan = nextCoordinationPlans[0] || null;
  if (createdCoordinationPlan) localChanges.push(`coordination:${createdCoordinationPlan.coordination_plan_id}:created_local`);

  const nextWorkflowRuns = createWorkflowRunFromTemplate(recipe.required_workflow_type, {
    tasks: nextTasks,
    memoryRecords,
    contextPackets,
    approvalLedger,
    handoffs: getAgentHandoffs(),
  });
  const createdWorkflowRun = nextWorkflowRuns[0] || null;
  if (createdWorkflowRun) localChanges.push(`workflow:${createdWorkflowRun.workflow_run_id}:created_local`);

  const relatedContextPacketIds = [...new Set([
    ...(selectedTask?.task_id ? contextPackets.filter((packet) => packet.task_id === selectedTask.task_id).map((packet) => packet.context_packet_id) : []),
    ...(createdCoordinationPlan?.related_context_packet_ids || []),
  ])];
  const relatedMemoryIds = [...new Set([
    ...(selectedTask?.task_id ? memoryRecords.filter((record) => record.related_task_id === selectedTask.task_id).map((record) => record.memory_id) : []),
    ...(createdCoordinationPlan?.related_memory_ids || []),
  ])];
  const relatedTaskIds = [...new Set([
    ...(selectedTask?.task_id ? [selectedTask.task_id] : []),
    ...(createdTask?.task_id ? [createdTask.task_id] : []),
    ...(createdCoordinationPlan?.related_task_ids || []),
  ])];
  const relatedApprovalIds = [...new Set([
    ...(selectedApproval?.approval_id ? [selectedApproval.approval_id] : []),
    ...approvalLedger.filter((record) => relatedTaskIds.includes(record.task_id) && record.approval_status === "approved").map((record) => record.approval_id),
  ])];

  const run = normalizeRunWithReadiness({
    automation_run_id: `auto_run_${String(existingRuns.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`,
    automation_recipe_id: recipe.automation_recipe_id,
    title: `${recipe.title} run`,
    status: "draft",
    risk_level: recipe.risk_level,
    owner_agent_id: recipe.owner_agent_id,
    related_workflow_run_id: createdWorkflowRun?.workflow_run_id || "",
    related_coordination_plan_id: createdCoordinationPlan?.coordination_plan_id || "",
    related_task_ids: relatedTaskIds,
    related_memory_ids: relatedMemoryIds,
    related_context_packet_ids: relatedContextPacketIds,
    related_approval_ids: relatedApprovalIds,
    related_report_id: options.relatedReportId || "",
    readiness_score: 0,
    blockers: [],
    warnings: ["Human approval and operator review remain required before controlled local actions."],
    local_actions_planned: recipe.allowed_local_actions.filter((action) => [
      "create_local_automation_run_record",
      "create_local_operator_checklist",
      "create_local_task_queue_item",
      "create_workflow_run_from_template",
      "create_coordination_plan_from_template",
      "create_local_recommendation_packet",
      "create_local_report_readiness_checklist",
      "create_local_launch_handoff_checklist",
      "create_local_audit_ready_summary",
    ].includes(action)),
    local_actions_completed: [
      "create_local_automation_run_record",
      "create_local_operator_checklist",
      ...(createdTask ? ["create_local_task_queue_item"] : []),
      ...(createdWorkflowRun ? ["create_workflow_run_from_template"] : []),
      ...(createdCoordinationPlan ? ["create_coordination_plan_from_template"] : []),
    ],
    local_change_log: localChanges,
    checklist_items: buildChecklist(recipe),
    operator_note: "Created from Production Automation V2 recipe. Local/internal records only.",
    human_approval_required: true,
    approval_required: true,
    execution_enabled_v2: false,
    created_at: createdAt,
    updated_at: createdAt,
    audit_events: [
      buildProductionAutomationV2AuditEvent("automation_run_created", "Created local Production Automation V2 run and local checklist references only."),
    ],
  }, recipe, {
    workflowRuns: nextWorkflowRuns,
    contextPackets,
  });

  saveProductionAutomationV2Runs([run, ...existingRuns]);
  return refreshState();
}

export function applyProductionAutomationV2RunAction(runId, action, note = "", context = {}) {
  const runs = getProductionAutomationV2Runs();
  const recommendations = getProductionAutomationV2Recommendations();
  let nextRecommendations = recommendations;
  const nextRuns = runs.map((run) => {
    if (run.automation_run_id !== runId) return run;
    const recipe = getProductionAutomationV2Recipe(run.automation_recipe_id);
    const blockers = [...(run.blockers || [])];
    const warnings = [...(run.warnings || [])];
    const completed = [...(run.local_actions_completed || [])];
    let status = run.status;

    if (action === "review") status = "in_review";
    if (action === "approve") status = blockers.length ? "blocked" : "approved";
    if (action === "block") {
      status = "blocked";
      blockers.push(note || "operator_blocked");
    }
    if (action === "complete") {
      status = blockers.length ? "blocked" : "completed";
      if (blockers.length) warnings.push("Completion blocked until automation blockers are resolved.");
    }
    if (action === "note") warnings.push(note || "Operator note recorded.");
    if (action === "checklist") {
      completed.push("create_local_operator_checklist");
      warnings.push("Local checklist action record created. No production action executed.");
    }
    if (action === "recommendation") {
      const recommendation = {
        recommendation_packet_id: `pa2rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        automation_run_id: run.automation_run_id,
        automation_recipe_id: run.automation_recipe_id,
        title: `${run.title} recommendation`,
        summary: note || "Internal Production Automation V2 recommendation packet for operator review.",
        status: "operator_review",
        safe_for_public: false,
        public_approved: false,
        created_at: nowIso(),
      };
      nextRecommendations = [recommendation, ...nextRecommendations];
      completed.push("create_local_recommendation_packet");
    }

    return normalizeRunWithReadiness({
      ...run,
      status,
      blockers: [...new Set(blockers)],
      warnings: [...new Set(warnings)],
      local_actions_completed: [...new Set(completed)],
      operator_note: note || run.operator_note,
      audit_events: [
        ...(run.audit_events || []),
        buildProductionAutomationV2AuditEvent(`automation_${action}`, note || `Operator action: ${action}. Local records only.`),
      ],
    }, recipe, context);
  });

  saveProductionAutomationV2Runs(nextRuns);
  saveProductionAutomationV2Recommendations(nextRecommendations);
  return refreshState();
}

export function attachContextPacketToProductionAutomationRun(runId, contextPacketId, context = {}) {
  const runs = getProductionAutomationV2Runs();
  const nextRuns = runs.map((run) => {
    if (run.automation_run_id !== runId) return run;
    const recipe = getProductionAutomationV2Recipe(run.automation_recipe_id);
    return normalizeRunWithReadiness({
      ...run,
      related_context_packet_ids: [...new Set([...(run.related_context_packet_ids || []), contextPacketId])],
      local_actions_completed: [...new Set([...(run.local_actions_completed || []), "attach_context_packet"])],
      audit_events: [
        ...(run.audit_events || []),
        buildProductionAutomationV2AuditEvent("automation_context_packet_attached", "Attached context packet to local Production Automation V2 run."),
      ],
    }, recipe, context);
  });
  saveProductionAutomationV2Runs(nextRuns);
  return refreshState();
}

export function linkAutomationRunToTask(runId, taskId) {
  if (!taskId) return refreshState();
  updateAgentTask(taskId, (task) => ({
    ...task,
    automation_run_ids: [...new Set([...(task.automation_run_ids || []), runId])],
    audit_events: [
      ...(task.audit_events || []),
      buildProductionAutomationV2AuditEvent("production_automation_v2_linked", "Linked local Production Automation V2 run to task."),
    ],
  }));
  return refreshState();
}
