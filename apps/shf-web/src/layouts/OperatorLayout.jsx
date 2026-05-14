import React from "react";

export default function OperatorLayout({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh" }}>
      <aside style={{ borderRight: "1px solid #ddd", padding: 16 }}>
        <h2>SHF Operator</h2>
        <nav style={{ display: "grid", gap: 10 }}>
          <a href="#/operator">Dashboard</a>
          <a href="#/operator/programs">Programs</a>
          <a href="#/operator/cases">Cases</a>
        </nav>
      </aside>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
