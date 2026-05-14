// src/pages/treasury/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

const kpis = [
  { label: "Total Assets (EVU)", value: 128_500, sub: "All categories", icon: "🏦" },
  { label: "On-Chain Batches",   value: 42,      sub: "Polygon proofs", icon: "🔗" },
  { label: "Open Grants",        value: 7,       sub: "In pipeline",    icon: "📝" },
  { label: "30-Day Inflow",      value: 18_250,  sub: "Donations + fees", icon: "💧" },
];

const recent = [
  { id:"TX-1048", date:"2025-10-21", memo:"EVU: Career Launchpad v1.2", program:"Education IP", amt: 3200, chain:"0xabc…91e" },
  { id:"TX-1047", date:"2025-10-18", memo:"Grant: STEM Rural Pilot",    program:"Grants",       amt: 15000, chain:"0x7de…2f1" },
  { id:"TX-1046", date:"2025-10-16", memo:"Donation: Corporate Match",  program:"General",      amt: 2100, chain:"0xa04…9b2" },
];

const assets = [
  { name:"Voiceflow Course IP", category:"ip",        evu: 40000 },
  { name:"STNA Curriculum",     category:"ip",        evu: 52000 },
  { name:"Metaverse Parcels",   category:"metaverse", evu: 6800  },
  { name:"Impact Dataset",      category:"impact",    evu: 9700  },
];

export default function TreasuryDashboard() {
  return (
    <section className="db-shell" data-page="treasury-dashboard">
      <header className="db-head">
        <div>
          <h1 className="db-title">Treasury</h1>
          <p className="db-subtitle">Open ledger • EVU assets • Polygon proofs</p>
        </div>
        <div className="db-headR">
          <Link to="/assets" className="btn btn--primary">Manage Assets</Link>
          <Link to="/ledger" className="btn">Export CSV</Link>
        </div>
      </header>

      <div className="db-content">
        {/* KPI Row */}
        <div className="db-grid db-grid--kpis">
          {kpis.map((k) => (
            <div key={k.label} className="wash card kpi">
              <div className="kpi-head">
                <div className="kpi-label"><span className="kpi-icon">{k.icon}</span>{k.label}</div>
              </div>
              <div className="kpi-value">{typeof k.value === "number" ? k.value.toLocaleString() : k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Hero */}
        <div className="lux-hero" style={{ marginTop: 8 }}>
          <div className="lux-heroL">
            <div className="lux-eyebrow">Foundation • Transparent by default</div>
            <h2 className="lux-title">Education Value Units (EVU)</h2>
            <p className="lux-sub">Track curriculum IP, donations, and grants in one place. Every batch can be mirrored to chain for public trust.</p>
            <div className="lux-cta">
              <Link to="/proofs" className="btn btn--primary">View Chain Proofs</Link>
              <Link to="/settings" className="btn">Configure Polygon</Link>
            </div>
          </div>
          <div className="lux-heroKpis">
            <div className="lux-kpi">
              <div className="lux-kpi-label">EVU Coverage</div>
              <div className="lux-kpi-value">92%</div>
              <div className="lux-kpi-meter"><span style={{ width: "92%" }} /></div>
            </div>
            <div className="lux-kpi">
              <div className="lux-kpi-label">Proof Health</div>
              <div className="lux-kpi-value">Green</div>
              <div className="lux-kpi-meter"><span style={{ width: "88%" }} /></div>
            </div>
          </div>
        </div>

        {/* Two-up: Recent ledger + Top assets */}
        <div className="db-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
          <div className="card card--pad">
            <h3 style={{ marginTop: 0 }}>Recent Ledger Activity</h3>
            <div className="wash wash-left" style={{ padding: 10 }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                <thead>
                  <tr style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    <th align="left">Date</th>
                    <th align="left">Memo</th>
                    <th align="left">Program</th>
                    <th align="right">Amount</th>
                    <th align="left">Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.memo}</td>
                      <td>{r.program}</td>
                      <td align="right">${r.amt.toLocaleString()}</td>
                      <td><code style={{ fontSize: 12 }}>{r.chain}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12 }}>
              <Link className="linkcard" to="/ledger">Open full ledger →</Link>
            </div>
          </div>

          <div className="card card--pad">
            <h3 style={{ marginTop: 0 }}>Top EVU Assets</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {assets.map((a) => (
                <li key={a.name} className="hover-lift" style={{ border: "1px solid var(--ring)", borderRadius: 12, padding: 10, background: "#fff" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{a.category.toUpperCase()}</div>
                    </div>
                    <div style={{ fontWeight: 800 }}>{a.evu.toLocaleString()} EVU</div>
                  </div>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 12 }}>
              <Link className="linkcard" to="/assets">Manage assets →</Link>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="db-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          <Link to="/proofs" className="linkcard">Batch to chain</Link>
          <Link to="/ledger" className="linkcard">Download CSV</Link>
          <Link to="/settings" className="linkcard">Configure keys</Link>
        </div>
      </div>
    </section>
  );
}
