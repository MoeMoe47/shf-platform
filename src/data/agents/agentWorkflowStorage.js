import { getAgentApprovalLedger } from "./agentApprovalLedger";
import { getAgentContextPackets, getAgentMemoryRecords } from "./agentMemoryStorage";
import { getAgentTasks } from "./agentTaskStorage";
import { getAgentCoordinationPlans, getAgentHandoffs } from "./agentCoordinationStorage";
import { AGENT_WORKFLOW_RUN_SEED_V1, AGENT_WORKFLOW_RUN_STORAGE_KEY } from "./agentWorkflowRuns";
import { AGENT_WORKFLOW_STEP_SEED_V1, AGENT_WORKFLOW_STEP_STORAGE_KEY } from "./agentWorkflowSteps";
import { AGENT_WORKFLOW_TEMPLATES_V1, getAgentWorkflowTemplate, getNextRecommendedWorkflowStep } from "./agentWorkflowTemplates";
import { SHS_AGENT_WORKFORCE_V1 } from "./shsAgentWorkforce";
import {
  AGENT_WORKFLOW_DANGEROUS_FLAGS_FALSE,
  applyAgentWorkflowSafetyDefaults,
  buildAgentWorkflowAuditEvent,
} from "./agentWorkflowSafety";

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

const CANONICAL_AGENTS_BY_ID = Object.freeze(Object.fromEntries(SHS_AGENT_WORKFORCE_V1.map((agent) => [agent.id, agent])));

function getStoredContextPackets() {
  return getAgentContextPackets();
}

function calculateProgress(steps = []) {
  if (!steps.length) return 0;
  const finished = steps.filter((step) => ["completed", "skipped"].includes(step.status)).length;
  return Math.round((finished / steps.length) * 100);
}

function normalizeStep(step) {
  return applyAgentWorkflowSafetyDefaults({
    ...step,
    human_review_required: true,
    safe_execution_stub_allowed: step.safe_execution_stub_allowed !== false,
    ...AGENT_WORKFLOW_DANGEROUS_FLAGS_FALSE,
  }, { agentsById: CANONICAL_AGENTS_BY_ID, contextPackets: getStoredContextPackets() });
}

function normalizeRun(run, allSteps = []) {
  const runSteps = allSteps
    .filter((step) => step.workflow_run_id === run.workflow_run_id)
    .sort((a, b) => a.sequence_index - b.sequence_index);
  const nextStep = getNextRecommendedWorkflowStep(runSteps);
  const currentStep = runSteps.find((step) => ["ready", "in_review", "blocked"].includes(step.status))
    || nextStep
    || runSteps[0]
    || null;
  const progress = calculateProgress(runSteps);
  return applyAgentWorkflowSafetyDefaults({
    ...run,
    current_step_id: currentStep?.workflow_step_id || "",
    step_ids: runSteps.map((step) => step.workflow_step_id),
    progress_percent: progress,
    next_recommended_step_id: nextStep?.workflow_step_id || "",
    human_review_required: true,
    approval_required: true,
    ...AGENT_WORKFLOW_DANGEROUS_FLAGS_FALSE,
  }, { agentsById: CANONICAL_AGENTS_BY_ID, contextPackets: getStoredContextPackets(), steps: runSteps });
}

function saveRunsAndSteps(runs, steps) {
  const normalizedSteps = (Array.isArray(steps) ? steps : []).map((step) => normalizeStep(step));
  const normalizedRuns = (Array.isArray(runs) ? runs : []).map((run) => normalizeRun(run, normalizedSteps));
  saveJson(AGENT_WORKFLOW_STEP_STORAGE_KEY, normalizedSteps);
  return saveJson(AGENT_WORKFLOW_RUN_STORAGE_KEY, normalizedRuns);
}

export function getAgentWorkflowSteps() {
  return readJson(AGENT_WORKFLOW_STEP_STORAGE_KEY, AGENT_WORKFLOW_STEP_SEED_V1).map((step) => normalizeStep(step));
}

export function saveAgentWorkflowSteps(steps) {
  const runs = getAgentWorkflowRuns();
  return saveRunsAndSteps(runs, steps);
}

export function getAgentWorkflowRuns() {
  const steps = readJson(AGENT_WORKFLOW_STEP_STORAGE_KEY, AGENT_WORKFLOW_STEP_SEED_V1).map((step) => normalizeStep(step));
  return readJson(AGENT_WORKFLOW_RUN_STORAGE_KEY, AGENT_WORKFLOW_RUN_SEED_V1).map((run) => normalizeRun(run, steps));
}

export function resetAgentWorkflowRuns() {
  return saveRunsAndSteps(clone(AGENT_WORKFLOW_RUN_SEED_V1), clone(AGENT_WORKFLOW_STEP_SEED_V1));
}

export function resetAgentWorkflowSteps() {
  resetAgentWorkflowRuns();
  return getAgentWorkflowSteps();
}

export function getStepsForWorkflowRun(runId, steps = getAgentWorkflowSteps()) {
  return (steps || [])
    .filter((step) => step.workflow_run_id === runId)
    .sort((a, b) => a.sequence_index - b.sequence_index);
}

export function getAgentWorkflowTemplates() {
  return AGENT_WORKFLOW_TEMPLATES_V1;
}

function buildStepsForRun(runId, template, { tasks = [], memoryRecords = [], contextPackets = [], approvalLedger = [], handoffs = [] } = {}) {
  return template.steps.map((stepTemplate, index) => {
    const relatedTask = tasks.find((task) => task.assigned_agent_id === stepTemplate.owning_agent_id) || tasks[index] || null;
    const relatedMemoryIds = memoryRecords
      .filter((record) => record.related_agent_id === stepTemplate.owning_agent_id || record.related_task_id === relatedTask?.task_id)
      .slice(0, 2)
      .map((record) => record.memory_id);
    const relatedContextPacketIds = contextPackets
      .filter((packet) => packet.agent_id === stepTemplate.owning_agent_id || packet.task_id === relatedTask?.task_id)
      .slice(0, 2)
      .map((packet) => packet.context_packet_id);
    const relatedApproval = approvalLedger.find((record) => record.task_id === relatedTask?.task_id) || null;
    const relatedHandoff = handoffs.find((handoff) => handoff.to_agent_id === stepTemplate.owning_agent_id || handoff.from_agent_id === stepTemplate.owning_agent_id) || null;
    const blockedItems = contextPackets
      .filter((packet) => relatedContextPacketIds.includes(packet.context_packet_id))
      .flatMap((packet) => packet.blocked_items || []);
    return normalizeStep({
      workflow_step_id: `wfstep_${runId.replace(/^wf_/, "")}_${String(index + 1).padStart(3, "0")}`,
      workflow_run_id: runId,
      sequence_index: stepTemplate.sequence_index,
      title: stepTemplate.title,
      description: stepTemplate.description,
      owning_agent_id: stepTemplate.owning_agent_id,
      step_type: stepTemplate.step_type,
      status: index === 0 ? (blockedItems.length ? "blocked" : "ready") : "not_started",
      risk_level: ["shs_report_agent", "shs_governance_agent", "shs_clientops_agent", "shs_executive_agent"].includes(stepTemplate.owning_agent_id) ? "high" : "medium",
      required_before_start: index > 0 ? [`step_${index}_operator_review`] : [],
      required_before_complete: ["human_review_required"],
      related_task_id: relatedTask?.task_id || "",
      related_memory_ids: relatedMemoryIds,
      related_context_packet_ids: relatedContextPacketIds,
      related_approval_id: relatedApproval?.approval_id || "",
      related_handoff_id: relatedHandoff?.handoff_id || "",
      operator_note: "",
      human_review_required: true,
      safe_execution_stub_allowed: true,
      created_at: nowIso(),
      updated_at: nowIso(),
      completed_at: "",
      blockers: blockedItems.length ? [...new Set(blockedItems.map((item) => `context_packet_blocked:${item}`))] : [],
      warnings: ["Workflow step is local review only; no production action is enabled."],
      audit_events: [buildAgentWorkflowAuditEvent("workflow_step_created", "Created safe local workflow step.")],
      ...AGENT_WORKFLOW_DANGEROUS_FLAGS_FALSE,
    });
  });
}

function buildRunFromTemplate(template, options = {}) {
  const runs = getAgentWorkflowRuns();
  const workflowRunId = `wf_${String(runs.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`;
  const steps = buildStepsForRun(workflowRunId, template, options);
  const relatedTaskIds = [...new Set(steps.map((step) => step.related_task_id).filter(Boolean))];
  const relatedMemoryIds = [...new Set(steps.flatMap((step) => step.related_memory_ids || []))];
  const relatedContextPacketIds = [...new Set(steps.flatMap((step) => step.related_context_packet_ids || []))];
  const relatedApprovalIds = [...new Set(steps.map((step) => step.related_approval_id).filter(Boolean))];
  const relatedHandoffIds = [...new Set(steps.map((step) => step.related_handoff_id).filter(Boolean))];
  const hasBlockedStep = steps.some((step) => step.status === "blocked" || step.blockers?.length);
  const sourcePlan = options.sourceCoordinationPlan || null;

  return {
    run: normalizeRun({
      workflow_run_id: workflowRunId,
      title: `${template.display_name}`,
      workflow_type: template.workflow_type,
      source_coordination_plan_id: sourcePlan?.coordination_plan_id || "",
      status: hasBlockedStep || sourcePlan?.status === "blocked" || sourcePlan?.blockers?.length ? "blocked" : "draft",
      priority: sourcePlan?.priority || (template.workflow_type === "launch_readiness" ? "urgent" : "high"),
      risk_level: sourcePlan?.risk_level || (["report_generation", "clientops_review", "launch_readiness"].includes(template.workflow_type) ? "high" : "medium"),
      owner_agent_id: sourcePlan?.owner_agent_id || template.default_owner_agent_id,
      participating_agent_ids: sourcePlan?.participating_agent_ids || template.participating_agent_ids,
      current_step_id: steps[0]?.workflow_step_id || "",
      step_ids: steps.map((step) => step.workflow_step_id),
      related_task_ids: sourcePlan?.related_task_ids?.length ? sourcePlan.related_task_ids : relatedTaskIds,
      related_memory_ids: sourcePlan?.related_memory_ids?.length ? sourcePlan.related_memory_ids : relatedMemoryIds,
      related_context_packet_ids: sourcePlan?.related_context_packet_ids?.length ? sourcePlan.related_context_packet_ids : relatedContextPacketIds,
      related_approval_ids: relatedApprovalIds,
      related_handoff_ids: sourcePlan ? options.handoffs?.filter((handoff) => handoff.coordination_plan_id === sourcePlan.coordination_plan_id).map((handoff) => handoff.handoff_id) || relatedHandoffIds : relatedHandoffIds,
      progress_percent: 0,
      next_recommended_step_id: steps.find((step) => !["completed", "skipped"].includes(step.status))?.workflow_step_id || "",
      human_review_required: true,
      approval_required: true,
      created_at: nowIso(),
      updated_at: nowIso(),
      blockers: sourcePlan?.blockers || [],
      warnings: ["Agent Workflow Engine V1 structures multi-agent workflows only. It does not execute production actions, publish reports, create public-approved SHF impact data, send external messages, or write warehouse records."],
      audit_events: [buildAgentWorkflowAuditEvent("workflow_run_created", sourcePlan ? "Created from coordination plan. Execution remains disabled." : "Created from safe workflow template.")],
      ...AGENT_WORKFLOW_DANGEROUS_FLAGS_FALSE,
    }, steps),
    steps,
  };
}

export function createWorkflowRunFromTemplate(workflowType, options = {}) {
  const template = getAgentWorkflowTemplate(workflowType);
  const runs = getAgentWorkflowRuns();
  const steps = getAgentWorkflowSteps();
  const built = buildRunFromTemplate(template, {
    tasks: options.tasks || getAgentTasks(),
    memoryRecords: options.memoryRecords || getAgentMemoryRecords(),
    contextPackets: options.contextPackets || getAgentContextPackets(),
    approvalLedger: options.approvalLedger || getAgentApprovalLedger(),
    handoffs: options.handoffs || getAgentHandoffs(),
  });
  return saveRunsAndSteps([built.run, ...runs], [...built.steps, ...steps]);
}

export function createWorkflowRunFromCoordinationPlan(plan, options = {}) {
  if (!plan) return getAgentWorkflowRuns();
  const template = getAgentWorkflowTemplate(plan.workflow_type);
  const runs = getAgentWorkflowRuns();
  const steps = getAgentWorkflowSteps();
  const built = buildRunFromTemplate(template, {
    tasks: options.tasks || getAgentTasks(),
    memoryRecords: options.memoryRecords || getAgentMemoryRecords(),
    contextPackets: options.contextPackets || getAgentContextPackets(),
    approvalLedger: options.approvalLedger || getAgentApprovalLedger(),
    handoffs: options.handoffs || getAgentHandoffs(),
    sourceCoordinationPlan: plan,
  });
  return saveRunsAndSteps([built.run, ...runs], [...built.steps, ...steps]);
}

export function applyWorkflowRunAction(runId, action, note = "") {
  const runs = getAgentWorkflowRuns();
  const steps = getAgentWorkflowSteps();
  const nextRuns = runs.map((run) => {
    if (run.workflow_run_id !== runId) return run;
    const runSteps = getStepsForWorkflowRun(runId, steps);
    const unresolvedBlockers = run.blockers?.length || runSteps.some((step) => step.status === "blocked" || step.blockers?.length);
    const unfinishedSteps = runSteps.filter((step) => !["completed", "skipped"].includes(step.status));
    let status = run.status;
    const warnings = [...(run.warnings || [])];
    const blockers = [...(run.blockers || [])];

    if (action === "activate") status = unresolvedBlockers ? "blocked" : "active";
    if (action === "pause") status = "paused";
    if (action === "resume") status = unresolvedBlockers ? "blocked" : "active";
    if (action === "block") {
      status = "blocked";
      blockers.push(note || "operator_blocked");
    }
    if (action === "complete") {
      if (unresolvedBlockers || unfinishedSteps.length) {
        status = "blocked";
        blockers.push(unresolvedBlockers ? "workflow_blocked" : "completion_requires_finished_steps");
        warnings.push("Completion requires all required steps completed or skipped with operator note.");
      } else {
        status = "completed";
      }
    }
    if (action === "note") warnings.push(note || "Operator note recorded.");

    return normalizeRun({
      ...run,
      status,
      blockers: [...new Set(blockers)],
      warnings: [...new Set(warnings)],
      updated_at: nowIso(),
      audit_events: [
        ...(run.audit_events || []),
        buildAgentWorkflowAuditEvent(`workflow_${action}`, note || `Operator action: ${action}. Execution remains disabled.`),
      ],
    }, steps);
  });
  return saveRunsAndSteps(nextRuns, steps);
}

export function applyWorkflowStepAction(stepId, action, note = "") {
  const runs = getAgentWorkflowRuns();
  const steps = getAgentWorkflowSteps();
  const nextSteps = steps.map((step) => {
    if (step.workflow_step_id !== stepId) return step;
    const blockers = action === "block" ? [...new Set([...(step.blockers || []), note || "operator_blocked"])] : (step.blockers || []);
    let status = step.status;
    if (action === "review") status = blockers.length ? "blocked" : "in_review";
    if (action === "complete") status = blockers.length ? "blocked" : "completed";
    if (action === "skip") status = "skipped";
    if (action === "block") status = "blocked";
    if (action === "note") status = step.status;
    return normalizeStep({
      ...step,
      status,
      blockers,
      operator_note: note || (action === "skip" ? "Operator skipped this V1 review step." : step.operator_note),
      completed_at: ["complete", "skip"].includes(action) && !blockers.length ? nowIso() : step.completed_at,
      updated_at: nowIso(),
      audit_events: [
        ...(step.audit_events || []),
        buildAgentWorkflowAuditEvent(`workflow_step_${action}`, note || `Step action: ${action}. No execution performed.`),
      ],
    });
  });
  const current = nextSteps.find((step) => step.workflow_step_id === stepId);
  const runSteps = getStepsForWorkflowRun(current?.workflow_run_id, nextSteps);
  const nextRecommended = getNextRecommendedWorkflowStep(runSteps);
  const advancedSteps = nextRecommended && nextRecommended.status === "not_started"
    ? nextSteps.map((step) => step.workflow_step_id === nextRecommended.workflow_step_id ? normalizeStep({ ...step, status: "ready" }) : step)
    : nextSteps;
  return saveRunsAndSteps(runs, advancedSteps);
}

export function getWorkflowRunsForTask(taskId, runs = getAgentWorkflowRuns()) {
  return (runs || []).filter((run) => run.related_task_ids?.includes(taskId));
}

export function getWorkflowRunsForCoordinationPlan(planId, runs = getAgentWorkflowRuns()) {
  return (runs || []).filter((run) => run.source_coordination_plan_id === planId);
}
