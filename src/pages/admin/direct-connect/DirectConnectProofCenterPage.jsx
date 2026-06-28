import React from "react";
import {
  getDirectSourceApprovedCategories,
  getDirectSourceDeferredCategories,
} from "@/data/directConnect/directSourceCategories";
import { getStoredDirectSourceEvidenceRefs } from "@/data/directConnect/directSourceProofStorage";
import {
  applyDirectSourceProofAction,
  getStoredDirectSourceProofRecords,
  resetDirectSourceProofCenter,
} from "@/data/directConnect/directSourceProofStorage";
import { calculateDirectSourceProofMetrics } from "@/data/directConnect/directSourceProofMetrics";
import DirectSourceProofList from "./components/DirectSourceProofList";
import DirectSourceProofDetail from "./components/DirectSourceProofDetail";
import DirectSourceEvidencePanel from "./components/DirectSourceEvidencePanel";
import DirectSourceReadinessPanel from "./components/DirectSourceReadinessPanel";
import DirectSourceSafetyPanel from "./components/DirectSourceSafetyPanel";
import DirectSourceCategoryPanel from "./components/DirectSourceCategoryPanel";
import "./directConnectProofCenter.css";

export default function DirectConnectProofCenterPage() {
  const [proofs, setProofs] = React.useState(() => getStoredDirectSourceProofRecords());
  const [evidenceRefs, setEvidenceRefs] = React.useState(() => getStoredDirectSourceEvidenceRefs());
  const [selectedProofId, setSelectedProofId] = React.useState(() => proofs[0]?.direct_source_proof_id || "");
  const approvedCategories = React.useMemo(() => getDirectSourceApprovedCategories(), []);
  const deferredCategories = React.useMemo(() => getDirectSourceDeferredCategories(), []);
  const selectedProof = proofs.find((proof) => proof.direct_source_proof_id === selectedProofId) || proofs[0] || null;
  const selectedEvidenceRefs = selectedProof
    ? evidenceRefs.filter((ref) => ref.direct_source_proof_id === selectedProof.direct_source_proof_id)
    : [];
  const metrics = React.useMemo(
    () => calculateDirectSourceProofMetrics(proofs, approvedCategories, deferredCategories),
    [proofs, approvedCategories, deferredCategories]
  );

  function refresh(nextProofs = getStoredDirectSourceProofRecords()) {
    setProofs(nextProofs);
    setEvidenceRefs(getStoredDirectSourceEvidenceRefs());
    if (!nextProofs.find((proof) => proof.direct_source_proof_id === selectedProofId)) {
      setSelectedProofId(nextProofs[0]?.direct_source_proof_id || "");
    }
  }

  function handleAction(action, note) {
    if (!selectedProof) return;
    refresh(applyDirectSourceProofAction(selectedProof.direct_source_proof_id, action, note));
  }

  function handleReset() {
    resetDirectSourceProofCenter();
    refresh();
  }

  return (
    <main className="direct-connect-proof-page">
      <section className="dc-hero">
        <div>
          <p>SHS Direct Connect Batch 2</p>
          <h1>Direct Connect Proof Center</h1>
          <span>Direct-source proof records, evidence references, readiness, and safety boundaries for internal SHS review.</span>
        </div>
        <button type="button" onClick={handleReset}>Load Sample Proof Records</button>
      </section>

      <section className="dc-metrics" aria-label="Direct-source proof metrics">
        <article><span>Proof Records</span><strong>{metrics.proof_count}</strong></article>
        <article><span>SHS Report Ready</span><strong>{metrics.shs_reporting_ready}</strong></article>
        <article><span>Needs Review</span><strong>{metrics.needs_review}</strong></article>
        <article><span>Avg Readiness</span><strong>{metrics.average_readiness_score}%</strong></article>
      </section>

      <section className="dc-layout">
        <div className="dc-main">
          <DirectSourceProofList proofs={proofs} selectedProofId={selectedProof?.direct_source_proof_id} onSelectProof={setSelectedProofId} />
          <DirectSourceProofDetail proof={selectedProof} onAction={handleAction} />
          <DirectSourceEvidencePanel evidenceRefs={selectedEvidenceRefs} />
          <DirectSourceCategoryPanel approved={approvedCategories} deferred={deferredCategories} />
        </div>
        <aside className="dc-side">
          <DirectSourceReadinessPanel proof={selectedProof} />
          <DirectSourceSafetyPanel proof={selectedProof} metrics={metrics} />
        </aside>
      </section>
    </main>
  );
}
