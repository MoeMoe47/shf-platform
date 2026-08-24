// src/pages/sales/Leads.jsx
import React from "react";
import LeadBridgeStrip from "@/components/sales/LeadBridgeStrip.jsx";

export default function Leads() {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Leads</h1>
          <p className="db-subtitle">Employer-sourced leads bridged into Sales</p>
        </div>
      </header>
      <LeadBridgeStrip />
      <div className="card card--pad">
        No additional lead sources are connected yet.
      </div>
    </section>
  );
}
