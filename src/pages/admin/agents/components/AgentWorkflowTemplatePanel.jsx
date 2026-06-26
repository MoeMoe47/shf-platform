import React from "react";

export default function AgentWorkflowTemplatePanel({ templates, agentsById, onCreatePlan }) {
  return (
    <section className="agent-workbench-panel agent-template-panel" aria-label="Workflow Templates">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Workflow Templates</span>
          <strong>{templates.length} safe templates</strong>
        </div>
      </div>
      <div className="agent-template-grid">
        {templates.map((template) => (
          <article key={template.workflow_type}>
            <span>{template.workflow_type}</span>
            <strong>{template.display_name}</strong>
            <p>Owner: {agentsById[template.default_owner_agent_id]?.name || template.default_owner_agent_id}</p>
            <small>{template.recommended_sequence.map((agentId) => agentsById[agentId]?.name || agentId).join(" -> ")}</small>
            <button type="button" onClick={() => onCreatePlan(template.workflow_type)}>Create Plan From Template</button>
          </article>
        ))}
      </div>
    </section>
  );
}
