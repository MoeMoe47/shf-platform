import React, { useEffect, useMemo, useState } from "react";
import LifecycleHistory from "./components/LifecycleHistory.jsx";
import {
  getMonitoringPlan, getMonitoringPlanHistory, getMonitoringActivity, getMonitoringActivityHistory,
  getEvidenceRequest, getEvidenceRequestHistory, getFinding, getFindingHistory, determineFinding,
  getProviderResponse, getProviderResponseHistory, getCorrectiveAction, getCorrectiveActionHistory,
  retestCorrectiveAction,
} from "../../services/government-assurance-client";

const loaders = {
  plan: [getMonitoringPlan, getMonitoringPlanHistory, "Monitoring Plan"],
  activity: [getMonitoringActivity, getMonitoringActivityHistory, "Monitoring Activity"],
  "evidence-request": [getEvidenceRequest, getEvidenceRequestHistory, "Evidence Request"],
  finding: [getFinding, getFindingHistory, "Finding"],
  "provider-response": [getProviderResponse, getProviderResponseHistory, "Provider Response"],
  "corrective-action": [getCorrectiveAction, getCorrectiveActionHistory, "Corrective Action"],
};

function value(input) {
  if (input == null || input === "") return "—";
  if (typeof input === "object") return JSON.stringify(input);
  return String(input);
}

function Field({ name, value: fieldValue }) {
  return <div><dt>{name}</dt><dd>{value(fieldValue)}</dd></div>;
}

function DetailFields({ record }) {
  const entries = Object.entries(record || {}).filter(([key]) => !["provenance", "scope"].includes(key));
  return <dl>{entries.slice(0, 24).map(([key, fieldValue]) => <Field key={key} name={key.replaceAll("_", " ")} value={fieldValue} />)}</dl>;
}

export default function GovernmentAssuranceMonitoringDetail({ kind, id, queue, onNavigate }) {
  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [findingStatus, setFindingStatus] = useState("CONFIRMED");
  const [retestResult, setRetestResult] = useState("PASS");

  const config = loaders[kind];
  const title = config?.[2] || "Monitoring Record";

  async function reload() {
    if (!config || !id) return;
    setLoading(true); setError("");
    try {
      const [next, events] = await Promise.all([config[0](id), config[1](id)]);
      if (!next) throw new Error(`${title} was not found in the current organization and tenant scope.`);
      setRecord(next); setHistory(events?.items || events || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load the canonical monitoring record.");
    } finally { setLoading(false); }
  }

  useEffect(() => { reload(); }, [kind, id]);

  const related = useMemo(() => {
    const rows = queue || {};
    if (kind === "plan") return { activities: (rows.activities || []).filter((row) => row.monitoring_plan_id === id) };
    if (kind === "activity") return { evidenceRequests: (rows.evidenceRequests || []).filter((row) => row.monitoring_reference === id) };
    if (kind === "evidence-request") return { findings: (rows.findings || []).filter((row) => JSON.stringify(row.evidence_references || []).includes(id)) };
    if (kind === "finding") return {
      responses: (rows.providerResponses || []).filter((row) => row.finding_id === id),
      actions: (rows.correctiveActions || []).filter((row) => row.finding_id === id),
    };
    if (kind === "corrective-action") return { finding: (rows.findings || []).find((row) => row.finding_id === record?.finding_id) };
    return {};
  }, [kind, id, queue, record]);

  async function action(fn, success) {
    setActionMessage("Saving canonical state…");
    try { await fn(); await reload(); setActionMessage(success); }
    catch (actionError) { setActionMessage(actionError.message || "The canonical action was rejected."); }
  }

  if (loading) return <section aria-labelledby="monitoring-detail-title"><h2 id="monitoring-detail-title">{title}</h2><p role="status">Loading canonical {title.toLowerCase()}…</p></section>;
  if (error) return <section aria-labelledby="monitoring-detail-title"><h2 id="monitoring-detail-title">{title}</h2><div role="alert">{error}</div><button type="button" onClick={reload}>Retry</button></section>;
  if (!record) return <section aria-labelledby="monitoring-detail-title"><h2 id="monitoring-detail-title">{title}</h2><p>No canonical record is available.</p></section>;

  return <section aria-labelledby="monitoring-detail-title" data-testid="gpa-monitoring-detail">
    <h2 id="monitoring-detail-title">{title}: {value(record.monitoring_plan_id || record.activity_id || record.evidence_request_id || record.finding_id || record.response_id || record.corrective_action_id)}</h2>
    <DetailFields record={record} />
    {kind === "plan" && related.activities.length ? <section><h3>Activities</h3><ul>{related.activities.map((row) => <li key={row.activity_id}><a href={`#/operator/government-assurance/monitoring/activities/${encodeURIComponent(row.activity_id)}`} onClick={() => onNavigate?.("activity", row.activity_id)}>{row.activity_id}</a> <span>{value(row.status)}</span></li>)}</ul></section> : null}
    {kind === "activity" && related.evidenceRequests.length ? <section><h3>Evidence Requests</h3><ul>{related.evidenceRequests.map((row) => <li key={row.evidence_request_id}><a href={`#/operator/government-assurance/monitoring/evidence-requests/${encodeURIComponent(row.evidence_request_id)}`} onClick={() => onNavigate?.("evidence-request", row.evidence_request_id)}>{row.evidence_request_id}</a> <span>{value(row.status)}</span></li>)}</ul></section> : null}
    {kind === "evidence-request" && related.findings.length ? <section><h3>Findings</h3><ul>{related.findings.map((row) => <li key={row.finding_id}><a href={`#/operator/government-assurance/findings/${encodeURIComponent(row.finding_id)}`} onClick={() => onNavigate?.("finding", row.finding_id)}>{row.finding_id}</a> <span>{value(row.status)}</span></li>)}</ul></section> : null}
    {kind === "finding" ? <>
      <section><h3>Provider Responses</h3>{related.responses.length ? <ul>{related.responses.map((row) => <li key={row.response_id}><a href={`#/operator/government-assurance/monitoring/provider-responses/${encodeURIComponent(row.response_id)}`} onClick={() => onNavigate?.("provider-response", row.response_id)}>{row.response_id}</a> <span>{value(row.status)}</span></li>)}</ul> : <p>No provider response is recorded.</p>}</section>
      <section><h3>Corrective Actions</h3>{related.actions.length ? <ul>{related.actions.map((row) => <li key={row.corrective_action_id}><a href={`#/operator/government-assurance/corrective-actions/${encodeURIComponent(row.corrective_action_id)}`} onClick={() => onNavigate?.("corrective-action", row.corrective_action_id)}>{row.corrective_action_id}</a> <span>{value(row.status)}</span></li>)}</ul> : <p>No corrective action is recorded.</p>}</section>
      <section><h3>Finding Action</h3><label htmlFor="gpa-finding-status">Canonical status</label><select id="gpa-finding-status" value={findingStatus} onChange={(event) => setFindingStatus(event.target.value)}><option value="CONFIRMED">Confirmed</option><option value="RESOLVED">Resolved</option><option value="WITHDRAWN">Withdrawn</option></select><button type="button" onClick={() => action(() => determineFinding(id, { status: findingStatus }), "Finding state reloaded from the canonical service.")}>Determine Finding</button></section>
    </> : null}
    {kind === "corrective-action" ? <section><h3>Retest</h3><p>Completion is controlled by the canonical retest service; provider completion alone does not resolve the Finding.</p><label htmlFor="gpa-retest-result">Retest result</label><select id="gpa-retest-result" value={retestResult} onChange={(event) => setRetestResult(event.target.value)}><option value="PASS">Pass</option><option value="FAIL">Fail</option></select><button type="button" onClick={() => action(() => retestCorrectiveAction(id, { result: retestResult, evidenceReferences: ["phase8_evidence_a"] }), "Retest result persisted and canonical state reloaded.")}>Record Retest</button></section> : null}
    {kind === "provider-response" && record.finding_id ? <p><a href={`#/operator/government-assurance/findings/${encodeURIComponent(record.finding_id)}`}>Back to Finding {record.finding_id}</a></p> : null}
    {kind === "corrective-action" && record.finding_id ? <p><a href={`#/operator/government-assurance/findings/${encodeURIComponent(record.finding_id)}`}>Back to Finding {record.finding_id}</a></p> : null}
    <section><h3>Lifecycle History</h3><LifecycleHistory items={history} /></section>
    {actionMessage ? <p role="status" aria-live="polite">{actionMessage}</p> : null}
  </section>;
}
