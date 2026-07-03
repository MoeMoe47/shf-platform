import React from "react";

function List({ title, items = [] }) {
  return (
    <div>
      <strong>{title}</strong>
      {items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <span className="muted">None declared</span>}
    </div>
  );
}

export default function SystemLayerDetail({ layer }) {
  if (!layer) return null;
  return (
    <section className="system-registry-panel layer-detail">
      <div className="panel-heading"><p>Layer Detail</p><h2>{layer.name}</h2></div>
      <p>{layer.purpose}</p>
      <div className="detail-grid">
        <span><b>Lifecycle</b>{layer.lifecycle_status}</span>
        <span><b>Version</b>{layer.current_version}</span>
        <span><b>Health</b>{layer.health.overall}</span>
        <span><b>Readiness</b>{layer.readiness_score}</span>
        <span><b>Admin route</b>{layer.admin_route || "none"}</span>
        <span><b>Owner</b>{layer.owner}</span>
      </div>
      <div className="detail-columns">
        <List title="Docs" items={layer.docs} />
        <List title="Validators" items={layer.validators} />
        <List title="Source files" items={layer.source_files} />
      </div>
    </section>
  );
}

