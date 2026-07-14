import React from "react";

const threats = [
  "localStorage role tampering",
  "client_admin privilege escalation",
  "direct internal route navigation",
  "CSRF on cookie writes",
  "revoked session reuse",
  "demo identity in production",
];

export default function IdentityThreatModelPanel() {
  return (
    <section className="identityAccess-panel span-6">
      <div className="panel-heading"><p>Threat Model</p><h2>Covered Controls</h2></div>
      <div className="identityAccess-flagGrid">
        {threats.map((threat) => <span key={threat}>{threat}: guarded</span>)}
      </div>
    </section>
  );
}

