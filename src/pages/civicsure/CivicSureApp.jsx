import React, { useEffect, useState } from "react";
import CivicSureShell from "../../../apps/shf-web/src/components/civicsure/CivicSureShell.jsx";
import GovernmentAssurance from "../../../apps/shf-web/src/pages/operator/GovernmentAssurance.jsx";

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
  return <main className="civicsure-canonical-main">
    <header className="civicsure-canonical-header">
      <p className="civicsure-canonical-eyebrow">Provider workspace</p>
      <h1>Provider assurance workspace</h1>
      <p>Review your organization&apos;s program participation, obligations, evidence status, and requested corrections when those services are configured for your account.</p>
    </header>
    <section className="civicsure-canonical-panel" role="status">
      <h2>Provider self-service is not configured</h2>
      <p>This deployment does not expose a canonical provider workspace API. No provider, obligation, evidence, or verification data is shown until an authorized provider service is configured.</p>
    </section>
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
