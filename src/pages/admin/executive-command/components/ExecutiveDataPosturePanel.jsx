import React from "react";

export default function ExecutiveDataPosturePanel({ posture }) {
  return (
    <section className="ecc-panel ecc-span-3">
      <div className="ecc-panel-heading"><p>Data Posture</p><h2>Truthful source posture</h2></div>
      <div className="ecc-list compact">
        {Object.entries(posture).map(([key, value]) => <article key={key}><strong>{key}</strong><span>{value} layer(s)</span></article>)}
      </div>
    </section>
  );
}
