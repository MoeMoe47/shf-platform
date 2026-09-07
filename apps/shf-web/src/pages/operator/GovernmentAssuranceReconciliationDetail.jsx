import React, { useEffect, useMemo, useState } from "react";
import LifecycleHistory from "./components/LifecycleHistory.jsx";
import { getReconciliationCase, getReconciliationHistory, determineReconciliation, getEntityResolutionCases, determineEntityResolution, getQualityRules, getQualityEvaluations, getQualityReadiness, getDuplicateCandidates } from "../../services/government-assurance-client";

const text = (value) => value == null || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);
const key = (row, camel, snake = camel) => row?.[camel] ?? row?.[snake];
function Panel({ title, children }) { return <section className="gpa-rq-panel"><h2>{title}</h2>{children}</section>; }
function Table({ caption, headers, rows }) { return <div className="gpa-table-wrap"><table><caption className="sr-only">{caption}</caption><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.length ? rows : <tr><td colSpan={headers.length}>No canonical records are available.</td></tr>}</tbody></table></div>; }

export default function GovernmentAssuranceReconciliationDetail({ id }) {
  const [state, setState] = useState({ loading: true, error: "", case: null, history: [], entities: [], rules: [], evaluations: [], readiness: null, duplicates: [] });
  const [message, setMessage] = useState("");
  const [determination, setDetermination] = useState("BOTH_DIFFERENT_SEMANTICS");
  const [rationale, setRationale] = useState("");
  const [entityStatus, setEntityStatus] = useState("MATCHED");
  async function load() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const current = await getReconciliationCase(id);
      if (!current) throw new Error("Reconciliation case was not found in the current organization and tenant scope.");
      const subjectReference = key(current, "subjectReference", "subject_reference");
      const [history, entities, rules, evaluations, readiness, duplicates] = await Promise.all([getReconciliationHistory(id), getEntityResolutionCases(), getQualityRules(), getQualityEvaluations(), getQualityReadiness({ subjectReference }), getDuplicateCandidates()]);
      setState({ loading: false, error: "", case: current, history: history?.items || history || [], entities: entities?.items || entities || [], rules: rules?.items || rules || [], evaluations: evaluations?.items || evaluations || [], readiness, duplicates: duplicates?.items || duplicates || [] });
    } catch (error) { setState((current) => ({ ...current, loading: false, error: error.message })); }
  }
  useEffect(() => { load(); }, [id]);
  const current = state.case;
  const sourceRefs = current ? (key(current, "competingSourceReferences", "competing_source_references") || []) : [];
  const authorityRefs = current ? (key(current, "sourceAuthorityReferences", "source_authority_references") || []) : [];
  const relevantEntities = useMemo(() => state.entities.filter((item) => !current || sourceRefs.includes(key(item, "sourceSystemId", "source_system_id") || "") || key(item, "sourceRecordId", "source_record_id") === key(current, "subjectReference", "subject_reference")), [state.entities, current, sourceRefs]);
  const relevantDuplicates = useMemo(() => state.duplicates.filter((item) => key(item, "reconciliationCaseId", "reconciliation_case_id") === id), [state.duplicates, id]);
  async function determine() {
    try { setMessage("Saving canonical reconciliation determination…"); await determineReconciliation(id, { status: "RESOLVED", determination, rationale, reviewerReference: "independent-reviewer", authorityReference: "oversight-authority", resolutionMethod: "HUMAN_REVIEW" }); await load(); setMessage("Canonical determination saved."); } catch (error) { setMessage(error.message); }
  }
  async function determineEntity(resolutionId) {
    try { setMessage("Saving canonical entity-resolution determination…"); await determineEntityResolution(resolutionId, { status: entityStatus, determination: { outcome: entityStatus, rationale: "Controlled review" }, reviewerReference: "independent-reviewer" }); await load(); setMessage("Entity-resolution determination saved."); } catch (error) { setMessage(error.message); }
  }
  if (state.loading) return <section><h1>Reconciliation case</h1><p role="status">Loading canonical reconciliation data…</p></section>;
  if (state.error) return <section><h1>Reconciliation case</h1><div role="alert">{state.error}</div><button type="button" onClick={load}>Retry</button></section>;
  if (!current) return <section><h1>Reconciliation case</h1><p>Not found.</p></section>;
  return <div className="gpa-rq-detail">
    <h1>Reconciliation {text(key(current, "reconciliationCaseId", "reconciliation_case_id"))}</h1>
    <p className="gpa-note">Competing records are preserved. This view displays canonical evidence and policy context; it never selects a winner in the browser.</p>
    <Panel title="Case"><dl><div><dt>Conflict type</dt><dd>{text(key(current, "conflictType", "conflict_type"))}</dd></div><div><dt>Subject</dt><dd>{text(key(current, "subjectType", "subject_type"))} / {text(key(current, "subjectReference", "subject_reference"))}</dd></div><div><dt>Severity</dt><dd>{text(current.severity)}</dd></div><div><dt>Materiality</dt><dd>{text(current.materiality)}</dd></div><div><dt>Status</dt><dd>{text(current.status)}</dd></div><div><dt>Reviewer</dt><dd>{text(key(current, "assignedReviewer", "assigned_reviewer"))}</dd></div><div><dt>Reason</dt><dd>{text(key(current, "conflictReason", "conflict_reason"))}</dd></div><div><dt>Provenance</dt><dd>{text(key(current, "provenance", "provenance"))}</dd></div></dl></Panel>
    <Panel title="Source A / Source B comparison"><Table caption="Competing source references" headers={["Side", "Source/record reference", "Authority reference", "Precedence", "Value", "Period", "Freshness / quality"]} rows={sourceRefs.map((source, index) => { const record = (key(current, "metadata", "metadata") || {}).sourceRecords?.[source] || {}; return <tr key={source + index}><td>Source {index ? "B" : "A"}</td><td>{text(source)}</td><td>{text(authorityRefs[index])}</td><td>{text((key(current, "currentAuthorityRanking", "current_authority_ranking") || {})[source])}</td><td>{text(record.value)}</td><td>{text(record.period)}</td><td>{text(record.freshness)} / {text(record.quality)}</td></tr>; })}/></Panel>
    <Panel title="Source Authority comparison"><Table caption="Source authority references" headers={["Authority", "Role / policy", "Conflict handling"]} rows={authorityRefs.map((authority, index) => <tr key={authority + index}><td>{text(authority)}</td><td>Canonical Source Authority {index + 1}</td><td>Determination remains backend-governed</td></tr>)}/></Panel>
    <Panel title="Entity Resolution"><Table caption="Entity resolution cases" headers={["Resolution", "Entity", "Method", "Candidates", "Status", "Action"]} rows={relevantEntities.map((item) => { const resolutionId = key(item, "resolutionId", "resolution_id"); return <tr key={resolutionId}><td>{text(resolutionId)}</td><td>{text(item.entityType || item.entity_type)}</td><td>{text(item.matchMethod || item.match_method)}</td><td>{text(item.candidateEntityReferences || item.candidate_entity_references)}</td><td>{text(item.status)}</td><td><label>Outcome<select aria-label={"Entity resolution outcome " + resolutionId} value={entityStatus} onChange={(event) => setEntityStatus(event.target.value)}><option>MATCHED</option><option>AMBIGUOUS</option><option>REJECTED</option></select></label><button type="button" onClick={() => determineEntity(resolutionId)}>Determine</button></td></tr>; })}/></Panel>
    <Panel title="Data Quality by dimension"><Table caption="Data quality evaluations" headers={["Dimension", "State", "Rule", "Reason", "Evaluated"]} rows={state.evaluations.map((item) => <tr key={key(item, "qualityEvaluationId", "quality_evaluation_id")}><td>{text(item.dimension)}</td><td>{text(item.state)}</td><td>{text(item.ruleId || item.rule_id)} v{text(item.ruleVersion || item.rule_version)}</td><td>{text(item.reasonCodes || item.reason_codes)}</td><td>{text(item.evaluatedAt || item.evaluated_at)}</td></tr>)}/></Panel>
    <Panel title="Data Quality Rules"><Table caption="Applicable quality rules" headers={["Rule", "Version", "Dimension", "Source/domain", "Severity", "Effective", "Logic"]} rows={state.rules.map((item) => <tr key={key(item, "ruleId", "rule_id") + String(item.version)}><td>{text(key(item, "ruleId", "rule_id"))}</td><td>{text(item.version)}</td><td>{text(item.dimension)}</td><td>{text(item.sourceSystemId || item.source_system_id)} / {text(item.dataDomain || item.data_domain)}</td><td>{text(item.severity)}</td><td>{text(item.effectiveFrom || item.effective_from)}</td><td>{text(item.logicReference || item.logic_reference)}</td></tr>)}/></Panel>
    <Panel title="Readiness impact"><p role="status">{state.readiness?.ready ? "No critical quality blockers are recorded." : "Downstream assurance readiness is blocked by canonical quality conditions."}</p>{state.readiness?.blockers?.length ? <ul>{state.readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul> : null}</Panel>
    <Panel title="Duplicate candidates"><p className="gpa-note">A duplicate candidate is not a fraud determination.</p><Table caption="Duplicate candidates" headers={["Candidate", "References", "Classification", "Reconciliation"]} rows={relevantDuplicates.map((item) => <tr key={key(item, "duplicateCandidateId", "duplicate_candidate_id")}><td>{text(key(item, "duplicateCandidateId", "duplicate_candidate_id"))}</td><td>{text(item.leftReference || item.left_reference)} / {text(item.rightReference || item.right_reference)}</td><td>{text(item.classification)}</td><td>{text(item.reconciliationCaseId || item.reconciliation_case_id)}</td></tr>)}/></Panel>
    <Panel title="Downstream impact"><p>{text(key(current, "downstreamImpactReferences", "downstream_impact_references"))}</p><p className="gpa-note">Affected Claims, Verifications, Metrics, Truth, Provider Assurance, and Program Assurance remain read-only from this review.</p></Panel>
    <Panel title="Determination"><div className="gpa-rq-actions"><label>Outcome<select value={determination} onChange={(event) => setDetermination(event.target.value)}><option>BOTH_DIFFERENT_SEMANTICS</option><option>ACCEPT_SOURCE_A</option><option>ACCEPT_SOURCE_B</option><option>REQUIRE_ADDITIONAL_EVIDENCE</option><option>UNRESOLVED</option></select></label><label>Rationale<textarea value={rationale} onChange={(event) => setRationale(event.target.value)} /></label><button type="button" onClick={determine}>Determine case</button></div>{message ? <p role="status" aria-live="polite">{message}</p> : null}</Panel>
    <Panel title="Lifecycle history"><LifecycleHistory items={state.history} /></Panel>
  </div>;
}
