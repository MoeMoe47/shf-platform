// src/pages/credit/Disputes.jsx
import React from "react";
export default function Disputes() {
  return (
    <div className="page pad card card--pad">
      <h1 style={{ marginTop:0 }}>Disputes</h1>
      <p className="ink-soft">Track dispute status and SLAs. Submit a new dispute from here.</p>
      <a className="sh-btn" href="#/disputes/new">Submit Dispute</a>
    </div>
  );
}
