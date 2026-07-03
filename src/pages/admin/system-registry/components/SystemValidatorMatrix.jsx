import React from "react";

export default function SystemValidatorMatrix({ rows }) {
  return (
    <section className="system-registry-panel validator-matrix">
      <div className="panel-heading"><p>Validator Matrix</p><h2>Coverage</h2></div>
      <div className="matrix-list">
        {rows.map((row) => (
          <article key={row.layer_id}>
            <strong>{row.name}</strong>
            <span>{row.status}</span>
            <small>{row.validators.join(", ") || "No validator declared"}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

