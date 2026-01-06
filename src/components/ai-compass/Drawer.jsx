import React from "react";
export default function Drawer({ metro, onClose }) {
  return (
    <aside className={`ai-drawer ${metro ? "open" : ""}`} aria-live="polite" aria-label="Region details">
      <div className="ai-drag" />
      {metro ? (
        <>
          <header className="ai-dh">
            <strong>{metro.metro}</strong>
            <button className="ai-btn ghost" onClick={onClose}>Close</button>
          </header>
          <div className="ai-grid">
            <Stat label="Growth index" value={metro.idx} color={metro.color} />
            <Stat label="Median pay" value="$—" />
            <Stat label="Top roles" value="(mock) Data-Center Tech, Cyber Analyst, STNA" />
          </div>
          <div className="ai-cta">
            <a className="ai-btn primary" href="#/career">Train with SHF</a>
            <button className="ai-btn" onClick={() => alert("Subscribe flow")}>Get weekly local pulse</button>
          </div>
        </>
      ) : <div className="ai-empty">Click a pulse to see local details.</div>}
    </aside>
  );
}
function Stat({ label, value, color }) {
  return (
    <div className="ai-stat">
      <div className="ai-statLabel">{label}</div>
      <div className={`ai-statValue ${color??""}`}>{value}</div>
    </div>
  );
}
