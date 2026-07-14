import React from "react";

export default function IdentitySafetyPanel({ reviewed, onReview }) {
  return (
    <section className="identityAccess-panel span-3">
      <div className="panel-heading"><p>Safety</p><h2>Boundaries</h2></div>
      <div className="identityAccess-flagGrid">
        <span>No OAuth vendor</span>
        <span>No tokens in localStorage</span>
        <span>No public approval mutation</span>
        <span>No SHF Impact mutation</span>
      </div>
      <button type="button" onClick={onReview}>{reviewed ? "Reviewed locally" : "Mark reviewed locally"}</button>
    </section>
  );
}

