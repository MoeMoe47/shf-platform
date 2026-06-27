import React from "react";
import { AGENT_CONTRACT_BRIDGE_SUMMARY_V1 } from "@/data/agents/agentContractBridge";
import { SHS_AGENT_WORKFORCE_V1 } from "@/data/agents/shsAgentWorkforce";
import { getAgentApprovalLedger, recordAgentApprovalDecision, resetAgentApprovalLedger } from "@/data/agents/agentApprovalLedger";
import { getLatestSafeExecutionStubRunForTask, getSafeExecutionStubRuns, recordSafeExecutionStubRun, resetSafeExecutionStubRuns } from "@/data/agents/agentSafeExecutionStub";
import { appendAgentTaskAuditEvent, applyAgentTaskAction, createAgentTask, getAgentTasks, resetAgentTasks, updateAgentTask } from "@/data/agents/agentTaskStorage";
import { calculateAgentTaskMetrics } from "@/data/agents/agentTaskMetrics";
import { calculateAgentMemoryMetrics } from "@/data/agents/agentMemoryMetrics";
import { calculateAgentCoordinationMetrics } from "@/data/agents/agentCoordinationMetrics";
import { calculateAgentWorkflowMetrics } from "@/data/agents/agentWorkflowMetrics";
import {
  archiveAgentMemoryRecord,
  createAgentContextPacket,
  createAgentMemoryRecord,
  getAgentContextPackets,
  getAgentMemoryRecords,
  getContextPacketsForTask,
  getMemoryRecordsForTask,
  markAgentMemoryNeedsReview,
  resetAgentContextPackets,
  resetAgentMemoryRecords,
} from "@/data/agents/agentMemoryStorage";
import { isMemorySafeForTaskContext, scanAgentMemorySafety } from "@/data/agents/agentMemorySafety";
import {
  applyCoordinationPlanAction,
  createAgentHandoff,
  createCoordinationPlanFromTemplate,
  getAgentCoordinationPlans,
  getAgentHandoffs,
  getCoordinationTemplates,
  getHandoffsForPlan,
  resetAgentCoordinationPlans,
  resetAgentHandoffs,
  updateAgentHandoffStatus,
} from "@/data/agents/agentCoordinationStorage";
import { scanAgentCoordinationSafety } from "@/data/agents/agentCoordinationSafety";
import {
  applyWorkflowRunAction,
  applyWorkflowStepAction,
  createWorkflowRunFromCoordinationPlan,
  createWorkflowRunFromTemplate,
  getAgentWorkflowRuns,
  getAgentWorkflowSteps,
  getAgentWorkflowTemplates,
  getStepsForWorkflowRun,
  getWorkflowRunsForTask,
  resetAgentWorkflowRuns,
} from "@/data/agents/agentWorkflowStorage";
import { scanAgentWorkflowSafety } from "@/data/agents/agentWorkflowSafety";
import {
  AGENT_EXECUTION_ALLOWED_ACTION_TYPES,
  calculateAgentExecutionMetrics,
  getAgentExecutionRecords,
  getAgentExecutionRecommendationPackets,
  getAgentExecutionRequests,
  resetAgentExecutionRecords,
  resetAgentExecutionRecommendationPackets,
  resetAgentExecutionRequests,
  runControlledExecutionRequest,
} from "@/data/agents/agentControlledExecutor";
import AgentOverviewPanel from "./components/AgentOverviewPanel";
import AgentTaskQueue from "./components/AgentTaskQueue";
import AgentTaskDetail from "./components/AgentTaskDetail";
import AgentApprovalPanel from "./components/AgentApprovalPanel";
import AgentApprovalLedger from "./components/AgentApprovalLedger";
import AgentContractBridgePanel from "./components/AgentContractBridgePanel";
import AgentSafeExecutionPanel from "./components/AgentSafeExecutionPanel";
import AgentActivityTimeline from "./components/AgentActivityTimeline";
import AgentPerformanceSnapshot from "./components/AgentPerformanceSnapshot";
import AgentMemoryPanel from "./components/AgentMemoryPanel";
import AgentContextPacketPanel from "./components/AgentContextPacketPanel";
import AgentMemoryDetail from "./components/AgentMemoryDetail";
import AgentMemorySafetyPanel from "./components/AgentMemorySafetyPanel";
import AgentCoordinationPanel from "./components/AgentCoordinationPanel";
import AgentCoordinationPlanDetail from "./components/AgentCoordinationPlanDetail";
import AgentHandoffTrail from "./components/AgentHandoffTrail";
import AgentWorkflowTemplatePanel from "./components/AgentWorkflowTemplatePanel";
import AgentCoordinationSafetyPanel from "./components/AgentCoordinationSafetyPanel";
import AgentWorkflowEnginePanel from "./components/AgentWorkflowEnginePanel";
import AgentWorkflowRunDetail from "./components/AgentWorkflowRunDetail";
import AgentWorkflowStepList from "./components/AgentWorkflowStepList";
import AgentWorkflowProgress from "./components/AgentWorkflowProgress";
import AgentWorkflowSafetyPanel from "./components/AgentWorkflowSafetyPanel";
import AgentControlledExecutorPanel from "./components/AgentControlledExecutorPanel";
import AgentExecutionRecordTable from "./components/AgentExecutionRecordTable";
import AgentExecutionSafetyPanel from "./components/AgentExecutionSafetyPanel";
import "./agentWorkbench.css";

const SAFETY_BOUNDARIES = [
  "No production execution",
  "No public data mutation",
  "No SHF Impact Data Spine mutation",
  "No public_approved mutation",
  "No external delivery",
  "No webhooks, notifications, or warehouse writes",
  "Safe stub simulation only",
];

export default function AgentWorkbenchPage() {
  const [tasks, setTasks] = React.useState(() => getAgentTasks());
  const [approvalLedger, setApprovalLedger] = React.useState(() => getAgentApprovalLedger());
  const [stubRuns, setStubRuns] = React.useState(() => getSafeExecutionStubRuns());
  const [memoryRecords, setMemoryRecords] = React.useState(() => getAgentMemoryRecords());
  const [contextPackets, setContextPackets] = React.useState(() => getAgentContextPackets());
  const [coordinationPlans, setCoordinationPlans] = React.useState(() => getAgentCoordinationPlans());
  const [handoffs, setHandoffs] = React.useState(() => getAgentHandoffs());
  const [workflowRuns, setWorkflowRuns] = React.useState(() => getAgentWorkflowRuns());
  const [workflowSteps, setWorkflowSteps] = React.useState(() => getAgentWorkflowSteps());
  const [executionRequests, setExecutionRequests] = React.useState(() => getAgentExecutionRequests());
  const [executionRecords, setExecutionRecords] = React.useState(() => getAgentExecutionRecords());
  const [, setRecommendationPackets] = React.useState(() => getAgentExecutionRecommendationPackets());
  const [selectedTaskId, setSelectedTaskId] = React.useState(() => getAgentTasks()[0]?.task_id || "");
  const [selectedAgentId, setSelectedAgentId] = React.useState(SHS_AGENT_WORKFORCE_V1[0]?.id || "");
  const [selectedMemoryId, setSelectedMemoryId] = React.useState(() => getAgentMemoryRecords()[0]?.memory_id || "");
  const [selectedCoordinationPlanId, setSelectedCoordinationPlanId] = React.useState(() => getAgentCoordinationPlans()[0]?.coordination_plan_id || "");
  const [selectedWorkflowRunId, setSelectedWorkflowRunId] = React.useState(() => getAgentWorkflowRuns()[0]?.workflow_run_id || "");
  const [selectedExecutionActionType, setSelectedExecutionActionType] = React.useState(AGENT_EXECUTION_ALLOWED_ACTION_TYPES[0]);

  const agentsById = React.useMemo(
    () => Object.fromEntries(SHS_AGENT_WORKFORCE_V1.map((agent) => [agent.id, agent])),
    []
  );
  const selectedTask = tasks.find((task) => task.task_id === selectedTaskId) || tasks[0] || null;
  const selectedAgent = agentsById[selectedTask?.assigned_agent_id] || agentsById[selectedAgentId] || null;
  const selectedMemory = memoryRecords.find((record) => record.memory_id === selectedMemoryId) || memoryRecords[0] || null;
  const selectedCoordinationPlan = coordinationPlans.find((plan) => plan.coordination_plan_id === selectedCoordinationPlanId) || coordinationPlans[0] || null;
  const selectedWorkflowRun = workflowRuns.find((run) => run.workflow_run_id === selectedWorkflowRunId) || workflowRuns[0] || null;
  const selectedWorkflowSteps = selectedWorkflowRun ? getStepsForWorkflowRun(selectedWorkflowRun.workflow_run_id, workflowSteps) : [];
  const selectedWorkflowStep = selectedWorkflowSteps.find((step) => ["ready", "in_review"].includes(step.status))
    || selectedWorkflowSteps[0]
    || null;
  const selectedWorkflowCoordinationPlan = selectedWorkflowRun?.source_coordination_plan_id
    ? coordinationPlans.find((plan) => plan.coordination_plan_id === selectedWorkflowRun.source_coordination_plan_id) || null
    : null;
  const selectedCoordinationPlanHandoffs = selectedCoordinationPlan ? getHandoffsForPlan(selectedCoordinationPlan.coordination_plan_id, handoffs) : [];
  const selectedCoordinationPlanTasks = selectedCoordinationPlan
    ? tasks.filter((task) => selectedCoordinationPlan.related_task_ids?.includes(task.task_id))
    : [];
  const selectedCoordinationPlanSafety = React.useMemo(
    () => scanAgentCoordinationSafety(selectedCoordinationPlan || {}, { agentsById, contextPackets }),
    [selectedCoordinationPlan, agentsById, contextPackets]
  );
  const selectedMemorySafety = React.useMemo(() => scanAgentMemorySafety(selectedMemory || {}), [selectedMemory]);
  const selectedTaskMemoryRecords = selectedTask ? getMemoryRecordsForTask(selectedTask.task_id, memoryRecords) : [];
  const selectedTaskContextPackets = selectedTask ? getContextPacketsForTask(selectedTask.task_id, contextPackets) : [];
  const selectedTaskCoordinationPlans = selectedTask
    ? coordinationPlans.filter((plan) => plan.related_task_ids?.includes(selectedTask.task_id))
    : [];
  const selectedTaskWorkflowRuns = selectedTask ? getWorkflowRunsForTask(selectedTask.task_id, workflowRuns) : [];
  const selectedWorkflowSafety = React.useMemo(
    () => scanAgentWorkflowSafety(selectedWorkflowRun || {}, { agentsById, contextPackets, steps: selectedWorkflowSteps }),
    [selectedWorkflowRun, agentsById, contextPackets, selectedWorkflowSteps]
  );
  const selectedTaskMemoryRiskStatus = selectedTaskMemoryRecords.some((record) => record.status === "needs_review" || record.safety_flags?.length)
    || selectedTaskContextPackets.some((packet) => packet.blocked_items?.length)
    ? "needs_review"
    : "clear";
  const selectedApprovalRecord = selectedTask
    ? [...approvalLedger].find((record) => record.task_id === selectedTask.task_id) || null
    : null;
  const latestStubRun = selectedTask ? getLatestSafeExecutionStubRunForTask(selectedTask.task_id, stubRuns) : null;
  const metrics = React.useMemo(() => calculateAgentTaskMetrics(tasks, SHS_AGENT_WORKFORCE_V1), [tasks]);
  const memoryMetrics = React.useMemo(() => calculateAgentMemoryMetrics(memoryRecords, contextPackets), [memoryRecords, contextPackets]);
  const coordinationMetrics = React.useMemo(() => calculateAgentCoordinationMetrics(coordinationPlans, handoffs), [coordinationPlans, handoffs]);
  const workflowMetrics = React.useMemo(() => calculateAgentWorkflowMetrics(workflowRuns, workflowSteps), [workflowRuns, workflowSteps]);
  const executionMetrics = React.useMemo(() => calculateAgentExecutionMetrics(executionRecords, executionRequests), [executionRecords, executionRequests]);
  const coordinationTemplates = React.useMemo(() => getCoordinationTemplates(), []);
  const workflowTemplates = React.useMemo(() => getAgentWorkflowTemplates(), []);
  const selectedExecutionContextPacket = selectedTaskContextPackets[0] || contextPackets[0] || null;
  const selectedExecutionHandoff = selectedCoordinationPlanHandoffs[0] || handoffs[0] || null;
  const executionContext = React.useMemo(() => ({
    task: selectedTask,
    agent: selectedAgent,
    approvalLedger,
    contextPacket: selectedExecutionContextPacket,
    contextPackets: selectedTaskContextPackets,
    coordinationPlan: selectedCoordinationPlan,
    handoff: selectedExecutionHandoff,
    workflowRun: selectedWorkflowRun,
    workflowStep: selectedWorkflowStep,
  }), [
    selectedTask,
    selectedAgent,
    approvalLedger,
    selectedExecutionContextPacket,
    selectedTaskContextPackets,
    selectedCoordinationPlan,
    selectedExecutionHandoff,
    selectedWorkflowRun,
    selectedWorkflowStep,
  ]);
  const previewExecutionRequest = React.useMemo(() => ({
    execution_request_id: "exec_req_preview",
    task_id: selectedTask?.task_id || "",
    agent_id: selectedAgent?.id || "",
    approval_id: selectedApprovalRecord?.approval_id || "",
    workflow_run_id: selectedWorkflowRun?.workflow_run_id || "",
    workflow_step_id: selectedWorkflowStep?.workflow_step_id || "",
    coordination_plan_id: selectedCoordinationPlan?.coordination_plan_id || "",
    handoff_id: selectedExecutionHandoff?.handoff_id || "",
    context_packet_id: selectedExecutionContextPacket?.context_packet_id || "",
    action_type: selectedExecutionActionType,
    requested_by: "operator",
    risk_level: selectedTask?.risk_level || "medium",
    status: "draft",
    requested_payload: {},
    created_at: "",
    updated_at: "",
    blockers: [],
    warnings: [],
    human_approval_required: true,
    approval_required: true,
    execution_allowed_v1: AGENT_EXECUTION_ALLOWED_ACTION_TYPES.includes(selectedExecutionActionType),
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
  }), [
    selectedTask,
    selectedAgent,
    selectedApprovalRecord,
    selectedWorkflowRun,
    selectedWorkflowStep,
    selectedCoordinationPlan,
    selectedExecutionHandoff,
    selectedExecutionContextPacket,
    selectedExecutionActionType,
  ]);

  React.useEffect(() => {
    if (selectedTask && selectedTask.assigned_agent_id) {
      setSelectedAgentId(selectedTask.assigned_agent_id);
    }
  }, [selectedTask?.task_id, selectedTask?.assigned_agent_id]);

  function refresh(nextTasks) {
    setTasks(nextTasks);
    if (!nextTasks.find((task) => task.task_id === selectedTaskId)) {
      setSelectedTaskId(nextTasks[0]?.task_id || "");
    }
  }

  function refreshMemory(nextRecords) {
    setMemoryRecords(nextRecords);
    if (!nextRecords.find((record) => record.memory_id === selectedMemoryId)) {
      setSelectedMemoryId(nextRecords[0]?.memory_id || "");
    }
  }

  function refreshCoordination(nextPlans) {
    setCoordinationPlans(nextPlans);
    if (!nextPlans.find((plan) => plan.coordination_plan_id === selectedCoordinationPlanId)) {
      setSelectedCoordinationPlanId(nextPlans[0]?.coordination_plan_id || "");
    }
  }

  function refreshWorkflow(nextRuns) {
    const nextSteps = getAgentWorkflowSteps();
    setWorkflowRuns(nextRuns);
    setWorkflowSteps(nextSteps);
    if (!nextRuns.find((run) => run.workflow_run_id === selectedWorkflowRunId)) {
      setSelectedWorkflowRunId(nextRuns[0]?.workflow_run_id || "");
    }
  }

  function handleCreateTask() {
    const nextTasks = createAgentTask({
      title: "Manual Agent Workbench review",
      task_type: "governance_check_summary",
      assigned_agent_id: "shs_governance_agent",
      source_system: "manual",
      risk_level: "medium",
    });
    refresh(nextTasks);
    setSelectedTaskId(nextTasks[0]?.task_id || "");
  }

  function handleTaskAction(action, note) {
    if (!selectedTask) return;
    const nextTasks = applyAgentTaskAction(selectedTask.task_id, action, note);
    const updatedTask = nextTasks.find((task) => task.task_id === selectedTask.task_id) || selectedTask;

    if (action === "approve" || action === "reject") {
      const nextLedger = recordAgentApprovalDecision({
        task: updatedTask,
        agent: selectedAgent,
        approvalStatus: action === "approve" ? "approved" : "rejected",
        approvedBy: "shs_operator",
        operatorNote: note,
      });
      setApprovalLedger(nextLedger);
      const auditTasks = appendAgentTaskAuditEvent(
        selectedTask.task_id,
        "approval_ledger_recorded",
        action === "approve"
          ? "Approval ledger record created. Safe execution remains simulated-only."
          : "Approval rejection recorded in ledger. Safe execution remains blocked."
      );
      refresh(auditTasks);
      return;
    }

    refresh(nextTasks);
  }

  function handleRunSafeExecutionStub() {
    if (!selectedTask) return;
    const { result, runs } = recordSafeExecutionStubRun({
      task: selectedTask,
      agent: selectedAgent,
      approvalLedger,
      contextPackets: selectedTaskContextPackets,
      coordinationPlans: selectedTaskCoordinationPlans,
      workflowRuns: selectedTaskWorkflowRuns,
    });
    setStubRuns(runs);
    setApprovalLedger(getAgentApprovalLedger());
    refresh(appendAgentTaskAuditEvent(
      selectedTask.task_id,
      "safe_execution_stub_recorded",
      result.stub_status === "simulated"
        ? "Safe execution stub simulated readiness only. No production action executed."
        : "Safe execution stub blocked readiness. No production action executed."
    ));
  }

  function handleReset() {
    const nextTasks = resetAgentTasks();
    setApprovalLedger(resetAgentApprovalLedger());
    setStubRuns(resetSafeExecutionStubRuns());
    const nextMemoryRecords = resetAgentMemoryRecords();
    const nextContextPackets = resetAgentContextPackets();
    const nextCoordinationPlans = resetAgentCoordinationPlans();
    const nextHandoffs = resetAgentHandoffs();
    const nextWorkflowRuns = resetAgentWorkflowRuns();
    const nextWorkflowSteps = getAgentWorkflowSteps();
    setExecutionRequests(resetAgentExecutionRequests());
    setExecutionRecords(resetAgentExecutionRecords());
    setRecommendationPackets(resetAgentExecutionRecommendationPackets());
    setMemoryRecords(nextMemoryRecords);
    setContextPackets(nextContextPackets);
    setCoordinationPlans(nextCoordinationPlans);
    setHandoffs(nextHandoffs);
    setWorkflowRuns(nextWorkflowRuns);
    setWorkflowSteps(nextWorkflowSteps);
    setSelectedMemoryId(nextMemoryRecords[0]?.memory_id || "");
    setSelectedCoordinationPlanId(nextCoordinationPlans[0]?.coordination_plan_id || "");
    setSelectedWorkflowRunId(nextWorkflowRuns[0]?.workflow_run_id || "");
    refresh(nextTasks);
    setSelectedTaskId(nextTasks[0]?.task_id || "");
  }

  function handleCreateManualMemory(note) {
    const summary = note?.trim() || "Manual operator memory note for Agent Workbench V1.";
    const nextRecords = createAgentMemoryRecord({
      title: summary.slice(0, 80),
      summary,
      memory_type: "unknown",
      source_system: "manual",
      related_agent_id: selectedAgent?.id || "",
      related_task_id: selectedTask?.task_id || "",
      sensitivity: /secret|password|api[_ -]?key|ssn|public[_ -]?approved/i.test(summary) ? "high" : "medium",
      operator_note: "Operator-created memory; review safety flags before reuse.",
    });
    refreshMemory(nextRecords);
    setSelectedMemoryId(nextRecords[0]?.memory_id || "");
  }

  function handleArchiveSelectedMemory() {
    if (!selectedMemory) return;
    refreshMemory(archiveAgentMemoryRecord(selectedMemory.memory_id));
  }

  function handleMarkSelectedMemoryNeedsReview() {
    if (!selectedMemory) return;
    refreshMemory(markAgentMemoryNeedsReview(selectedMemory.memory_id));
  }

  function handleCreateContextPacket() {
    if (!selectedTask || !selectedMemory) return;
    const nextPackets = createAgentContextPacket({
      task: selectedTask,
      agent: selectedAgent,
      memoryIds: [selectedMemory.memory_id],
      purpose: "Support selected task with governed internal memory context.",
    });
    setContextPackets(nextPackets);
  }

  function handleAddMemoryToTaskContext() {
    if (!selectedTask || !selectedMemory) return;
    const safeForContext = isMemorySafeForTaskContext(selectedMemory);
    const nextTasks = updateAgentTask(selectedTask.task_id, (task) => {
      const existingMemoryIds = Array.isArray(task.context_memory_ids) ? task.context_memory_ids : [];
      const nextMemoryIds = existingMemoryIds.includes(selectedMemory.memory_id)
        ? existingMemoryIds
        : [...existingMemoryIds, selectedMemory.memory_id];
      return {
        ...task,
        context_memory_ids: nextMemoryIds,
        memory_risk_status: safeForContext ? "clear" : "needs_review",
        warnings: safeForContext
          ? task.warnings
          : [...new Set([...(task.warnings || []), "Selected memory requires operator review before safe stub use."])],
        audit_events: [
          ...(task.audit_events || []),
          {
            event_id: `agevt_${task.task_id}_memory_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            event_type: safeForContext ? "memory_context_added" : "memory_context_needs_review",
            actor: "shs_operator",
            message: safeForContext
              ? "Memory added to task context. Internal V1 use only."
              : "Memory linked but flagged for operator review before reuse.",
            created_at: new Date().toISOString(),
          },
        ],
      };
    });
    refresh(nextTasks);
  }

  function handleCreateCoordinationPlan(workflowType) {
    const nextPlans = createCoordinationPlanFromTemplate(workflowType, {
      tasks,
      memoryRecords,
      contextPackets,
    });
    refreshCoordination(nextPlans);
    setSelectedCoordinationPlanId(nextPlans[0]?.coordination_plan_id || "");
  }

  function handleCoordinationPlanAction(action, note) {
    if (!selectedCoordinationPlan) return;
    refreshCoordination(applyCoordinationPlanAction(selectedCoordinationPlan.coordination_plan_id, action, note));
  }

  function handleCreateHandoff() {
    if (!selectedCoordinationPlan) return;
    const sequence = selectedCoordinationPlan.participating_agent_ids || [];
    const fromAgentId = selectedCoordinationPlan.owner_agent_id || sequence[0] || "";
    const toAgentId = selectedCoordinationPlan.next_best_agent_id || sequence.find((agentId) => agentId !== fromAgentId) || "";
    const nextHandoffs = createAgentHandoff({
      plan: selectedCoordinationPlan,
      fromAgentId,
      toAgentId,
      handoffType: "context",
      note: "Operator-created coordination handoff. Human review required.",
    });
    setHandoffs(nextHandoffs);
  }

  function handleHandoffStatus(handoffId, status) {
    setHandoffs(updateAgentHandoffStatus(handoffId, status));
  }

  function handleCreateWorkflowFromTemplate(workflowType) {
    const nextRuns = createWorkflowRunFromTemplate(workflowType, {
      tasks,
      memoryRecords,
      contextPackets,
      approvalLedger,
      handoffs,
    });
    refreshWorkflow(nextRuns);
    setSelectedWorkflowRunId(nextRuns[0]?.workflow_run_id || "");
  }

  function handleCreateWorkflowFromCoordinationPlan(planId) {
    const plan = coordinationPlans.find((item) => item.coordination_plan_id === planId);
    const nextRuns = createWorkflowRunFromCoordinationPlan(plan, {
      tasks,
      memoryRecords,
      contextPackets,
      approvalLedger,
      handoffs,
    });
    refreshWorkflow(nextRuns);
    setSelectedWorkflowRunId(nextRuns[0]?.workflow_run_id || "");
  }

  function handleWorkflowRunAction(action, note) {
    if (!selectedWorkflowRun) return;
    refreshWorkflow(applyWorkflowRunAction(selectedWorkflowRun.workflow_run_id, action, note));
  }

  function handleWorkflowStepAction(stepId, action, note) {
    refreshWorkflow(applyWorkflowStepAction(stepId, action, note));
  }

  function handleRunControlledExecution(actionType, requestedPayload = {}) {
    const result = runControlledExecutionRequest({
      task: selectedTask,
      agent: selectedAgent,
      approval: selectedApprovalRecord,
      actionType,
      requestedPayload,
      workflowRun: selectedWorkflowRun,
      workflowStep: selectedWorkflowStep,
      coordinationPlan: selectedCoordinationPlan,
      handoff: selectedExecutionHandoff,
      contextPacket: selectedExecutionContextPacket,
      operatorNote: requestedPayload.operator_note || "",
    }, executionContext);
    setTasks(result.tasks);
    setWorkflowRuns(result.workflowRuns);
    setWorkflowSteps(result.workflowSteps);
    setCoordinationPlans(result.coordinationPlans);
    setHandoffs(result.handoffs);
    setContextPackets(result.contextPackets);
    setExecutionRequests(result.executionRequests);
    setExecutionRecords(result.executionRecords);
    setRecommendationPackets(result.recommendationPackets);
  }

  return (
    <main className="agent-workbench-page">
      <section className="agent-workbench-hero">
        <div>
          <p>SHS Agent Command Center</p>
          <h1>Agent Workbench</h1>
          <span>Agent Workbench V1 is operator-controlled. Agents do not execute production actions in V1. Human approval changes task status only.</span>
        </div>
        <div className="agent-workbench-boundaries" aria-label="V1 safety boundaries">
          {SAFETY_BOUNDARIES.map((boundary) => <span key={boundary}>{boundary}</span>)}
        </div>
      </section>

      <AgentPerformanceSnapshot metrics={metrics} />

      <AgentCoordinationPanel
        plans={coordinationPlans}
        metrics={coordinationMetrics}
        agentsById={agentsById}
        selectedPlanId={selectedCoordinationPlan?.coordination_plan_id}
        onSelectPlan={setSelectedCoordinationPlanId}
      />

      <AgentWorkflowTemplatePanel
        templates={coordinationTemplates}
        agentsById={agentsById}
        onCreatePlan={handleCreateCoordinationPlan}
      />

      <AgentWorkflowEnginePanel
        runs={workflowRuns}
        templates={workflowTemplates}
        metrics={workflowMetrics}
        agentsById={agentsById}
        selectedRunId={selectedWorkflowRun?.workflow_run_id}
        coordinationPlans={coordinationPlans}
        onSelectRun={setSelectedWorkflowRunId}
        onCreateFromTemplate={handleCreateWorkflowFromTemplate}
        onCreateFromCoordinationPlan={handleCreateWorkflowFromCoordinationPlan}
      />

      <AgentMemoryPanel
        records={memoryRecords}
        selectedMemoryId={selectedMemory?.memory_id}
        onSelectMemory={setSelectedMemoryId}
        onCreateManualMemory={handleCreateManualMemory}
        metrics={memoryMetrics}
      />

      <AgentApprovalLedger records={approvalLedger} agentsById={agentsById} />

      <AgentContractBridgePanel summary={AGENT_CONTRACT_BRIDGE_SUMMARY_V1} />

      <AgentControlledExecutorPanel
        selectedActionType={selectedExecutionActionType}
        onSelectedActionTypeChange={setSelectedExecutionActionType}
        previewRequest={previewExecutionRequest}
        context={executionContext}
        task={selectedTask}
        agent={selectedAgent}
        approvalRecord={selectedApprovalRecord}
        workflowRun={selectedWorkflowRun}
        workflowStep={selectedWorkflowStep}
        coordinationPlan={selectedCoordinationPlan}
        handoff={selectedExecutionHandoff}
        contextPacket={selectedExecutionContextPacket}
        records={executionRecords}
        onRunControlledAction={handleRunControlledExecution}
      />

      <AgentExecutionRecordTable records={executionRecords} />

      <AgentOverviewPanel
        agents={SHS_AGENT_WORKFORCE_V1}
        selectedAgentId={selectedAgent?.id || selectedAgentId}
        onSelectAgent={setSelectedAgentId}
      />

      <section className="agent-workbench-layout">
        <div className="agent-workbench-main">
          <AgentTaskQueue
            tasks={tasks}
            agentsById={agentsById}
            selectedTaskId={selectedTask?.task_id}
            onSelectTask={setSelectedTaskId}
            onCreateTask={handleCreateTask}
          />
          <AgentTaskDetail
            task={selectedTask}
            agent={selectedAgent}
            approvalRecord={selectedApprovalRecord}
            stubRun={latestStubRun}
            memoryCount={selectedTaskMemoryRecords.length}
            contextPacketCount={selectedTaskContextPackets.length}
            memoryRiskStatus={selectedTaskMemoryRiskStatus}
            onCreateContextPacket={handleCreateContextPacket}
          />
          <AgentMemoryDetail
            memory={selectedMemory}
            safety={selectedMemorySafety}
            onArchive={handleArchiveSelectedMemory}
            onNeedsReview={handleMarkSelectedMemoryNeedsReview}
          />
          <AgentCoordinationPlanDetail
            plan={selectedCoordinationPlan}
            agentsById={agentsById}
            relatedTasks={selectedCoordinationPlanTasks}
            taskCount={selectedCoordinationPlan?.related_task_ids?.length || 0}
            contextPacketCount={selectedCoordinationPlan?.related_context_packet_ids?.length || 0}
            onAction={handleCoordinationPlanAction}
            onCreateHandoff={handleCreateHandoff}
          />
          <AgentWorkflowRunDetail
            run={selectedWorkflowRun}
            steps={selectedWorkflowSteps}
            coordinationPlan={selectedWorkflowCoordinationPlan}
            agentsById={agentsById}
            onAction={handleWorkflowRunAction}
          />
          <AgentWorkflowStepList
            steps={selectedWorkflowSteps}
            agentsById={agentsById}
            onStepAction={handleWorkflowStepAction}
          />
        </div>
        <aside className="agent-workbench-side">
          <AgentWorkflowProgress run={selectedWorkflowRun} steps={selectedWorkflowSteps} />
          <AgentWorkflowSafetyPanel
            run={selectedWorkflowRun}
            safety={selectedWorkflowSafety}
            metrics={workflowMetrics}
          />
          <AgentExecutionSafetyPanel
            previewRequest={previewExecutionRequest}
            context={executionContext}
            metrics={executionMetrics}
          />
          <AgentCoordinationSafetyPanel
            plan={selectedCoordinationPlan}
            safety={selectedCoordinationPlanSafety}
            metrics={coordinationMetrics}
          />
          <AgentHandoffTrail
            handoffs={selectedCoordinationPlanHandoffs}
            agentsById={agentsById}
            onHandoffStatus={handleHandoffStatus}
          />
          <AgentContextPacketPanel
            packets={selectedTaskContextPackets}
            selectedTask={selectedTask}
            selectedAgent={selectedAgent}
            selectedMemory={selectedMemory}
            onCreateContextPacket={handleCreateContextPacket}
            onAddMemoryToTaskContext={handleAddMemoryToTaskContext}
          />
          <AgentMemorySafetyPanel
            memory={selectedMemory}
            safety={selectedMemorySafety}
            metrics={memoryMetrics}
          />
          <AgentApprovalPanel task={selectedTask} onAction={handleTaskAction} />
          <AgentSafeExecutionPanel
            task={selectedTask}
            agent={selectedAgent}
            approvalLedger={approvalLedger}
            latestStubRun={latestStubRun}
            contextPackets={selectedTaskContextPackets}
            coordinationPlans={selectedTaskCoordinationPlans}
            workflowRuns={selectedTaskWorkflowRuns}
            onRunStub={handleRunSafeExecutionStub}
          />
          <AgentActivityTimeline task={selectedTask} />
          <section className="agent-workbench-panel agent-workbench-copy">
            <div className="agent-workbench-panel__head">
              <div>
                <span>Local V1 State</span>
                <strong>Non-destructive</strong>
              </div>
              <button type="button" onClick={handleReset}>Reset Queue</button>
            </div>
            <p>Tasks persist in browser localStorage only. No external calls, database migrations, production record mutation, public publishing, or autonomous execution are enabled.</p>
          </section>
        </aside>
      </section>
    </main>
  );
}
