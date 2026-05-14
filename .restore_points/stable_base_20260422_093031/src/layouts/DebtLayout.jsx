// src/layouts/DebtLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import DebtHeader from "@/components/debt/DebtHeader.jsx";
import DebtSidebar from "@/components/debt/DebtSidebar.jsx";

// Styles come from entry imports: shell.css, util-wash.css, debt-shell.css

export default function DebtLayout() {
  return (
    <div className="crb-root" data-app="debt">
      <header className="crb-header">
        <DebtHeader />
      </header>
      <div className="crb-body">
        <aside className="crb-sidebar">
          <DebtSidebar />
        </aside>
        <main className="crb-main">
          <Outlet /> {/* ← all Debt pages render here */}
        </main>
      </div>
    </div>
  );
}
