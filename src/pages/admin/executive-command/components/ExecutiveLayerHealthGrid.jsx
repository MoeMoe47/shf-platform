import React from "react";

export default function ExecutiveLayerHealthGrid({ layers, filters, onFilter }) {
  const filtered = layers.filter((layer) => {
    const statusOk = filters.status === "all" || layer.status === filters.status;
    const categoryOk = filters.category === "all" || layer.category === filters.category;
    return statusOk && categoryOk;
  });
  return (
    <section className="ecc-panel ecc-span-12">
      <div className="ecc-panel-heading"><p>Layer Health Grid</p><h2>All known source groups</h2></div>
      <div className="ecc-filter-row">
        <label>Status<select value={filters.status} onChange={(event) => onFilter({ status: event.target.value })}><option value="all">All</option><option value="healthy">Healthy</option><option value="ready">Ready</option><option value="attention">Attention</option><option value="blocked">Blocked</option><option value="unavailable">Unavailable</option><option value="needs_review">Needs Review</option></select></label>
        <label>Category<select value={filters.category} onChange={(event) => onFilter({ category: event.target.value })}><option value="all">All</option><option value="governance">Governance</option><option value="runtime">Runtime</option><option value="intelligence">Intelligence</option><option value="operations">Operations</option><option value="agents">Agents</option><option value="reports">Reports</option><option value="integration">Integration</option><option value="business">Business</option></select></label>
      </div>
      <div className="ecc-layer-grid">
        {filtered.map((layer) => (
          <article key={layer.layer_id}>
            <strong>{layer.layer_name}</strong>
            <span>{layer.status} - readiness {layer.readiness_score} - health {layer.health_score}</span>
            <small>{layer.data_posture} - open {layer.open_items} - {layer.route}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
