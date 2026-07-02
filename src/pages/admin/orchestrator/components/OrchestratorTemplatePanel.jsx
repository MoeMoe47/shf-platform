import React from "react";

export default function OrchestratorTemplatePanel({ templates, selectedTemplateId, onSelectTemplate, onCreateRequest }) {
  return (
    <section className="orch-card">
      <div className="orch-section-head">
        <div>
          <span>Templates</span>
          <h2>Orchestration Starts</h2>
        </div>
        <strong>{templates.length}</strong>
      </div>
      <div className="orch-template-list">
        {templates.map((template) => (
          <button
            type="button"
            key={template.orchestration_template_id}
            className={template.orchestration_template_id === selectedTemplateId ? "is-active" : ""}
            onClick={() => onSelectTemplate(template.orchestration_template_id)}
          >
            <span>{template.request_type}</span>
            <strong>{template.title}</strong>
            <small>{template.summary}</small>
          </button>
        ))}
      </div>
      <button className="orch-primary-action" type="button" onClick={() => onCreateRequest(selectedTemplateId)}>
        Create Request From Template
      </button>
    </section>
  );
}
