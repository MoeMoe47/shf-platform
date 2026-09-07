import React from "react";

export default function OperatorLayout({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 220px) minmax(0, 1fr)", minHeight: "100vh" }} className="operator-layout">
      <style>{`
        @media (max-width: 700px) {
          .operator-layout { grid-template-columns: 1fr !important; }
          .operator-layout aside { border-right: 0 !important; border-bottom: 1px solid #ddd; }
          .operator-layout nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
      <aside style={{ borderRight: "1px solid #ddd", padding: 16, minWidth: 0 }}>
        <h2>SHF Operator</h2>
        <nav style={{ display: "grid", gap: 10 }}>
          <a href="#/operator">Dashboard</a>
          <a href="#/operator/programs">Programs</a>
          <a href="#/operator/cases">Cases</a>
          <a href="#/operator/government-assurance">Government Assurance</a>
        </nav>
      </aside>
      <main style={{ padding: 24, minWidth: 0 }}>{children}</main>
    </div>
  );
}
