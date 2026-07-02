import React from "react";

export default function OrchestratorLayerMap({ plan }) {
  const layers = plan?.participating_layers || [];
  const agents = plan?.participating_agents || [];
  return (
    <section className="orch-card">
      <div className="orch-section-head">
        <div>
          <span>Control Plane</span>
          <h2>Layers And Agents</h2>
        </div>
      </div>
      <div className="orch-layer-map">
        <div>
          <h3>Participating Layers</h3>
          {layers.map((layer) => <p key={layer}>{layer}</p>)}
        </div>
        <div>
          <h3>Participating Agents</h3>
          {agents.map((agent) => <p key={agent}>{agent}</p>)}
        </div>
      </div>
    </section>
  );
}
