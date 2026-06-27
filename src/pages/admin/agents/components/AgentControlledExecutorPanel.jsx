import React from "react";
import {
  AGENT_EXECUTION_ALLOWED_ACTION_TYPES,
  AGENT_EXECUTION_BLOCKED_ACTION_TYPES,
  evaluateControlledExecutionRequest,
} from "@/data/agents/agentControlledExecutor";

function parsePayload(value) {
  if (!value.trim()) return {};
  try {
    return JSON.parse(value);
  } catch {
    return { payload_parse_error: true, raw_operator_payload: value };
  }
}

export default function AgentControlledExecutorPanel({
  selectedActionType,
  onSelectedActionTypeChange,
  previewRequest,
  context,
  task,
  agent,
  approvalRecord,
  workflowRun,
  workflowStep,
  coordinationPlan,
  handoff,
  contextPacket,
  records = [],
  onRunControlledAction,
}) {
  const [payloadText, setPayloadText] = React.useState("{\n  \"operator_note\": \"Controlled Executor V1 local review action.\"\n}");
  const parsedPayload = React.useMemo(() => parsePayload(payloadText), [payloadText]);
  const evaluation = previewRequest
    ? evaluateControlledExecutionRequest({ ...previewRequest, requested_payload: parsedPayload, risk_level: parsedPayload.risk_level || previewRequest.risk_level }, context)
    : { blockers: [], warnings: [], eligible: false };

  return (
    <section className="agent-workbench-panel agent-controlled-executor" aria-label="Controlled Executor Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Controlled Executor V1</span>
          <strong>{evaluation.eligible ? "Approved local action" : "Blocked until safe"}</strong>
        </div>
        <button
          type="button"
          onClick={() => onRunControlledAction(selectedActionType, parsedPayload)}
        >
          Run Controlled Local Action
        </button>
      </div>
      <div className="agent-controlled-executor__body">
        <p className="agent-workbench-safety-note">
          Controlled Executor V1 only performs approved local/internal actions. It does not execute production actions, publish reports, mutate SHF Impact Data Spine, mark public_approved, send external messages, write warehouse records, or modify auth.
        </p>
        <div className="agent-workbench-kv-grid">
          <div><span>Task</span><strong>{task?.task_id || "None"}</strong></div>
          <div><span>Agent</span><strong>{agent?.id || "Unknown"}</strong></div>
          <div><span>Approval</span><strong>{approvalRecord?.approval_status || "missing"}</strong></div>
          <div><span>Context Packet</span><strong>{contextPacket?.context_packet_id || "None"}</strong></div>
          <div><span>Workflow Run</span><strong>{workflowRun?.workflow_run_id || "None"}</strong></div>
          <div><span>Workflow Step</span><strong>{workflowStep?.workflow_step_id || "None"}</strong></div>
          <div><span>Coordination</span><strong>{coordinationPlan?.coordination_plan_id || "None"}</strong></div>
          <div><span>Handoff</span><strong>{handoff?.handoff_id || "None"}</strong></div>
        </div>
        <div className="agent-controlled-executor__form">
          <label>
            Action Type
            <select value={selectedActionType} onChange={(event) => onSelectedActionTypeChange(event.target.value)}>
              <optgroup label="Allowlisted local actions">
                {AGENT_EXECUTION_ALLOWED_ACTION_TYPES.map((action) => <option key={action} value={action}>{action}</option>)}
              </optgroup>
              <optgroup label="Blocked actions">
                {AGENT_EXECUTION_BLOCKED_ACTION_TYPES.map((action) => <option key={action} value={action}>{action}</option>)}
              </optgroup>
            </select>
          </label>
          <label>
            Requested Payload
            <textarea rows="7" value={payloadText} onChange={(event) => setPayloadText(event.target.value)} />
          </label>
        </div>
        <div className="agent-workbench-split">
          <div className="agent-workbench-detail-list">
            <h3>Eligibility Blockers</h3>
            {evaluation.blockers.length ? (
              <ul>{evaluation.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>
            ) : (
              <p>None</p>
            )}
          </div>
          <div className="agent-workbench-detail-list">
            <h3>Latest Execution Record</h3>
            {records[0] ? (
              <p>{records[0].status}: {records[0].result_summary}</p>
            ) : (
              <p>No controlled execution records yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
