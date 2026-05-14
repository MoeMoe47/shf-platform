import React from "react";

export default function ProviderDashboard() {
  return (
    <section
      style={{
        background: "#111827",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 20,
      }}
    >
      <h2 style={{ marginTop: 0 }}>Provider Dashboard</h2>
      <p style={{ color: "#cbd5e1", lineHeight: 1.6, marginBottom: 0 }}>
        This surface will handle outcome submissions, evidence uploads, verification
        status, disputes, and payout pipeline visibility for programs and providers.
      </p>
    </section>
  );
}
