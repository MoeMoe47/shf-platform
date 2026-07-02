import React from "react";

export default function OrchestratorNextActions({ plan, note, onNoteChange, onAddNote }) {
  const actions = plan?.safe_next_actions || [];
  const blocked = plan?.dangerous_actions_blocked || [];
  return (
    <section className="orch-card">
      <div className="orch-section-head">
        <div>
          <span>Next</span>
          <h2>Safe Operator Actions</h2>
        </div>
      </div>
      <div className="orch-action-columns">
        <div>
          <h3>Safe Next Actions</h3>
          {actions.map((action) => <p key={action}>{action}</p>)}
        </div>
        <div>
          <h3>Dangerous Actions Blocked</h3>
          {blocked.map((action) => <p key={action}>{action}</p>)}
        </div>
      </div>
      <label className="orch-note">
        <span>Operator Note</span>
        <textarea value={note} onChange={(event) => onNoteChange(event.target.value)} rows={3} />
      </label>
      <button type="button" className="orch-primary-action" onClick={onAddNote}>Add Operator Note</button>
    </section>
  );
}
