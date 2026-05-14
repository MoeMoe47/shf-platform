// src/components/credit/CreditHeader.jsx
import React from "react";
import { Link } from "react-router-dom";
import AppHeaderActions from "@/components/nav/AppHeaderActions.jsx";

export default function CreditHeader() {
  return (
    <header className="crb-header" role="banner">
      <Link to="/dashboard" className="crb-brand" aria-label="SHF Credit — Home">
        <img src="/logo-foundation.png" alt="" className="crb-brandImg" />
        <span className="crb-wordmark" aria-hidden>SHF CREDIT</span>
      </Link>

      <nav className="crb-crossapp" aria-label="Apps">
        <a className="sh-btn sh-btn--soft" href="/career.html#/dashboard">Career</a>
        <a className="sh-btn sh-btn--soft" href="/curriculum.html#/asl/dashboard">Curriculum</a>
        <a className="sh-btn sh-btn--soft" href="/sales.html#/sales/dashboard">Sales</a>
        <a className="sh-btn sh-btn--soft" href="/arcade.html#/dashboard">Arcade</a>
        <a className="sh-btn sh-btn--soft" href="/debt.html#/dashboard">Debt</a>
        <a className="sh-btn sh-btn--soft" href="/employer.html#/dashboard">Employer</a>
      </nav>

      <div className="crb-headerSpacer" />

      <AppHeaderActions />
    </header>
  );
}
