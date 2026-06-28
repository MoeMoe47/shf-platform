import React from "react";

export default function DirectSourceEvidencePanel({ evidenceRefs = [] }) {
  return (
    <section className="dc-proof-card" aria-label="Source evidence references">
      <div className="dc-section-head">
        <span>Evidence References</span>
        <strong>{evidenceRefs.length} attached</strong>
      </div>
      <div className="dc-evidence-list">
        {evidenceRefs.length ? evidenceRefs.map((ref) => (
          <article key={ref.source_evidence_ref_id}>
            <span>{ref.evidence_type} / {ref.received_method}</span>
            <strong>{ref.evidence_title}</strong>
            <p>{ref.evidence_summary}</p>
            <small>Owner: {ref.source_owner} / Storage: {ref.storage_status}</small>
          </article>
        )) : <p>No evidence reference attached.</p>}
      </div>
    </section>
  );
}
