import React from "react";

export default function AgentWorkflowStepList({ steps, agentsById, onStepAction }) {
  const [noteByStep, setNoteByStep] = React.useState({});
  return (
    <section className="agent-workbench-panel agent-workflow-step-list" aria-label="Workflow Step List">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Workflow Steps</span>
          <strong>{steps.length} ordered steps</strong>
        </div>
      </div>
      <ol className="agent-workbench-timeline">
        {steps.map((step) => (
          <li key={step.workflow_step_id} className={`is-${step.status}`}>
            <span>{step.sequence_index}. {step.step_type} · {step.status}</span>
            <strong>{step.title}</strong>
            <small>{agentsById[step.owning_agent_id]?.name || step.owning_agent_id}</small>
            <small>{step.description}</small>
            <div className="agent-workflow-step-meta">
              <span>Task: {step.related_task_id || "None"}</span>
              <span>Memory: {step.related_memory_ids.length}</span>
              <span>Context: {step.related_context_packet_ids.length}</span>
              <span>Approval: {step.related_approval_id || "None"}</span>
              <span>Handoff: {step.related_handoff_id || "None"}</span>
              <span>Stub: {String(step.safe_execution_stub_allowed)}</span>
            </div>
            {step.blockers?.length ? <small>Blockers: {step.blockers.join(", ")}</small> : null}
            {step.warnings?.length ? <small>Warnings: {step.warnings.join(", ")}</small> : null}
            <div className="agent-workflow-actions">
              <textarea
                value={noteByStep[step.workflow_step_id] || ""}
                onChange={(event) => setNoteByStep({ ...noteByStep, [step.workflow_step_id]: event.target.value })}
                rows={2}
                placeholder="Step operator note"
              />
              <div>
                <button type="button" onClick={() => onStepAction(step.workflow_step_id, "review", noteByStep[step.workflow_step_id] || "")}>Mark Step In Review</button>
                <button type="button" onClick={() => onStepAction(step.workflow_step_id, "complete", noteByStep[step.workflow_step_id] || "")}>Mark Step Completed</button>
                <button type="button" onClick={() => onStepAction(step.workflow_step_id, "skip", noteByStep[step.workflow_step_id] || "Operator skipped this V1 review step.")}>Skip Step</button>
                <button type="button" onClick={() => onStepAction(step.workflow_step_id, "note", noteByStep[step.workflow_step_id] || "")}>Add Note</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
