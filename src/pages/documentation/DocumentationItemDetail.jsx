import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./documentation-center.css";

const API = import.meta.env.VITE_SHS_API_BASE || "http://127.0.0.1:8080";

export default function DocumentationItemDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, error: null, item: null });
  useEffect(() => {
    let active = true;
    setState({ loading: true, error: null, item: null });
    fetch(`${API}/documentation/items/${encodeURIComponent(id || "")}`, { credentials: "include" })
      .then(async (response) => { const payload = await response.json(); if (!response.ok || payload.ok === false) throw new Error(payload.error?.message || "This document item is unavailable."); return payload.data || payload; })
      .then((item) => active && setState({ loading: false, error: null, item }))
      .catch((error) => active && setState({ loading: false, error: error.message, item: null }));
    return () => { active = false; };
  }, [id]);
  return <main className="dgal-center" aria-labelledby="dgal-item-title"><p><Link to="/documentation">Back to Document Center</Link></p>{state.loading ? <p role="status">Loading document item...</p> : null}{state.error ? <div role="alert" className="dgal-center__message"><strong>This document item is unavailable.</strong><span>{state.error}</span></div> : null}{state.item ? <><header className="dgal-center__detail-header"><p className="dgal-eyebrow">{state.item.kind} · {state.item.source || "DGAL"}</p><h1 id="dgal-item-title">{state.item.title}</h1><p>{state.item.status}</p></header><dl className="dgal-center__detail-list"><dt>Service</dt><dd>{state.item.service || "Organization workspace"}</dd><dt>Next step owner</dt><dd>{state.item.owner || "Not available"}</dd><dt>Version</dt><dd>{state.item.version || "Not available"}</dd><dt>Classification</dt><dd>{state.item.classification || "Restricted"}</dd></dl>{state.item.category === "ARCHIVED" || state.item.category === "REFERENCE" ? <p role="status" className="dgal-center__message">This item is historical or reference material. It is not a current action.</p> : null}</> : null}</main>;
}
