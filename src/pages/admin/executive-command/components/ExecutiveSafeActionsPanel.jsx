import React from "react";

export default function ExecutiveSafeActionsPanel({ actions, onCommandPreview, onOrchestrationPreview, onBlastRadius }) {
  return (
    <section className="ecc-panel ecc-span-6">
      <div className="ecc-panel-heading"><p>Safe Next Actions</p><h2>Preview-only actions and navigation</h2></div>
      <div className="ecc-list">
        {actions.map((action) => (
          <article key={action.action_id}>
            <div><strong>{action.label}</strong><span>{action.action_type} - execution {String(action.execution_enabled)}</span></div>
            {action.action_type === "command_preview" && <button type="button" onClick={() => onCommandPreview(action.preview)}>Command Preview</button>}
            {action.action_type === "orchestration_preview" && <button type="button" onClick={() => onOrchestrationPreview(action.preview)}>Orchestration Preview</button>}
            {action.action_type === "safe_navigation" && <a href={action.route}>Navigate</a>}
          </article>
        ))}
      </div>
      <button type="button" onClick={onBlastRadius}>Show Blast-Radius Preview</button>
    </section>
  );
}
