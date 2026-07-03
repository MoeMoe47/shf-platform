import React from "react";

export default function SystemLifecyclePanel({ layers }) {
  const released = layers.filter((layer) => layer.lifecycle_status === "released").length;
  const active = layers.filter((layer) => layer.release_status === "v1_1_active").length;
  return (
    <section className="system-registry-panel lifecycle">
      <div className="panel-heading"><p>Lifecycle</p><h2>Status Map</h2></div>
      <div className="metric-grid">
        <article><span>Released</span><strong>{released}</strong></article>
        <article><span>V1.1 active</span><strong>{active}</strong></article>
      </div>
      <div className="matrix-list compact">
        {layers.slice(0, 12).map((layer) => (
          <article key={layer.layer_id}>
            <strong>{layer.name}</strong>
            <span>{layer.lifecycle_status} · {layer.current_version}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

