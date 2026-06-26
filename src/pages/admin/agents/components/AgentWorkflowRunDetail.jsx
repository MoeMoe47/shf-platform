import React from "react";

function ListBlock({ title, items }) {
  return (
    <div className="agent-workbench-detail-list">
      <h3>{title}</h3>
      {items?.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>None</p>}
    </div>
  );
}

export default function AgentWorkflowRunDetail({ run, steps, coordinationPlan, agentsById, onAction }) {
  const [note, setNote] = React.useState("");
  if (!run) {
    return (
      <section className="agent-workbench-panel agent-workbench-empty" aria-label="Workflow Run Detail">
        <h2>Workflow Run Detail</h2>
        <p>Select a workflow run to inspect current step, dependencies, blockers, and safety state.</p>
      </section>
    );
  }

  const nextStep = steps.find((step) => step.workflow_step_id === run.next_recommended_step_id);
  const currentStep = steps.find((step) => step.workflow_step_id === run.current_step_id);

  function submit(action) {
    onAction(action, note);
    setNote("");
  }

  return (
    <section className="agent-workbench-panel agent-workflow-run-detail" aria-label="Workflow Run Detail">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Workflow Run Detail</span>
          <strong>{run.title}</strong>
        </div>
      </div>
      <div className="agent-workbench-detail__body">
        <div className="agent-workbench-kv-grid">
          <div><span>Status</span><strong>{run.status}</strong></div>
          <div><span>Workflow</span><strong>{run.workflow_type}</strong></div>
          <div><span>Owner</span><strong>{agentsById[run.owner_agent_id]?.name || run.owner_agent_id}</strong></div>
          <div><span>Progress</span><strong>{run.progress_percent}%</strong></div>
          <div><span>Current Step</span><strong>{currentStep?.title || "None"}</strong></div>
          <div><span>Next Step</span><strong>{nextStep?.title || "None"}</strong></div>
          <div><span>Coordination Plan</span><strong>{coordinationPlan?.title || run.source_coordination_plan_id || "None"}</strong></div>
          <div><span>Execution Enabled</span><strong>{String(run.execution_enabled_v1)}</strong></div>
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Participating Agents" items={run.participating_agent_ids.map((id) => agentsById[id]?.name || id)} />
          <ListBlock title="Blockers" items={run.blockers} />
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Warnings" items={run.warnings} />
          <ListBlock title="Related Records" items={[
            `${run.related_task_ids.length} tasks`,
            `${run.related_memory_ids.length} memories`,
            `${run.related_context_packet_ids.length} context packets`,
            `${run.related_approval_ids.length} approvals`,
            `${run.related_handoff_ids.length} handoffs`,
          ]} />
        </div>
        <div className="agent-workflow-actions">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Operator note for workflow audit trail"
          />
          <div>
            <button type="button" onClick={() => submit("activate")}>Activate Workflow</button>
            <button type="button" onClick={() => submit("pause")}>Pause Workflow</button>
            <button type="button" onClick={() => submit("resume")}>Resume Workflow</button>
            <button type="button" onClick={() => submit("block")}>Block Workflow</button>
            <button type="button" onClick={() => submit("complete")}>Complete Workflow</button>
            <button type="button" onClick={() => submit("note")}>Add Operator Note</button>
          </div>
        </div>
      </div>
    </section>
  );
}
