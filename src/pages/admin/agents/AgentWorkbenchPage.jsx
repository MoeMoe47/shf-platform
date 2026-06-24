import React from "react";
import { SHS_AGENT_WORKFORCE_V1 } from "@/data/agents/shsAgentWorkforce";
import { getAgentApprovalLedger, recordAgentApprovalDecision, resetAgentApprovalLedger } from "@/data/agents/agentApprovalLedger";
import { getLatestSafeExecutionStubRunForTask, getSafeExecutionStubRuns, recordSafeExecutionStubRun, resetSafeExecutionStubRuns } from "@/data/agents/agentSafeExecutionStub";
import { appendAgentTaskAuditEvent, applyAgentTaskAction, createAgentTask, getAgentTasks, resetAgentTasks } from "@/data/agents/agentTaskStorage";
import { calculateAgentTaskMetrics } from "@/data/agents/agentTaskMetrics";
import AgentOverviewPanel from "./components/AgentOverviewPanel";
import AgentTaskQueue from "./components/AgentTaskQueue";
import AgentTaskDetail from "./components/AgentTaskDetail";
import AgentApprovalPanel from "./components/AgentApprovalPanel";
import AgentApprovalLedger from "./components/AgentApprovalLedger";
import AgentSafeExecutionPanel from "./components/AgentSafeExecutionPanel";
import AgentActivityTimeline from "./components/AgentActivityTimeline";
import AgentPerformanceSnapshot from "./components/AgentPerformanceSnapshot";
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
  const [selectedTaskId, setSelectedTaskId] = React.useState(() => getAgentTasks()[0]?.task_id || "");
  const [selectedAgentId, setSelectedAgentId] = React.useState(SHS_AGENT_WORKFORCE_V1[0]?.id || "");

  const agentsById = React.useMemo(
    () => Object.fromEntries(SHS_AGENT_WORKFORCE_V1.map((agent) => [agent.id, agent])),
    []
  );
  const selectedTask = tasks.find((task) => task.task_id === selectedTaskId) || tasks[0] || null;
  const selectedAgent = agentsById[selectedTask?.assigned_agent_id] || agentsById[selectedAgentId] || null;
  const selectedApprovalRecord = selectedTask
    ? [...approvalLedger].find((record) => record.task_id === selectedTask.task_id) || null
    : null;
  const latestStubRun = selectedTask ? getLatestSafeExecutionStubRunForTask(selectedTask.task_id, stubRuns) : null;
  const metrics = React.useMemo(() => calculateAgentTaskMetrics(tasks, SHS_AGENT_WORKFORCE_V1), [tasks]);

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
    refresh(nextTasks);
    setSelectedTaskId(nextTasks[0]?.task_id || "");
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

      <AgentApprovalLedger records={approvalLedger} agentsById={agentsById} />

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
          />
        </div>
        <aside className="agent-workbench-side">
          <AgentApprovalPanel task={selectedTask} onAction={handleTaskAction} />
          <AgentSafeExecutionPanel
            task={selectedTask}
            agent={selectedAgent}
            approvalLedger={approvalLedger}
            latestStubRun={latestStubRun}
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
