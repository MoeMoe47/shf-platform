import React from "react";
import { Link } from "react-router-dom";
import AppHeaderActions from "@/components/nav/AppHeaderActions.jsx";
import CrossAppLink from "@/components/nav/CrossAppLink.jsx";

/**
 * Career header
 * - Left: brand link to /dashboard
 * - Right: Marketplace link + <AppHeaderActions /> (wallet, Rewards, Credit, Debt, etc.)
 * - Uses career-scoped classes (styles/career-shell.css)
 */
export default function CareerHeader() {
  return (
    <header className="car-header" role="banner">
      <Link to="/dashboard" className="car-brand" aria-label="Career — Home">
        <img src="/logo-foundation.png" alt="" className="car-brandImg" />
        <span className="car-wordmark" aria-hidden>CAREER</span>
      </Link>

      <div className="car-headerSpacer" style={{ flex: 1 }} />

      <div className="car-headerActions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CrossAppLink app="store" to="/marketplace?method=credits" className="btn">
          Marketplace
        </CrossAppLink>
        <AppHeaderActions />
      </div>
    </header>
  );
}
