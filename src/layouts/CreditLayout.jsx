// src/router/CreditLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import CreditHeader from "@/components/credit/CreditHeader.jsx";
import CreditSidebar from "@/components/credit/CreditSidebar.jsx";

/**
 * Credit app shell
 * Uses the existing CSS in src/styles/credit-shell.css (crb-* classes)
 */
export default function CreditLayout() {
  return (
    <div className="crb-root" data-app="credit" data-theme="solutions">
      <a href="#credit-main" className="crb-skip">Skip to main content</a>

      <header className="crb-header" role="banner">
        <CreditHeader />
        <div className="crb-headerSpacer" />
      </header>

      <div className="crb-body">
        <aside className="crb-sidebar" role="complementary" aria-label="Credit navigation">
          <CreditSidebar />
        </aside>

        <main id="credit-main" className="crb-main" role="main" aria-live="polite">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
