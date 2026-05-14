import React from "react";

export default function InvestorDashboard() {
  return (
    <section
      style={{
        background: "#111827",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 20,
      }}
    >
      <h2 style={{ marginTop: 0 }}>Investor Dashboard</h2>
      <p style={{ color: "#cbd5e1", lineHeight: 1.6, marginBottom: 0 }}>
        This surface will show pool performance, capital deployment, verified outcomes,
        rankings, risk monitoring, and allocation controls for funders and investors.
      </p>
    </section>
  );
}
