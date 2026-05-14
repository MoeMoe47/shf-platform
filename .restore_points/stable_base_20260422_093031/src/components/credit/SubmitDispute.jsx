// src/pages/credit/SubmitDispute.jsx
import React from "react";
export default function SubmitDispute() {
  return (
    <div className="page pad card card--pad">
      <h1 style={{ marginTop:0 }}>Submit a Dispute</h1>
      <p className="ink-soft">Minimal placeholder: a form would live here.</p>
      <label className="sh-label">Reason</label>
      <input className="sh-input" placeholder="Describe the inaccuracy…" />
      <div style={{ marginTop:10 }}>
        <button className="sh-btn">Submit</button>
      </div>
    </div>
  );
}
