import React from "react";

export default function DirectSourceProofList({ proofs = [], selectedProofId, onSelectProof }) {
  return (
    <section className="dc-proof-card" aria-label="Direct-source proof records">
      <div className="dc-section-head">
        <span>Proof Records</span>
        <strong>{proofs.length} local records</strong>
      </div>
      <div className="dc-proof-list">
        {proofs.map((proof) => (
          <button
            type="button"
            key={proof.direct_source_proof_id}
            className={proof.direct_source_proof_id === selectedProofId ? "is-active" : ""}
            onClick={() => onSelectProof(proof.direct_source_proof_id)}
          >
            <span>{proof.proof_type} / {proof.source_category}</span>
            <strong>{proof.title}</strong>
            <small>{proof.source_owner || "Missing owner"} / Readiness {proof.readiness_score}%</small>
          </button>
        ))}
      </div>
    </section>
  );
}
