import React, { useEffect, useState } from "react";
import CivicSureShell from "../../../apps/shf-web/src/components/civicsure/CivicSureShell.jsx";
import GovernmentAssurance from "../../../apps/shf-web/src/pages/operator/GovernmentAssurance.jsx";
import DgalNextStepsPanel from "../../components/DgalNextStepsPanel.jsx";

const API_BASE = import.meta.env.VITE_SHS_API_BASE || import.meta.env.VITE_API_BASE || "http://127.0.0.1:8091";

function routeState() {
  const raw = typeof window !== "undefined" && window.location.hash.startsWith("#/")
    ? window.location.hash.slice(1)
    : "/civicsure";
  return raw.split("?")[0];
}

function AudienceLink({ href, children }) {
  return <a className="civicsure-canonical-link" href={href}>{children}</a>;
}

function PublicTransparency() {
  const [state, setState] = useState({ loading: true, items: [], error: "" });

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/public/assurance/projections`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error?.message || "Public assurance data unavailable");
        return body?.data?.items || [];
      })
      .then((items) => { if (active) setState({ loading: false, items, error: "" }); })
      .catch((error) => { if (active) setState({ loading: false, items: [], error: error.message }); });
    return () => { active = false; };
  }, []);

  return <main className="civicsure-canonical-main">
    <header className="civicsure-canonical-header">
      <p className="civicsure-canonical-eyebrow">Public transparency</p>
      <h1>Published assurance records</h1>
      <p>See what was required, what was delivered, what evidence was verified, and what is approved for public reporting.</p>
    </header>
    <section className="civicsure-canonical-panel" aria-labelledby="methodology-title">
      <h2 id="methodology-title">How CivicSure works</h2>
      <p>Fund, deliver, verify, measure, detect, correct, decide, learn, and prove. Public views include only approved projections; protected cases, evidence, and participant information remain private.</p>
    </section>
    <section className="civicsure-canonical-panel" aria-labelledby="published-title">
      <h2 id="published-title">Published programs</h2>
      {state.loading ? <p role="status">Loading published assurance records...</p> : state.error ? <p role="alert">{state.error}</p> : state.items.length === 0 ? <p>No published assurance records are available.</p> : <ul className="civicsure-canonical-list">{state.items.map((item) => <li key={item.projectionId || item.publicReference || item.id}>{item.programName || item.programReference || item.publicReference || "Published assurance record"}<span>{item.status || "Published record"}</span></li>)}</ul>}
    </section>
    <p><AudienceLink href="/index.html#/civicsure">Back to CivicSure</AudienceLink></p>
  </main>;
}

function ProviderHome() {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [guidance, setGuidance] = useState({ loading: true, data: null, error: "" });
  const [message, setMessage] = useState("");
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [narrative, setNarrative] = useState("");
  const [evidenceReferences, setEvidenceReferences] = useState("");

  const load = () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    setGuidance((current) => ({ ...current, loading: true, error: "" }));
    fetch(`${API_BASE}/government-assurance/provider-workspace`, { credentials: "include" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error?.message || "Provider workspace unavailable");
        return body?.data;
      })
      .then((data) => setState({ loading: false, data, error: "" }))
      .catch((error) => setState({ loading: false, data: null, error: error.message }));
    fetch(`${API_BASE}/documentation/context/me?serviceKey=civicsure&workflowType=CIVICSURE_PROVIDER&workflowStage=PROVIDER_WORKSPACE`, { credentials: "include" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error?.message || "Guidance unavailable");
        return body?.data;
      })
      .then((data) => setGuidance({ loading: false, data, error: "" }))
      .catch((error) => setGuidance({ loading: false, data: null, error: error.message }));
  };

  useEffect(load, []);

  const submitResponse = async (event) => {
    event.preventDefault();
    if (!selectedFinding) return;
    setMessage("Submitting response...");
    const response = await fetch(`${API_BASE}/government-assurance/provider-workspace/findings/${encodeURIComponent(selectedFinding.finding_id)}/responses`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ narrative, evidenceReferences: evidenceReferences.split(",").map((item) => item.trim()).filter(Boolean) }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(body?.error?.message || "Response could not be submitted."); return; }
    setMessage("Response submitted for review."); setNarrative(""); setEvidenceReferences(""); setSelectedFinding(null); load();
  };

  const uploadEvidence = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData(); form.append("file", file);
    setMessage("Uploading evidence...");
    const response = await fetch(`${API_BASE}/government-assurance/provider-workspace/evidence`, { method: "POST", credentials: "include", body: form });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(body?.error?.message || "Evidence upload failed."); return; }
    const reference = body?.data?.asset?.source_asset_id;
    setEvidenceReferences((current) => [current, reference].filter(Boolean).join(", "));
    setMessage("Evidence received. Submit the reference with the provider response.");
  };

  return <main className="civicsure-canonical-main">
    <header className="civicsure-canonical-header">
      <p className="civicsure-canonical-eyebrow">Provider workspace</p>
      <h1>Provider assurance workspace</h1>
      <p>Review your organization&apos;s assigned requirements, submit evidence, and respond to findings. Verification and publication remain operator-controlled.</p>
    </header>
    {state.loading ? <p role="status">Loading your provider workspace...</p> : state.error ? <section className="civicsure-canonical-panel" role="alert"><h2>Provider workspace unavailable</h2><p>{state.error}</p><button type="button" onClick={load}>Retry</button></section> : <>
      <DgalNextStepsPanel state={guidance} onRetry={load} />
      <section className="civicsure-canonical-panel" aria-labelledby="provider-status-title"><h2 id="provider-status-title">Current status</h2><p>Provider: <strong>{state.data.providerReference}</strong></p><p>Assigned evidence requests: {state.data.items.evidenceRequests.length}. Findings: {state.data.items.findings.length}. Corrective actions: {state.data.items.correctiveActions.length}.</p><p role="status">You can submit provider-owned responses. You cannot verify outcomes, publish results, or trigger payment.</p></section>
      <section className="civicsure-canonical-panel" aria-labelledby="provider-requests-title"><h2 id="provider-requests-title">Evidence requests</h2>{state.data.items.evidenceRequests.length ? <ul className="civicsure-canonical-list">{state.data.items.evidenceRequests.map((item) => <li key={item.evidence_request_id}><strong>{item.evidence_type}</strong><span>{item.status} · {item.requirement_reference || "Requirement not specified"}</span></li>)}</ul> : <p>No evidence requests are assigned to your provider organization.</p>}</section>
      <section className="civicsure-canonical-panel" aria-labelledby="provider-findings-title"><h2 id="provider-findings-title">Findings and corrective actions</h2>{state.data.items.findings.length ? <ul className="civicsure-canonical-list">{state.data.items.findings.map((item) => <li key={item.finding_id}><strong>{item.finding_type} · {item.severity}</strong><span>{item.status} · {item.description}</span><button type="button" onClick={() => setSelectedFinding(item)}>Respond</button></li>)}</ul> : <p>No provider findings require a response.</p>}{state.data.items.correctiveActions.length ? <ul className="civicsure-canonical-list">{state.data.items.correctiveActions.map((item) => <li key={item.corrective_action_id}><strong>Corrective action</strong><span>{item.status} · {item.required_action}</span></li>)}</ul> : null}</section>
      {selectedFinding ? <section className="civicsure-canonical-panel" aria-labelledby="provider-response-title"><h2 id="provider-response-title">Respond to finding</h2><p>{selectedFinding.description}</p><form onSubmit={submitResponse}><label htmlFor="provider-narrative">Response</label><textarea id="provider-narrative" value={narrative} onChange={(event) => setNarrative(event.target.value)} required /><label htmlFor="provider-evidence">Evidence references</label><input id="provider-evidence" value={evidenceReferences} onChange={(event) => setEvidenceReferences(event.target.value)} placeholder="Uploaded evidence reference(s), comma separated" /><label htmlFor="provider-upload">Upload evidence</label><input id="provider-upload" type="file" onChange={uploadEvidence} /><div><button type="submit">Submit for review</button><button type="button" onClick={() => setSelectedFinding(null)}>Cancel</button></div></form>{message ? <p role="status">{message}</p> : null}</section> : null}
    </>}
    {!state.loading && !selectedFinding && message ? <p role="status">{message}</p> : null}
    <p><AudienceLink href="/index.html#/civicsure">Back to CivicSure</AudienceLink></p>
  </main>;
}

function CivicSureHome() {
  return <main className="civicsure-canonical-main">
    <header className="civicsure-canonical-header">
      <p className="civicsure-canonical-eyebrow">Government Program Assurance</p>
      <h1>CivicSure</h1>
      <p>Assurance infrastructure for public programs: connect obligations, service delivery, evidence, verification, correction, and public-safe reporting.</p>
    </header>
    <section className="civicsure-canonical-grid" aria-label="CivicSure audiences">
      <article className="civicsure-canonical-panel"><h2>Government and program operators</h2><p>Work assigned programs, providers, verification queues, findings, corrective actions, and evidence packets within authorized organization scope.</p><AudienceLink href="/index.html#/civicsure/operator">Open operator workspace</AudienceLink></article>
      <article className="civicsure-canonical-panel"><h2>Providers and businesses</h2><p>Use a provider workspace when your organization has an authorized CivicSure service configured.</p><AudienceLink href="/index.html#/civicsure/provider">Open provider workspace</AudienceLink></article>
      <article className="civicsure-canonical-panel"><h2>Public transparency</h2><p>Read approved, public-safe assurance projections and the methodology behind them.</p><AudienceLink href="/index.html#/civicsure/public">View public assurance</AudienceLink></article>
    </section>
    <section className="civicsure-canonical-panel civicsure-canonical-note"><h2>Authority boundaries</h2><p>CivicSure does not replace accounting or payment systems, and it does not make consequential eligibility or sanction decisions autonomously. Evidence, Truth, metrics, reporting, and publication remain separate governed authorities.</p></section>
  </main>;
}

function OperatorHome() {
  return <CivicSureShell><GovernmentAssurance /></CivicSureShell>;
}

export default function CivicSureApp() {
  const [route, setRoute] = useState(routeState);
  useEffect(() => { const update = () => setRoute(routeState()); window.addEventListener("hashchange", update); window.addEventListener("popstate", update); return () => { window.removeEventListener("hashchange", update); window.removeEventListener("popstate", update); }; }, []);
  if (route === "/civicsure/operator") return <OperatorHome />;
  if (route === "/civicsure/provider") return <ProviderHome />;
  if (route === "/civicsure/public") return <PublicTransparency />;
  return <CivicSureHome />;
}
