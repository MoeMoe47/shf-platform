// src/layouts/SalesLayout.jsx
//
// Rebuilt to use the same .crb-root/.crb-header/.crb-body/.crb-sidebar/
// .crb-main shell architecture already proven for Civic this session (see
// src/layouts/CivicLayout.jsx and src/styles/civic-shell.css) — the Sales
// counterpart, src/styles/sales-shell.css, already defines the identical
// class family and is already imported by src/entries/sales.main.jsx, it
// was simply never wired up: the previous SalesLayout used one-off inline
// styles instead. SalesHeader/SalesSidebar are the current app's own
// components (SalesSidebar.jsx confirmed real/uncontaminated; SalesHeader
// replaced separately — see that file's own history note).
import React from "react";
import { Outlet } from "react-router-dom";
import SalesHeader from "@/components/sales/SalesHeader.jsx";
import SalesSidebar from "@/components/sales/SalesSidebar.jsx";

export default function SalesLayout() {
  return (
    <div className="crb-root" data-app="sales">
      <header className="crb-header" role="banner">
        <SalesHeader />
      </header>
      <div className="crb-body">
        <aside className="crb-sidebar" aria-label="Primary">
          <SalesSidebar />
        </aside>
        <main className="crb-main" id="sales-main" role="main" aria-live="polite">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
