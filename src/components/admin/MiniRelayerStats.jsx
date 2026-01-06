// src/components/admin/MiniRelayerStats.jsx
import React from "react";

function readSnapshot() {
  try { return JSON.parse(localStorage.getItem("relayer:stats") || "{}"); }
  catch { return {}; }
}

export default function MiniRelayerStats() {
  const [stats, setStats] = React.useState(() => readSnapshot());

  React.useEffect(() => {
    const onStats = (e) => setStats(e.detail || {});
    window.addEventListener("relayer:stats", onStats);
    // seed from last snapshot (in case relayer page was used previously)
    setStats(readSnapshot());
    return () => window.removeEventListener("relayer:stats", onStats);
  }, []);

  const {
    queued = 0,
    signing = 0,
    broadcasting = 0,
    mined = 0,
    failed = 0,
    total = 0,
    updatedAt = 0,
  } = stats || {};

  return (
    <section style={sx.card} aria-live="polite">
      <div style={sx.head}>
        <h3 style={sx.title}>Relayer Snapshot</h3>
        <a href="/admin/relayer" style={sx.link}>Open</a>
      </div>
      <div style={sx.grid}>
        <Cell label="Queued" value={queued} />
        <Cell label="Signing" value={signing} />
        <Cell label="Broadcast" value={broadcasting} />
        <Cell label="Mined" value={mined} />
        <Cell label="Failed" value={failed} />
        <Cell label="Total" value={total} />
      </div>
      <div style={sx.footer}>
        <span style={sx.dot} /> Updated {updatedAt ? new Date(updatedAt).toLocaleTimeString() : "—"}
      </div>
    </section>
  );
}

function Cell({ label, value }) {
  return (
    <div style={sx.cell}>
      <div style={sx.val}>{value}</div>
      <div style={sx.lab}>{label}</div>
    </div>
  );
}

const sx = {
  card: { background: "#fff", border: "1px solid #e6e4de", borderRadius: 12, padding: 12 },
  head: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  title: { margin: 0, fontSize: 13, fontWeight: 800, color: "#0f172a" },
  link: { fontSize: 12, textDecoration: "none", color: "#ff4f00", fontWeight: 700 },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  cell: { border: "1px solid #f1eee8", borderRadius: 10, padding: 8, textAlign: "center" },
  val: { fontSize: 18, fontWeight: 800, color: "#0f172a" },
  lab: { fontSize: 11, color: "#6b7280" },
  footer: { marginTop: 8, fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 999, background: "#10b981", display: "inline-block" },
};
