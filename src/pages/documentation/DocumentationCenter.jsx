import React, { useEffect, useState } from "react";
import "./documentation-center.css";

const API = import.meta.env.VITE_SHS_API_BASE || "http://127.0.0.1:8080";
const statusClass = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

async function readCenter(service, status) {
  const query = new URLSearchParams();
  if (service) query.set("service", service);
  if (status) query.set("status", status);
  const response = await fetch(`${API}/documentation/me${query}`, { credentials: "include" });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) throw new Error(payload.error?.message || "Document Center is unavailable.");
  return payload.data || payload;
}

export default function DocumentationCenter() {
  const [service, setService] = useState("");
  const [status, setStatus] = useState("");
  const [reload, setReload] = useState(0);
  const [state, setState] = useState({ loading: true, error: null, data: null });
  useEffect(() => { let active = true; setState({ loading: true, error: null, data: null }); readCenter(service, status).then((data) => active && setState({ loading: false, error: null, data })).catch((error) => active && setState({ loading: false, error: error.message, data: null })); return () => { active = false; }; }, [service, status, reload]);
  const items = state.data?.items || [];
  return (
    <main className="dgal-center" aria-labelledby="dgal-center-title">
      <header className="dgal-center__header">
        <div><p className="dgal-eyebrow">Institutional workspace</p><h1 id="dgal-center-title">Document Center</h1><p>Required actions, waiting work, and authorized document history in one place.</p></div>
        <div className="dgal-center__filters"><label className="dgal-center__filter">Service<select value={service} onChange={(event) => setService(event.target.value)}><option value="">All services</option><option value="civicsure">CivicSure</option><option value="studio">Studio</option><option value="organization-onboarding">Organization onboarding</option><option value="curriculum">Curriculum</option></select></label><label className="dgal-center__filter">View<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All activity</option><option value="REQUIRED_NOW">Required now</option><option value="WAITING_ON_SOMEONE_ELSE">Waiting</option><option value="BLOCKED">Needs attention</option><option value="COMPLETED">Completed</option><option value="REFERENCE">Reference</option><option value="ARCHIVED">Archived</option></select></label></div>
      </header>
      {state.loading ? <p role="status">Loading your document workspace...</p> : null}
      {state.error ? <div role="alert" className="dgal-center__message"><strong>Document Center unavailable.</strong><span>{state.error}</span><button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div> : null}
      {!state.loading && !state.error && state.data?.status === "SOURCE_UNAVAILABLE" ? <div role="alert" className="dgal-center__message"><strong>Some document information could not be loaded.</strong><span>Required work may be unavailable until the source responds.</span><button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div> : null}
      {!state.loading && !state.error && state.data?.status === "PARTIAL" ? <p role="status" className="dgal-center__partial">Some document information is unavailable. The items shown below may be incomplete.</p> : null}
      {!state.loading && !state.error && !items.length ? <p role="status" className="dgal-center__empty">{status || service ? "No items match the selected filters." : "No current document actions are required."}</p> : null}
      {!state.loading && !state.error && items.length ? <section aria-labelledby="dgal-center-items-title"><h2 id="dgal-center-items-title">Your document activity</h2><ul className="dgal-center__list">{items.map((item) => <li key={item.id} className="dgal-center__item"><div><p className={`dgal-center__status dgal-center__status--${statusClass(item.status)}`}>{item.status}</p><h3>{item.title}</h3><p>{item.kind} {item.service ? `· ${item.service}` : ""} {item.source ? `· ${item.source}` : ""}</p>{item.owner ? <p>Next step owner: <strong>{item.owner}</strong></p> : null}</div>{item.actionTarget?.route ? <a href={item.actionTarget.route}>Open</a> : null}</li>)}</ul></section> : null}
    </main>
  );
}
