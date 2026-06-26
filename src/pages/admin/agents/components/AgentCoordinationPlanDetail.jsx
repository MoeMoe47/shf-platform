import React from "react";

function ListBlock({ title, items, agentsById }) {
  return (
    <div className="agent-workbench-detail-list">
      <h3>{title}</h3>
      {items?.length ? (
        <ul>
          {items.map((item) => <li key={item}>{agentsById?.[item]?.name || item}</li>)}
        </ul>
      ) : (
        <p>None</p>
      )}
    </div>
  );
}

export default function AgentCoordinationPlanDetail({
  plan,
  agentsById,
  relatedTasks = [],
  taskCount,
  contextPacketCount,
  onAction,
  onCreateHandoff,
}) {
  const [note, setNote] = React.useState("");

  if (!plan) {
    return (
      <section className="agent-workbench-panel agent-workbench-empty" aria-label="Coordination Plan Detail">
        <h2>Coordination Plan Detail</h2>
        <p>Select a plan to inspect workflow ownership, dependencies, context, blockers, and review state.</p>
      </section>
    );
  }

  function submitAction(action) {
    onAction(action, note);
    setNote("");
  }

  return (
    <section className="agent-workbench-panel agent-coordination-detail" aria-label="Coordination Plan Detail">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Coordination Plan Detail</span>
          <strong>{plan.title}</strong>
        </div>
        <button type="button" onClick={onCreateHandoff}>Create Handoff</button>
      </div>
      <div className="agent-workbench-detail__body">
        <div className="agent-workbench-kv-grid">
          <div><span>Status</span><strong>{plan.status}</strong></div>
          <div><span>Workflow</span><strong>{plan.workflow_type}</strong></div>
          <div><span>Owner</span><strong>{agentsById[plan.owner_agent_id]?.name || plan.owner_agent_id}</strong></div>
          <div><span>Next Best Agent</span><strong>{agentsById[plan.next_best_agent_id]?.name || plan.next_best_agent_id}</strong></div>
          <div><span>Tasks</span><strong>{taskCount}</strong></div>
          <div><span>Context Packets</span><strong>{contextPacketCount}</strong></div>
          <div><span>Approval Required</span><strong>{String(plan.approval_required)}</strong></div>
          <div><span>Execution Enabled</span><strong>{String(plan.execution_enabled_v1)}</strong></div>
        </div>
        <div className="agent-workbench-copy">
          <h3>Coordination Summary</h3>
          <p>{plan.coordination_summary}</p>
        </div>
        <div className="agent-workbench-copy">
          <h3>Next Best Action</h3>
          <p>{plan.next_best_action}</p>
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Participating Agents" items={plan.participating_agent_ids} agentsById={agentsById} />
          <ListBlock title="Blockers" items={plan.blockers} />
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Related Tasks" items={plan.related_task_ids} />
          <ListBlock
            title="Task Statuses"
            items={relatedTasks.map((task) => `${task.task_id}: ${task.status}`)}
          />
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Related Context" items={plan.related_context_packet_ids} />
          <ListBlock title="Warnings" items={plan.warnings} />
        </div>
        <div className="agent-coordination-actions">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Operator note for coordination audit trail"
          />
          <div>
            <button type="button" onClick={() => submitAction("review")}>Mark In Review</button>
            <button type="button" onClick={() => submitAction("approve")}>Approve Plan Status</button>
            <button type="button" onClick={() => submitAction("block")}>Block Plan</button>
            <button type="button" onClick={() => submitAction("complete")}>Complete Plan</button>
            <button type="button" onClick={() => submitAction("note")}>Add Operator Note</button>
          </div>
        </div>
      </div>
    </section>
  );
}
