import React, { useEffect, useMemo, useState } from "react";
import CivicSurePageHeader from "../../components/civicsure/CivicSurePageHeader.jsx";
import StatusChip from "../../components/StatusChip";
import GovernmentAssuranceMonitoringDetail from "./GovernmentAssuranceMonitoringDetail.jsx";
import { getAssuranceDashboard, getMonitoringQueue, getPilotReadiness, getPilotConfigurations, getPublicAssuranceSummary, getFundingReferences, getClaims, getClaim, getClaimEvidence, getClaimReadiness, getClaimHistory, submitClaim, withdrawClaim, requestVerification, getVerificationQueue, getVerification, getVerificationHistory, startVerification, addVerificationContradiction, determineVerification, getReconciliationCases, getAudits, getSources, getSourceAuthorities, getDataUsePolicies, getMetricResults, getTruthFacts } from "../../services/government-assurance-client";
import GovernmentAssuranceReconciliationDetail from "./GovernmentAssuranceReconciliationDetail.jsx";
import GovernmentAssuranceSourceDetail from "./GovernmentAssuranceSourceDetail.jsx";
import GovernmentAssurancePortfolioDetail from "./GovernmentAssurancePortfolioDetail.jsx";
import GovernmentAssuranceLineageDetail from "./GovernmentAssuranceLineageDetail.jsx";
import GovernmentAssurancePhase8B from "./GovernmentAssurancePhase8B.jsx";

function Metric({ label, value, tone = "#16324f" }) {
  return <div style={{ borderLeft: `4px solid ${tone}`, padding: "12px 14px", background: "#f7f9fb" }}><div style={{ color: "#52606d", fontSize: 13 }}>{label}</div><strong style={{ display: "block", fontSize: 25, color: tone, marginTop: 4 }}>{value ?? "—"}</strong></div>;
}

function Section({ title, children }) {
  return <section style={{ marginTop: 22 }}><h2 style={{ fontSize: 18, margin: "0 0 10px" }}>{title}</h2>{children}</section>;
}

function displayFactValue(value) {
  if (value == null) return "—";
  if (typeof value === "object") return value.value ?? JSON.stringify(value);
  return String(value);
}

const workspaceLoaders = {
  Programs: getFundingReferences,
  Providers: getFundingReferences,
  Funding: getFundingReferences,
  Claims: getClaims,
  Verification: getVerificationQueue,
  Reconciliation: getReconciliationCases,
  Audit: getAudits,
  "Data Sources": async () => ({ sources: (await getSources()).items || [], authorities: (await getSourceAuthorities()).items || [], policies: (await getDataUsePolicies()).items || [] }),
};

function ref(value) {
  return value == null || value === "" ? "—" : String(value);
}

function detailHref(tab, row) {
  if (tab === "Programs") return `#/operator/government-assurance/programs/${encodeURIComponent(row.program_reference || row.programReference)}`;
  if (tab === "Providers") return `#/operator/government-assurance/providers/${encodeURIComponent(row.provider_organization_reference || row.providerOrganizationReference)}`;
  if (tab === "Funding") return `#/operator/government-assurance/funding/${encodeURIComponent(row.funding_reference_id || row.fundingReferenceId || row.canonical_record_id)}`;
  if (tab === "Audit") return `#/operator/government-assurance/audits/${encodeURIComponent(row.audit_engagement_id || row.auditEngagementId)}`;
  if (tab === "Claims") return `#/operator/government-assurance/claims/${encodeURIComponent(row.claimId || row.claim_id)}`;
  if (tab === "Verification") return `#/operator/government-assurance/verification/${encodeURIComponent(row.verificationId || row.verification_id)}`;
  if (tab === "Reconciliation") return `#/operator/government-assurance/reconciliation/${encodeURIComponent(row.reconciliationCaseId || row.reconciliation_case_id)}`;
  if (tab === "Data Sources") return `#/operator/government-assurance/data-sources/${encodeURIComponent(row.sourceSystemId || row.source_system_id)}`;
  return null;
}

function WorkspacePanel({ tab, data, loading, error, onRetry, onSelect }) {
  if (loading) return <Section title={`${tab} Assurance`}><p role="status">Loading canonical {tab.toLowerCase()} records…</p></Section>;
  if (error) return <Section title={`${tab} Assurance`}><div role="alert" style={{ padding: 12, background: "#fff4f2", color: "#8a1c13" }}>{error}</div><button type="button" onClick={onRetry}>Retry</button></Section>;
  if (tab === "Data Sources") return <Section title="Data Sources / Data Quality"><p className="gpa-note">Credentials are never returned. Source health, authority, and policy remain separate canonical authorities.</p><div className="gpa-table-wrap"><table><caption className="sr-only">Registered source systems</caption><thead><tr><th>Source</th><th>Type</th><th>Status</th><th>Authority records</th><th>Use policies</th></tr></thead><tbody>{(data?.sources || []).map((row) => <tr key={row.source_system_id || row.sourceSystemId}><td><a href={detailHref(tab, row)}>{ref(row.source_system_id || row.sourceSystemId)}</a></td><td>{ref(row.system_type || row.systemType)}</td><td>{ref(row.status)}</td><td>{data.authorities.length}</td><td>{data.policies.length}</td></tr>)}</tbody></table></div></Section>;
  const items = data?.items || data || [];
  if (!items.length) return <Section title={`${tab} Assurance`}><p>No canonical records are available in this organization and tenant scope.</p></Section>;
  const rows = tab === "Programs" ? [...new Map(items.filter((x) => x.program_reference).map((x) => [x.program_reference, x])).values()] : tab === "Providers" ? [...new Map(items.filter((x) => x.provider_organization_reference).map((x) => [x.provider_organization_reference, x])).values()] : items;
  const columns = tab === "Programs" ? [["program_reference", "Program"], ["accountable_organization_reference", "Accountable org"], ["status", "Status"], ["amount", "Funding"]] : tab === "Providers" ? [["provider_organization_reference", "Provider"], ["program_reference", "Program"], ["amount", "Exposure"], ["status", "Status"]] : tab === "Claims" ? [["claimId", "Claim"], ["status", "Status"], ["programReference", "Program"], ["assertedValue", "Asserted value"]] : [[Object.keys(rows[0])[0], "Reference"], ["status", "Status"], ["program_reference", "Program"], ["provider_reference", "Provider"]];
  return <Section title={`${tab} Assurance`}><p className="gpa-note">Canonical references are shown from the GPA API. Open a record to inspect its scoped fields; mutations remain backend-owned.</p><div className="gpa-table-wrap"><table><caption className="sr-only">{tab} canonical records</caption><thead><tr>{columns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row[columns[0][0]] || index}>{columns.map(([key]) => { const href = detailHref(tab, row); return <td key={key}>{href ? <a href={href} onClick={() => onSelect?.(row)}>{displayFactValue(row[key])}</a> : <button type="button" onClick={() => onSelect?.(row)} style={{ border: 0, background: "transparent", color: "#0b5cad", textDecoration: "underline", cursor: "pointer", padding: 0 }}>{displayFactValue(row[key])}</button>}</td>; })}</tr>)}</tbody></table></div></Section>;
}

function LifecycleHistory({ items = [] }) {
  if (!items.length) return <p>No lifecycle history is recorded for this authority.</p>;
  return <ol aria-label="Lifecycle history" className="gpa-list">{items.map((item) => <li key={item.audit_event_id || item.correlation_id}><strong>{item.action_type}</strong> <span>{item.actor_user_id || item.actor_system_id || "system"}</span><time dateTime={item.event_timestamp}>{new Date(item.event_timestamp).toLocaleString()}</time>{item.reason_code ? <small>Reason: {item.reason_code}</small> : null}</li>)}</ol>;
}

export default function GovernmentAssurance({ initialView = null, initialClaimId = null, initialVerificationId = null, initialReconciliationId = null, initialSourceId = null, initialPortfolio = null, initialLineage = null, initialMonitoring = null, initialPhase8B = null }) {
  const initialTab = initialView || (initialClaimId ? "Claims" : initialVerificationId ? "Verification" : initialReconciliationId ? "Reconciliation" : initialSourceId ? "Data Sources" : initialPortfolio ? ({ program: "Programs", provider: "Providers", funding: "Funding", audit: "Audit" }[initialPortfolio.kind]) : initialMonitoring ? "Monitoring" : initialPhase8B || "Overview");
  const [tab, setTab] = useState(initialTab);
  const [dashboard, setDashboard] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [queue, setQueue] = useState(null);
  const [publicSummary, setPublicSummary] = useState(null);
  const [configurations, setConfigurations] = useState(null);
  const [lineage, setLineage] = useState({ metrics: [], truths: [] });
  const [workspace, setWorkspace] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [selectedReadiness, setSelectedReadiness] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [selectedVerificationEvidence, setSelectedVerificationEvidence] = useState([]);
  const [contradictionText, setContradictionText] = useState("");
  const [determination, setDetermination] = useState({ result: "PASSED", rationale: "", achievedLevel: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getAssuranceDashboard(), getPilotReadiness(), getMonitoringQueue(), getPilotConfigurations(), getPublicAssuranceSummary(), getMetricResults(), getTruthFacts()])
      .then(([d, r, q, c, p, metrics, truths]) => { setDashboard(d); setReadiness(r); setQueue(q); setConfigurations(c); setPublicSummary(p); setLineage({ metrics: metrics.items || [], truths: truths.items || [] }); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const loader = workspaceLoaders[tab];
    if (!loader) return;
    setWorkspaceLoading(true); setWorkspaceError("");
    loader().then(setWorkspace).catch((e) => setWorkspaceError(e.message)).finally(() => setWorkspaceLoading(false));
    if (!initialClaimId && !initialVerificationId && !initialReconciliationId && !initialSourceId && !initialPortfolio && !initialLineage) {
      setSelected(null); setSelectedEvidence(null); setSelectedReadiness(null); setSelectedHistory([]); setSelectedVerificationEvidence([]); setActionMessage("");
    }
  }, [tab]);

  useEffect(() => {
    if (initialView) setTab(initialView);
    else if (initialClaimId) setTab("Claims");
    else if (initialVerificationId) setTab("Verification");
    else if (initialReconciliationId) setTab("Reconciliation");
    else if (initialSourceId) setTab("Data Sources");
    else if (initialPortfolio) setTab(({ program: "Programs", provider: "Providers", funding: "Funding", audit: "Audit" }[initialPortfolio.kind]));
    else if (initialMonitoring) setTab("Monitoring");
    if (initialClaimId && tab === "Claims") loadClaim(initialClaimId);
    if (initialVerificationId && tab === "Verification") loadVerification(initialVerificationId);
  }, [initialView, initialClaimId, initialVerificationId, initialReconciliationId, initialSourceId, initialPortfolio, initialLineage, initialMonitoring, tab]);

  async function loadClaim(claimId) {
    setSelected(null); setSelectedEvidence(null); setSelectedReadiness(null); setSelectedHistory([]); setActionMessage("Loading canonical Claim…");
    try {
      const [claim, evidence, readiness, history] = await Promise.all([getClaim(claimId), getClaimEvidence(claimId), getClaimReadiness(claimId), getClaimHistory(claimId)]);
      if (!claim) throw new Error("Claim was not found in the current organization and tenant scope.");
      setSelected(claim); setSelectedEvidence(evidence.items || evidence || []); setSelectedReadiness(readiness); setSelectedHistory(history.items || history || []); setActionMessage("");
    } catch (loadError) { setActionMessage(loadError.message); }
  }

  async function loadVerification(verificationId) {
    setSelected(null); setSelectedVerificationEvidence([]); setSelectedHistory([]); setActionMessage("Loading canonical Verification…");
    try {
      const verification = await getVerification(verificationId);
      if (!verification) throw new Error("Verification was not found in the current organization and tenant scope.");
      const [history, evidence] = await Promise.all([getVerificationHistory(verificationId), verification.claimId ? getClaimEvidence(verification.claimId) : Promise.resolve({ items: [] })]);
      setSelected(verification); setSelectedHistory(history.items || history || []); setSelectedVerificationEvidence(evidence.items || evidence || []); setActionMessage("");
    } catch (loadError) { setActionMessage(loadError.message); }
  }

  async function selectRecord(row) {
    setSelected(row); setSelectedEvidence(null); setSelectedReadiness(null); setSelectedVerificationEvidence([]); setActionMessage("");
    const claimId = row.claim_id || row.claimId;
    if (tab === "Claims" && claimId) {
      try { await loadClaim(claimId); } catch (error) { setSelected(row); setActionMessage(error.message); }
    }
    const verificationId = row.verification_id || row.verificationId;
    if (tab === "Verification" && verificationId) {
      try { await loadVerification(verificationId); } catch (error) { setSelected(row); setActionMessage(error.message); }
    }
  }

  async function claimAction(action) {
    const claimId = selected?.claim_id || selected?.claimId;
    if (!claimId) return;
    try { setActionMessage("Saving canonical state…"); await action(claimId); setActionMessage("Canonical action succeeded."); await loadClaim(claimId); } catch (error) { setActionMessage(error.message); }
  }

  async function verificationAction(action) {
    const verificationId = selected?.verificationId || selected?.verification_id;
    if (!verificationId) return;
    try { setActionMessage("Saving canonical verification state…"); await action(verificationId); await loadVerification(verificationId); setActionMessage("Canonical verification action succeeded."); } catch (actionError) { setActionMessage(actionError.message); }
  }

  const summary = dashboard?.summary || {};
  const action = dashboard?.actionRequired || {};
  const publicItems = publicSummary?.items || [];
  const queueCounts = useMemo(() => ({ findings: queue?.findings?.length || 0, actions: queue?.correctiveActions?.length || 0, requests: queue?.evidenceRequests?.length || 0 }), [queue]);
  const queueRows = useMemo(() => [
    ...(queue?.plans || []).map((row) => ({ type: "Plan", id: row.monitoring_plan_id, status: row.status, detail: `#/operator/government-assurance/monitoring/plans/${encodeURIComponent(row.monitoring_plan_id)}`, due: row.period_end })),
    ...(queue?.activities || []).map((row) => ({ type: "Activity", id: row.activity_id, status: row.status, detail: `#/operator/government-assurance/monitoring/activities/${encodeURIComponent(row.activity_id)}`, due: row.scheduled_at })),
    ...(queue?.evidenceRequests || []).map((row) => ({ type: "Evidence Request", id: row.evidence_request_id, status: row.status, detail: `#/operator/government-assurance/monitoring/evidence-requests/${encodeURIComponent(row.evidence_request_id)}`, due: row.due_at })),
    ...(queue?.findings || []).map((row) => ({ type: "Finding", id: row.finding_id, status: row.status, detail: `#/operator/government-assurance/findings/${encodeURIComponent(row.finding_id)}`, due: row.detected_at })),
    ...(queue?.correctiveActions || []).map((row) => ({ type: "Corrective Action", id: row.corrective_action_id, status: row.status, detail: `#/operator/government-assurance/corrective-actions/${encodeURIComponent(row.corrective_action_id)}`, due: row.due_at })),
  ], [queue]);

  return <div className="gpa-shell"><style>{`.gpa-shell{max-width:1180px}.gpa-tabs{display:flex;gap:6px;overflow:auto;border-bottom:1px solid #d9e2ec;padding-bottom:8px}.gpa-tabs button{border:1px solid #cbd5e1;background:#fff;color:#243b53;padding:9px 13px;cursor:pointer}.gpa-tabs button[aria-pressed="true"]{background:#16324f;color:#fff}.gpa-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.gpa-list{display:grid;gap:8px}.gpa-list div{display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:10px 0}.gpa-readiness{display:flex;gap:10px;align-items:center}.gpa-note{color:#52606d;line-height:1.5}.gpa-table-wrap{overflow:auto}.gpa-table-wrap table{border-collapse:collapse;width:100%;min-width:620px}.gpa-table-wrap th,.gpa-table-wrap td{text-align:left;border-bottom:1px solid #d9e2ec;padding:10px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:760px){.gpa-grid{grid-template-columns:1fr 1fr}}@media(max-width:480px){.gpa-grid{grid-template-columns:1fr}}`}</style>
    <CivicSurePageHeader title="Government Program Assurance" description="County pilot operating view. Official figures are sourced from canonical assurance authorities." />
    {error ? <div role="alert" style={{ padding: 12, background: "#fff4f2", color: "#8a1c13", border: "1px solid #e6b8b2" }}>{error}</div> : null}
    {actionMessage && !selected ? <div role="alert" style={{ padding: 12, background: "#fff4f2", color: "#8a1c13", border: "1px solid #e6b8b2" }}>{actionMessage}</div> : null}
    {tab === "Overview" ? <>
      <Section title="Executive Assurance Summary"><div className="gpa-grid">
        <Metric label="Programs in scope" value={summary.programs} /><Metric label="Providers in scope" value={summary.providers} /><Metric label="Funding awarded" value={summary.fundingAwarded != null ? `$${summary.fundingAwarded.toLocaleString()}` : "—"} /><Metric label="Accepted Truth facts" value={summary.acceptedTruthFacts} tone="#166534" /><Metric label="Open findings" value={summary.openFindings} tone="#9a3412" /><Metric label="Overdue corrective actions" value={summary.overdueCorrectiveActions} tone="#b91c1c" />
      </div></Section>
      <Section title="Action Required"><div className="gpa-list"><div>Claims awaiting verification <strong>{action.claimsAwaitingVerification ?? "—"}</strong></div><div>Material reconciliations <strong>{action.openMaterialReconciliations ?? "—"}</strong></div><div>Overdue corrective actions <strong>{action.overdueCorrectiveActions ?? "—"}</strong></div><div>Source health failures <strong>{action.sourceHealthFailures ?? "—"}</strong></div></div></Section>
      <Section title="Pilot Readiness"><div className="gpa-readiness"><StatusChip value={readiness?.status || "LOADING"} /> <span>{readiness?.blockers?.length ? `${readiness.blockers.length} condition(s) require attention.` : "Core assurance controls are configured."}</span></div>{readiness?.blockers?.length ? <ul>{readiness.blockers.map((b) => <li key={b.code}>{b.label}</li>)}</ul> : null}</Section>
      <Section title="Lineage Explorer"><p className="gpa-note">Official values remain inspectable through canonical Metric Results and Truth Fact references. Select a reference to continue into the owning API.</p><div className="gpa-list">{lineage.truths.slice(0, 5).map((fact) => <div key={fact.truth_fact_id}><span>Truth {fact.truth_fact_id}</span><strong>{displayFactValue(fact.fact_value)}</strong></div>)}{lineage.metrics.slice(0, 5).map((metric) => <div key={metric.metric_result_id}><span>Metric Result {metric.metric_result_id}</span><strong>{displayFactValue(metric.calculated_value)}</strong></div>)}</div></Section>
    </> : null}

    {tab === "Monitoring" ? <Section title="Monitoring Work Queue"><div className="gpa-grid"><Metric label="Evidence requests" value={queueCounts.requests} /><Metric label="Findings" value={queueCounts.findings} /><Metric label="Corrective actions" value={queueCounts.actions} /></div><p className="gpa-note">Canonical monitoring records are scoped to the active organization and tenant. Actions are validated by the backend.</p><div className="gpa-table-wrap"><table><caption className="sr-only">Monitoring work queue</caption><thead><tr><th>Type</th><th>Reference</th><th>Status</th><th>Due / period</th></tr></thead><tbody>{queueRows.map((row) => <tr key={`${row.type}-${row.id}`}><td>{row.type}</td><td><a href={row.detail}>{row.id}</a></td><td>{row.status}</td><td>{row.due || "—"}</td></tr>)}</tbody></table></div>{initialMonitoring ? <GovernmentAssuranceMonitoringDetail kind={initialMonitoring.kind} id={initialMonitoring.id} queue={queue} /> : <p>Select a monitoring record to inspect its canonical detail and lifecycle history.</p>}</Section> : null}
    {tab === "Reconciliation" && initialReconciliationId ? <Section title="Reconciliation Review"><GovernmentAssuranceReconciliationDetail id={initialReconciliationId} /></Section> : null}
    {tab === "Data Sources" && initialSourceId ? <Section title="Source System Detail"><GovernmentAssuranceSourceDetail id={initialSourceId} /></Section> : null}
    {initialPortfolio ? <GovernmentAssurancePortfolioDetail kind={initialPortfolio.kind === "audits" ? "audit" : initialPortfolio.kind} id={initialPortfolio.id} /> : null}
    {initialLineage ? <GovernmentAssuranceLineageDetail kind={initialLineage.kind} id={initialLineage.id} /> : null}
    {["Programs", "Providers", "Funding", "Claims", "Verification", "Reconciliation", "Audit", "Data Sources"].includes(tab) && !((tab === "Reconciliation" && initialReconciliationId) || (tab === "Data Sources" && initialSourceId) || initialPortfolio || initialLineage) ? <><WorkspacePanel tab={tab} data={workspace} loading={workspaceLoading} error={workspaceError} onRetry={() => setTab(tab)} onSelect={selectRecord} />{selected ? <Section title={`${tab} Detail`}><div className="gpa-detail"><dl>{Object.entries(selected).filter(([key]) => !["metadata", "provenance", "scope"].includes(key)).slice(0, 18).map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{displayFactValue(value)}</dd></div>)}</dl>{tab === "Claims" ? <>
      <Section title="Claim Readiness"><p role="status">{selectedReadiness?.ready ? "Ready for verification" : "Verification readiness is blocked"}</p>{selectedReadiness?.blockers?.length ? <ul>{selectedReadiness.blockers.map((blocker) => <li key={blocker.code || blocker.reason}>{blocker.code || blocker.reason}: {blocker.label || blocker.message || "Blocked"}</li>)}</ul> : <p>No deterministic readiness blockers are recorded.</p>}</Section>
      <Section title="Evidence and Admissibility">{selectedEvidence?.length ? <div className="gpa-table-wrap"><table><caption className="sr-only">Claim evidence metadata</caption><thead><tr><th>Evidence</th><th>Role</th><th>Admissibility</th><th>Reason</th><th>Custody events</th></tr></thead><tbody>{selectedEvidence.map((evidence) => <tr key={evidence.claimEvidenceLinkId || evidence.claim_evidence_link_id}><td>{ref(evidence.evidenceId || evidence.evidence_id)}<br /><small>{ref(evidence.evidenceType || evidence.evidence_type)} / {ref(evidence.classification)}</small></td><td>{ref(evidence.evidenceRole || evidence.evidence_role)}</td><td>{ref(evidence.admissibilityDecision || evidence.admissibility_decision || "NOT_EVALUATED")}</td><td>{Array.isArray(evidence.admissibilityReasonCodes || evidence.admissibility_reason_codes) ? (evidence.admissibilityReasonCodes || evidence.admissibility_reason_codes).join(", ") : ref(evidence.admissibilityReasonCodes || evidence.admissibility_reason_codes)}</td><td>{Array.isArray(evidence.custodyEvents || evidence.custody_events) ? (evidence.custodyEvents || evidence.custody_events).length : 0}</td></tr>)}</tbody></table></div> : <p>No Evidence is linked to this Claim.</p>}</Section>
      <Section title="Lifecycle History"><LifecycleHistory items={selectedHistory} /></Section>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" onClick={() => claimAction(submitClaim)}>Submit Claim</button><button type="button" onClick={() => claimAction(withdrawClaim)}>Withdraw Claim</button><button type="button" onClick={() => claimAction((id) => requestVerification(id, { methodId: selected.methodId || selected.method_id || "phase8_method_source", verifierReference: "admin_A" }))}>Request Verification</button></div>
    </> : tab === "Verification" ? <>
      <Section title="Verification Evidence">{selectedVerificationEvidence.length ? <div className="gpa-table-wrap"><table><caption className="sr-only">Evidence tested by verification</caption><thead><tr><th>Evidence</th><th>Admissibility</th><th>Role</th><th>Source</th></tr></thead><tbody>{selectedVerificationEvidence.map((evidence) => <tr key={evidence.claimEvidenceLinkId || evidence.claim_evidence_link_id}><td>{ref(evidence.evidenceId || evidence.evidence_id)}</td><td>{ref(evidence.admissibilityDecision || evidence.admissibility_decision || "NOT_EVALUATED")}</td><td>{ref(evidence.evidenceRole || evidence.evidence_role)}</td><td>{ref(evidence.sourceAuthorityReference || evidence.source_authority_reference || evidence.evidenceAuthority || evidence.evidence_authority)}</td></tr>)}</tbody></table></div> : <p>No linked Evidence is available for this Verification.</p>}</Section>
      <Section title="Verification History"><LifecycleHistory items={selectedHistory} /></Section>
      <Section title="Verification Actions"><button type="button" onClick={() => verificationAction(startVerification)}>Start Verification</button><div style={{ display: "grid", gap: 8, maxWidth: 620, marginTop: 12 }}><label htmlFor="gpa-contradiction">Contradiction reference</label><input id="gpa-contradiction" value={contradictionText} onChange={(event) => setContradictionText(event.target.value)} placeholder="Source or evidence reference" /><button type="button" onClick={() => verificationAction((id) => addVerificationContradiction(id, { leftReference: contradictionText, rightReference: selected.claimId || selected.claim_id, contradictionType: "SOURCE_CONFLICT", severity: "HIGH", materiality: "BLOCKING" }))} disabled={!contradictionText.trim()}>Add blocking contradiction</button><label htmlFor="gpa-determination-rationale">Determination rationale</label><textarea id="gpa-determination-rationale" value={determination.rationale} onChange={(event) => setDetermination({ ...determination, rationale: event.target.value })} /><button type="button" onClick={() => verificationAction((id) => determineVerification(id, { result: { outcome: determination.result }, rationale: determination.rationale, achievedLevel: determination.achievedLevel || selected.requestedLevel || selected.requested_level, reviewerReference: selected.reviewerReference || selected.reviewer_reference }))}>Determine Verification</button></div></Section>
    </> : null}{actionMessage ? <p role="status" aria-live="polite">{actionMessage}</p> : null}</div></Section> : null}</> : null}
    {tab === "Assistant" || tab === "Reports" ? <div><GovernmentAssurancePhase8B dashboard={dashboard} /></div> : null}
    {tab === "Pilot Administration" ? <Section title="Pilot Configuration"><p className="gpa-note">Pilot configuration is organization and tenant scoped. Activation requires an explicit approved transition; this interface never treats external county acceptance as complete.</p>{(configurations?.items || []).length ? <div className="gpa-table-wrap"><table><caption className="sr-only">Configured pilots</caption><thead><tr><th>Name</th><th>Status</th><th>Programs</th><th>Providers</th><th>Effective</th></tr></thead><tbody>{configurations.items.map((item) => <tr key={item.pilot_configuration_id}><td>{item.pilot_name}</td><td>{item.status}</td><td>{item.program_references?.length || 0}</td><td>{item.provider_references?.length || 0}</td><td>{item.effective_from ? new Date(item.effective_from).toLocaleDateString() : "—"}</td></tr>)}</tbody></table></div> : <p>No pilot configuration is provisioned in this scope.</p>}</Section> : null}
    {tab === "Public" ? <Section title="Public-Safe Transparency"><p className="gpa-note">Only Truth facts explicitly approved for public disclosure appear here. Restricted, draft, and internal facts are excluded.</p>{publicItems.length ? <div className="gpa-table-wrap"><table><caption className="sr-only">Public approved assurance facts</caption><thead><tr><th>Fact</th><th>Type</th><th>Value</th><th>Verification</th><th>Accepted</th></tr></thead><tbody>{publicItems.map((item) => <tr key={item.truth_fact_id}><td>{item.subject_reference}</td><td>{item.fact_type}</td><td>{displayFactValue(item.fact_value)} {item.unit_value_type || ""}</td><td>{item.verification_level}</td><td>{new Date(item.accepted_at).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <p>No public-approved facts are available in the current scope.</p>}</Section> : null}
  </div>;
}
