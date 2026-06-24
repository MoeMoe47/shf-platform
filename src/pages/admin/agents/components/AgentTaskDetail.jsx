import React from "react";

function ListBlock({ title, items }) {
  return (
    <div className="agent-workbench-detail-list">
      <h3>{title}</h3>
      {items?.length ? (
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      ) : (
        <p>None</p>
      )}
    </div>
  );
}

export default function AgentTaskDetail({ task, agent }) {
  if (!task) {
    return (
      <section className="agent-workbench-panel agent-workbench-empty" aria-label="Task Detail">
        <h2>Task Detail</h2>
        <p>Select a task to inspect intended action, recommendation, governance checks, and audit state.</p>
      </section>
    );
  }

  const governanceChecks = [
    "Production execution disabled",
    "Public data mutation blocked",
    "Report publishing blocked",
    "External delivery blocked",
    "Human approval changes queue status only",
  ];

  const nextActions = ["approve task", "reject task", "mark complete", "return to review", "add operator note"];

  return (
    <section className="agent-workbench-panel agent-workbench-detail" aria-label="Task Detail">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Task Detail</span>
          <strong>{task.title}</strong>
        </div>
      </div>
      <div className="agent-workbench-detail__body">
        <div className="agent-workbench-kv-grid">
          <div><span>Task ID</span><strong>{task.task_id}</strong></div>
          <div><span>Type</span><strong>{task.task_type}</strong></div>
          <div><span>Agent</span><strong>{agent?.name || task.assigned_agent_id}</strong></div>
          <div><span>Required Approval</span><strong>{task.approval_status === "not_required" ? "No" : "Yes"}</strong></div>
        </div>
        <div className="agent-workbench-copy">
          <h3>Intended Action</h3>
          <p>{task.intended_action}</p>
        </div>
        <div className="agent-workbench-copy">
          <h3>Agent Recommendation</h3>
          <p>{task.agent_recommendation}</p>
        </div>
        <div className="agent-workbench-copy">
          <h3>Operator Note</h3>
          <p>{task.operator_note || "No operator note yet."}</p>
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Governance Checks" items={governanceChecks} />
          <ListBlock title="Allowed Next Actions" items={nextActions} />
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Blockers" items={task.blockers} />
          <ListBlock title="Warnings" items={task.warnings} />
        </div>
      </div>
    </section>
  );
}
