// src/pages/sales/Pipeline.jsx
//
// Deal data restored from the archived src/_archive/pages.sales.
// 20251107-000126/Pipeline.jsx (real SHF-specific opportunities, not
// generic placeholder data). Table markup uses inline styles rather than
// that archive's .sh-table/.num/.btn classes, none of which are defined
// anywhere in the project — same "verify before reusing" approach used
// throughout this session's restorations. The "Open" per-row deal link
// was dropped: it pointed to /deal/:id, a route this pass doesn't build,
// and leaving it would just be a new broken link.
import React from "react";

const rows = [
  { id: "O-1012", name: "SHF Foundation Pilot", stage: "Proposal", amt: 45000 },
  { id: "O-1011", name: "Rural STEM Cohort", stage: "Discovery", amt: 28000 },
  { id: "O-1010", name: "Career Pathways", stage: "Negotiation", amt: 62000 },
];

const usd0 = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function Pipeline() {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Pipeline</h1>
          <p className="db-subtitle">Opportunities by stage</p>
        </div>
      </header>
      <div className="card card--pad">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--ring)" }}>
              <th style={{ padding: "8px 10px" }}>Name</th>
              <th style={{ padding: "8px 10px" }}>Stage</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--ring)" }}>
                <td style={{ padding: "8px 10px" }}>{r.name}</td>
                <td style={{ padding: "8px 10px" }}>{r.stage}</td>
                <td style={{ padding: "8px 10px", textAlign: "right" }}>{usd0(r.amt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
