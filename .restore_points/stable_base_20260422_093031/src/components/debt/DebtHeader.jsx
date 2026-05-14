import React from "react";
import CrossAppLink from "@/components/nav/CrossAppLink.jsx";

export default function DebtHeader() {
  return (
    <>
      <a className="crb-brand" href="/debt.html#/" aria-label="Debt — Home">
        <img src="/logo-foundation.png" alt="" className="crb-brandImg" />
        <span className="crb-wordmark" aria-hidden>DEBT</span>
      </a>

      {/* Cross-app quick links */}
      <nav className="crb-crossapp" aria-label="Apps">
        <CrossAppLink className="sh-btn sh-btn--soft" app="credit"   to="/report">Credit</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="treasury" to="/dashboard">Treasury</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="career"   to="/dashboard">Career</CrossAppLink>
      </nav>

      <div className="crb-headerSpacer" />

      <div className="crb-actions" role="group" aria-label="Header actions" style={{display:'flex',gap:8}}>
        <a className="sh-btn sh-btn--soft" href="/foundation.html#/">Foundation</a>
        <a className="sh-btn" href="/debt.html#/help" aria-label="Help">❓ Help</a>
      </div>
    </>
  );
}
