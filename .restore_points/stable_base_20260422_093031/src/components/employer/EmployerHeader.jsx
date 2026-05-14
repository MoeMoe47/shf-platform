import React from "react";
import CrossAppLink from "@/components/nav/CrossAppLink.jsx";

export default function EmployerHeader() {
  return (
    <>
      {/* Brand / Home */}
      <a className="crb-brand" href="/employer.html#/" aria-label="Employer — Home">
        <img src="/logo-foundation.png" alt="" className="crb-brandImg" />
        <span className="crb-wordmark" aria-hidden>EMPLOYER</span>
      </a>

      {/* Cross-app cluster */}
      <nav className="crb-crossapp" aria-label="Apps">
        <CrossAppLink className="sh-btn sh-btn--soft" app="career"   to="/dashboard">Career</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="treasury" to="/dashboard">Treasury</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="credit"   to="/report">Credit</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="debt"     to="/dashboard">Debt</CrossAppLink>
      </nav>

      <div className="crb-headerSpacer" />

      {/* Right cluster */}
      <div className="crb-actions" role="group" aria-label="Header actions" style={{display:'flex',gap:8}}>
        <a className="sh-btn sh-btn--soft" href="/foundation.html#/">Foundation</a>
        <a className="sh-btn sh-btn--soft" href="/solutions.html#/">Solutions</a>
        <a className="sh-btn" href="/employer.html#/help" aria-label="Help">❓ Help</a>
      </div>
    </>
  );
}
