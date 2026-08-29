import React, { useEffect, useState } from "react";
import { SHS_AUTH_API_BASE } from "../../system/identity/authConfig.js";
import { useAuthContext } from "../../auth/auth-context.jsx";

const PROGRAM_ID = "data-center-specialization-11";

export default function Grade12EntryGate() {
  const auth = useAuthContext();
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  useEffect(() => {
    if (!auth.isAuthenticated) return;
    let alive = true;
    fetch(`${SHS_AUTH_API_BASE}/programs/${PROGRAM_ID}/grade12-entry`, { credentials: "include", cache: "no-store" })
      .then(async (response) => { const body = await response.json(); if (!response.ok) { const error = new Error(body?.error?.code || "Grade 12 requirements incomplete"); error.data = body.data; throw error; } return body.data; })
      .then((data) => alive && setState({ loading: false, data, error: "" }))
      .catch((error) => alive && setState({ loading: false, data: error.data || null, error: error.message }))
    return () => { alive = false; };
  }, [auth.isAuthenticated]);

  if (!auth.isAuthenticated) return <p role="status">Sign in to check Grade 12 eligibility.</p>;
  if (state.loading) return <p role="status">Checking Grade 12 requirements...</p>;
  const eligible = state.data?.eligible === true;
  return (
    <main aria-labelledby="grade12-gate-heading">
      <p className="ld-eyebrow">Grade 12 progression gate</p>
      <h1 id="grade12-gate-heading">{eligible ? "Grade 12 entry verified" : "Grade 12 requirements incomplete"}</h1>
      <p>{eligible ? "Your Grade 11 requirements meet the current progression policy. The Technical Operations reference slice is available through an authorized Grade 12 course assignment; the integrated capstone is not yet active." : "Complete the remaining Grade 11 requirements before Grade 12 advanced work can open."}</p>
      <p>Policy version: <strong>{state.data?.policy_version || "grade12-entry-v1"}</strong></p>
      {!eligible && <ul>{(state.data?.missing_requirements || []).map((item) => <li key={`${item.code}-${item.detail || ""}`}>{item.label}{item.detail ? `: ${item.detail}` : ""}</li>)}</ul>}
    </main>
  );
}
