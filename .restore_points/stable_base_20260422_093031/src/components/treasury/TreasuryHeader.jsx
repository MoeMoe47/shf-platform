// src/components/treasury/TreasuryHeader.jsx
import React from "react";
import CrossAppLink from "@/components/nav/CrossAppLink.jsx";

export default function TreasuryHeader() {
  return (
    <>
      {/* Brand / Home */}
      <a className="crb-brand" href="/treasury.html#/" aria-label="SHF Treasury — Home">
        <img src="/logo-foundation.png" alt="" className="crb-brandImg" />
        <span className="crb-wordmark" aria-hidden>SHF TREASURY</span>
      </a>

      {/* Cross-app cluster */}
      <nav className="crb-crossapp" aria-label="Apps">
        <CrossAppLink className="sh-btn sh-btn--soft" app="career"     to="/dashboard">Career</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="curriculum" to="/asl/dashboard">Curriculum</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="credit"     to="/report">Credit</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="debt"       to="/dashboard">Debt</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="sales"      to="/sales/dashboard">Sales</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="arcade"     to="/dashboard">Arcade</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="employer"   to="/dashboard">Employer</CrossAppLink>
      </nav>

      <div className="crb-headerSpacer" />

      {/* Right cluster (kept inline to avoid extra deps) */}
      <div className="crb-actions" role="group" aria-label="Header actions" style={{display:'flex',gap:8}}>
        <a className="sh-btn sh-btn--soft" href="/foundation.html#/">Foundation</a>
        <a className="sh-btn sh-btn--soft" href="/solutions.html#/">Solutions</a>
        <a className="sh-btn" href="/treasury.html#/help" aria-label="Help">❓ Help</a>
      </div>
    </>
  );
}
