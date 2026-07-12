import React from "react";

const AGENT_IDS = ["agent_workbench", "agent_workflow_engine", "controlled_executor"];

export default function ExecutiveAgentPanel({ layers }) {
  return (
    <section className="ecc-panel ecc-span-4">
      <div className="ecc-panel-heading"><p>Agent Operations</p><h2>Tasks, workflows, approvals, executor safety</h2></div>
      <div className="ecc-list compact">
        {layers.filter((layer) => AGENT_IDS.includes(layer.layer_id)).map((layer) => (
          <article key={layer.layer_id}><strong>{layer.layer_name}</strong><span>{layer.status} - open {layer.open_items}</span></article>
        ))}
      </div>
    </section>
  );
}
