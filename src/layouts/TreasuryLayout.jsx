// src/layouts/TreasuryLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import TreasuryHeader from "@/components/treasury/TreasuryHeader.jsx";
import TreasurySidebar from "@/components/treasury/TreasurySidebar.jsx";

// Styles come from entry imports: shell.css, util-wash.css, treasury-shell.css

export default function TreasuryLayout() {
  return (
    <div className="crb-root" data-app="treasury">
      <header className="crb-header">
        <TreasuryHeader />
      </header>
      <div className="crb-body">
        <aside className="crb-sidebar">
          <TreasurySidebar />
        </aside>
        <main className="crb-main">
          <Outlet /> {/* ← all pages render here */}
        </main>
      </div>
    </div>
  );
}
