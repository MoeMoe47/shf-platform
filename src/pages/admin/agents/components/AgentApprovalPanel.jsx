import React from "react";

export default function AgentApprovalPanel({ task, onAction }) {
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    setNote(task?.operator_note || "");
  }, [task?.task_id, task?.operator_note]);

  if (!task) {
    return null;
  }

  const submit = (action) => {
    onAction(action, note.trim());
  };

  return (
    <section className="agent-workbench-panel agent-workbench-approval" aria-label="Approval Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Approval Panel</span>
          <strong>Status only</strong>
        </div>
      </div>
      <div className="agent-workbench-approval__body">
        <p>Agent Workbench V1 is operator-controlled. Agents do not execute production actions in V1. Human approval changes task status only.</p>
        <label>
          Operator Note
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} />
        </label>
        <div className="agent-workbench-actions">
          <button type="button" onClick={() => submit("approve")}>Approve</button>
          <button type="button" onClick={() => submit("reject")}>Reject</button>
          <button type="button" onClick={() => submit("complete")}>Mark Complete</button>
          <button type="button" onClick={() => submit("review")}>Return To Review</button>
          <button type="button" onClick={() => submit("note")}>Add Note</button>
        </div>
      </div>
    </section>
  );
}
