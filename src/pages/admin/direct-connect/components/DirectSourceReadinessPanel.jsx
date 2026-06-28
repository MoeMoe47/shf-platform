import React from "react";

function List({ title, items }) {
  return (
    <div>
      <h3>{title}</h3>
      {items?.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>None</p>}
    </div>
  );
}

export default function DirectSourceReadinessPanel({ proof }) {
  if (!proof) return null;
  return (
    <section className="dc-proof-card" aria-label="Direct-source readiness">
      <div className="dc-section-head">
        <span>Verification Readiness</span>
        <strong>{proof.readiness_score}%</strong>
      </div>
      <div className="dc-status-grid">
        <div><span>SHS Reporting</span><strong>{proof.safe_for_shs_reporting ? "Ready" : "Not Ready"}</strong></div>
        <div><span>SHF Public Surface</span><strong>{String(proof.safe_for_shf_public_surface)}</strong></div>
        <div><span>Privacy</span><strong>{proof.privacy_status}</strong></div>
        <div><span>Ownership</span><strong>{proof.ownership_status}</strong></div>
      </div>
      <div className="dc-split">
        <List title="Blockers" items={proof.blockers} />
        <List title="Warnings" items={proof.warnings} />
      </div>
    </section>
  );
}
