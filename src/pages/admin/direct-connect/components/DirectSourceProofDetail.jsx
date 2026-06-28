import React from "react";

const FIELDS = [
  ["Proof ID", "direct_source_proof_id"],
  ["Source Owner", "source_owner"],
  ["Source Reference", "source_reference"],
  ["Source Registry", "source_registry_ref"],
  ["Evidence Package", "evidence_package_ref"],
  ["Related Claim", "related_claim"],
  ["Related Metric", "related_metric"],
  ["Report", "related_report_id"],
  ["Client", "related_client_id"],
  ["Project", "related_project_id"],
  ["Verification Pathway", "verification_pathway"],
  ["Verification Status", "verification_status"],
  ["Approval Status", "approval_status"],
];

export default function DirectSourceProofDetail({ proof, onAction }) {
  const [note, setNote] = React.useState("");

  React.useEffect(() => setNote(""), [proof?.direct_source_proof_id]);

  if (!proof) {
    return <section className="dc-proof-card dc-empty">Select a direct-source proof record.</section>;
  }

  return (
    <section className="dc-proof-card dc-proof-detail" aria-label="Direct-source proof detail">
      <div className="dc-section-head">
        <span>Direct-Source Proof</span>
        <strong>{proof.title}</strong>
      </div>
      <div className="dc-kv-grid">
        {FIELDS.map(([label, key]) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{proof[key] || "Not set"}</strong>
          </div>
        ))}
      </div>
      <label className="dc-note">
        Operator Note
        <textarea rows="3" value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <div className="dc-actions">
        <button type="button" onClick={() => onAction("mark_internal_review", note)}>Mark Internal Review</button>
        <button type="button" onClick={() => onAction("mark_privacy_clear", note)}>Privacy Clear</button>
        <button type="button" onClick={() => onAction("mark_ownership_clear", note)}>Ownership Clear</button>
        <button type="button" onClick={() => onAction("note", note)}>Add Note</button>
        <button type="button" onClick={() => onAction("block", note)}>Block Proof</button>
      </div>
    </section>
  );
}
