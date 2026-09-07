import React, { useEffect, useState } from "react";
import { getLineage, getTruthFact } from "../../services/government-assurance-client";

const value = (input) => input == null || input === "" ? "—" : typeof input === "object" ? JSON.stringify(input) : String(input);
function Panel({ title, children }) { return <section className="gpa-portfolio-panel"><h2>{title}</h2>{children}</section>; }
function Row({ label, value: fieldValue }) { return <div><dt>{label}</dt><dd>{value(fieldValue)}</dd></div>; }

export default function GovernmentAssuranceLineageDetail({ kind, id }) {
  const [state, setState] = useState({ loading: true, error: "", root: null, lineage: null });
  async function load() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      if (kind === "truth") {
        const root = await getTruthFact(id);
        if (!root) throw new Error("Truth Fact was not found in the current organization and tenant scope.");
        const metricId = root.metricResultId || root.metric_result_id;
        const lineage = metricId ? await getLineage(metricId) : null;
        setState({ loading: false, error: "", root, lineage });
      } else {
        const lineage = await getLineage(id);
        if (!lineage) throw new Error("Metric Result was not found in the current organization and tenant scope.");
        setState({ loading: false, error: "", root: lineage, lineage });
      }
    } catch (error) { setState((current) => ({ ...current, loading: false, error: error.message })); }
  }
  useEffect(() => { load(); }, [kind, id]);
  if (state.loading) return <section><h1>Lineage Explorer</h1><p role="status">Loading canonical lineage…</p></section>;
  if (state.error) return <section><h1>Lineage Explorer</h1><div role="alert">{state.error}</div><button type="button" onClick={load}>Retry</button></section>;
  const root = state.root || {};
  const lineage = state.lineage || {};
  const claims = lineage.claimEvidenceLineage || lineage.claim_evidence_lineage || [];
  const refs = lineage.inputReferences || lineage.input_references || [];
  const nodes = [
    [kind === "truth" ? "Truth Fact" : "Metric Result", id, root.status],
    ["Metric Definition", `${lineage.metricId || lineage.metric_id || root.metricId || root.metric_id || "—"}:${lineage.metricVersion || lineage.metric_version || root.metricVersion || root.metric_version || "—"}`, lineage.canonicalName || lineage.canonical_name],
    ["Verification", refs.map((item) => item.verificationId || item.verification_id).filter(Boolean).join(", "), value(lineage.inputVerificationLevels || lineage.input_verification_levels)],
    ["Claim", [...new Set([...refs.map((item) => item.claimId || item.claim_id), ...claims.map((item) => item.claimId || item.claim_id)].filter(Boolean))].join(", "), "canonical claim reference"],
    ["Evidence", [...new Set([...claims.map((item) => item.evidenceId || item.evidence_id), ...refs.flatMap((item) => item.evidenceReferences || item.evidence_references || [])].filter(Boolean))].join(", "), "canonical Evidence authority"],
    ["Source Provenance", refs.map((item) => item.sourceProvenanceReference || item.provenanceReference).filter(Boolean).join(", "), "preserved provenance"],
    ["Source Authority", refs.map((item) => item.sourceAuthorityReference).filter(Boolean).join(", "), "scoped authority reference"],
    ["Program / Provider / Funding", [root.programReference || root.program_reference, root.providerReference || root.provider_reference].filter(Boolean).join(" / "), "context references"],
  ];
  return <div className="gpa-portfolio-detail"><h1>Lineage Explorer</h1><p className="gpa-note">This projection follows stored canonical references. It does not create or promote Truth.</p><Panel title="Root"><dl><Row label="Object type" value={kind === "truth" ? "Truth Fact" : "Metric Result"} /><Row label="Canonical reference" value={id} /><Row label="Status" value={root.status || lineage.status} /><Row label="Period" value={`${root.reportingPeriodStart || root.reporting_period_start || lineage.reportingPeriodStart || lineage.reporting_period_start || "—"} → ${root.reportingPeriodEnd || root.reporting_period_end || lineage.reportingPeriodEnd || lineage.reporting_period_end || "—"}`} /></dl></Panel><Panel title="Canonical lineage"><ol className="gpa-lineage-list">{nodes.map(([type, reference, status]) => <li key={type}><strong>{type}</strong><span>{value(reference)}</span><small>{value(status)}</small></li>)}</ol></Panel><Panel title="Provenance"><dl><Row label="Calculation/provenance" value={lineage.provenance || lineage.provenance_reference || root.provenance} /><Row label="Verification levels" value={lineage.inputVerificationLevels || lineage.input_verification_levels || root.verificationLevel || root.verification_level} /></dl></Panel></div>;
}
