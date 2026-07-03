import React from "react";

export default function SystemLayerList({ layers, selectedLayerId, onSelectLayer }) {
  return (
    <section className="system-registry-panel layer-list">
      <div className="panel-heading"><p>Layer List</p><h2>{layers.length} Layers</h2></div>
      <div className="registry-list">
        {layers.map((layer) => (
          <button
            type="button"
            key={layer.layer_id}
            className={selectedLayerId === layer.layer_id ? "is-selected" : ""}
            onClick={() => onSelectLayer(layer.layer_id)}
          >
            <strong>{layer.name}</strong>
            <span>{layer.category} · {layer.release_status}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

