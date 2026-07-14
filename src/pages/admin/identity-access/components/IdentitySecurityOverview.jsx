import React from "react";

export default function IdentitySecurityOverview({ summary }) {
  const auth = summary.auth;
  const config = summary.readiness.configuration || {};
  const cards = [
    ["Session", auth.sessionStatus || "unknown"],
    ["Role", auth.role || "none"],
    ["Cookie", config.cookie_secure ? "Secure" : "Local HTTP"],
    ["Demo", config.demo_identity_enabled ? "Enabled" : "Disabled"],
  ];
  return (
    <section className="identityAccess-panel span-6">
      <div className="panel-heading"><p>Overview</p><h2>Authoritative Identity Boundary</h2></div>
      <div className="identityAccess-metricRow">
        {cards.map(([label, value]) => (
          <article key={label}><span>{label}</span><strong>{value}</strong></article>
        ))}
      </div>
      <p className="identityAccess-boundary">
        Browser roles, route fragments, and localStorage values are advisory only; protected SHS BOS access comes from the backend session summary.
      </p>
    </section>
  );
}

