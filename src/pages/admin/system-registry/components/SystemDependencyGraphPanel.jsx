import React from "react";

export default function SystemDependencyGraphPanel({ layer, dependencies, dependents }) {
  return (
    <section className="system-registry-panel">
      <div className="panel-heading"><p>Dependency Graph</p><h2>{layer?.name || "Layer"}</h2></div>
      <div className="graph-columns">
        <div>
          <strong>Dependencies</strong>
          {dependencies.length ? dependencies.map((item) => <span key={item.layer_id}>{item.name}</span>) : <span className="muted">None</span>}
        </div>
        <div>
          <strong>Dependents</strong>
          {dependents.length ? dependents.map((item) => <span key={item.layer_id}>{item.name}</span>) : <span className="muted">None</span>}
        </div>
      </div>
    </section>
  );
}

