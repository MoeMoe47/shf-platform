import React from "react";

const GOVERNANCE_IDS = ["governance_truth_oracle", "system_registry", "direct_connect_proof"];

export default function ExecutiveGovernancePanel({ layers, safety }) {
  return (
    <section className="ecc-panel ecc-span-6">
      <div className="ecc-panel-heading"><p>Governance and Trust</p><h2>Truth, Oracle, Registry, approval guard</h2></div>
      <p className="ecc-boundary">{safety.boundary_copy}</p>
      <div className="ecc-card-grid">
        {layers.filter((layer) => GOVERNANCE_IDS.includes(layer.layer_id)).map((layer) => (
          <article key={layer.layer_id}><strong>{layer.layer_name}</strong><span>{layer.status} - {layer.data_posture}</span><small>{layer.source_reference}</small></article>
        ))}
      </div>
    </section>
  );
}
