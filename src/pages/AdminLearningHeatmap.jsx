import React from "react";

/**
 * AdminLearningHeatmap (mock)
 * X = Lessons, Y = Outcomes, color = mastery %
 */
const LESSONS = Array.from({ length: 16 }).map((_, i) => `L${i + 1}`);
const OUTCOMES = ["Readiness", "Safety", "Math", "Soft Skills", "Compliance", "Hands-on", "Quiz", "Final"];

export default function AdminLearningHeatmap() {
  const [data, setData] = React.useState(() => makeMock());
  const [showNumbers, setShowNumbers] = React.useState(false);

  return (
    <div style={sx.page}>
      <header style={sx.header}>
        <h1 style={sx.h1}>Learning Heatmap</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={sx.btn} onClick={() => setData(makeMock())}>Regenerate Mock</button>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={showNumbers} onChange={(e) => setShowNumbers(e.target.checked)} />
            Show %
          </label>
        </div>
      </header>

      <div style={sx.wrap}>
        <div style={sx.yAxis}>
          <div />
          {OUTCOMES.map(o => <div key={o} style={sx.yLabel}>{o}</div>)}
        </div>

        <div style={sx.grid}>
          <div style={sx.xAxis}>
            <div />
            {LESSONS.map(l => <div key={l} style={sx.xLabel}>{l}</div>)}
          </div>

          <div style={sx.cells}>
            {OUTCOMES.map((o) => (
              <div key={o} style={{ display: "grid", gridTemplateColumns: `repeat(${LESSONS.length}, 1fr)`, gap: 4 }}>
                {LESSONS.map((l) => {
                  const v = data[o][l];
                  return (
                    <div key={l} title={`${o} × ${l}: ${v}%`} style={{ ...sx.cell, background: colorFor(v) }}>
                      {showNumbers && <span style={sx.num}>{v}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={sx.legend}>
        <span>0%</span>
        <span style={{ ...sx.legendSwatch, background: colorFor(0) }} />
        <span style={{ ...sx.legendSwatch, background: colorFor(50) }} />
        <span style={{ ...sx.legendSwatch, background: colorFor(100) }} />
        <span>100%</span>
      </div>
    </div>
  );
}

function makeMock() {
  const obj = {};
  OUTCOMES.forEach(o => {
    obj[o] = {};
    LESSONS.forEach(l => { obj[o][l] = Math.round(40 + Math.random() * 60); }); // 40–100
  });
  return obj;
}
function colorFor(pct) {
  const t = Math.max(0, Math.min(1, pct / 100));
  const r = Math.round(255 - 155 * t);
  const g = Math.round(230 - 30 * (1 - t));
  const b = Math.round(210 - 160 * t);
  return `rgb(${r},${g},${b})`;
}

const sx = {
  page: { padding: 16, background: "#f6f3ed", minHeight: "100vh", color: "#0f172a", fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 },
  h1: { margin: 0, fontSize: 22, fontWeight: 800 },
  btn: { border: "1px solid #dcd7ce", background: "#fff", padding: "8px 10px", borderRadius: 10, cursor: "pointer", fontWeight: 700 },
  wrap: { display: "grid", gridTemplateColumns: "auto 1fr", gap: 8 },
  yAxis: { display: "grid", gridTemplateRows: `auto repeat(${OUTCOMES.length}, 28px)`, gap: 4, alignItems: "center" },
  yLabel: { fontSize: 12, color: "#334155", paddingRight: 8, textAlign: "right" },
  grid: { display: "grid", gridTemplateRows: "auto 1fr", gap: 8 },
  xAxis: { display: "grid", gridTemplateColumns: `auto repeat(${LESSONS.length}, 1fr)`, gap: 4, alignItems: "center" },
  xLabel: { fontSize: 11, color: "#334155", textAlign: "center" },
  cells: { display: "grid", gap: 4 },
  cell: { height: 28, border: "1px solid #e5e7eb", borderRadius: 4, display: "grid", placeItems: "center", fontSize: 11, color: "#0f172a" },
  num: { fontWeight: 700, fontSize: 11, background: "rgba(255,255,255,.5)", padding: "0 4px", borderRadius: 6 },
  legend: { display: "flex", gap: 8, alignItems: "center", marginTop: 8, fontSize: 12, color: "#334155" },
  legendSwatch: { width: 24, height: 12, display: "inline-block", border: "1px solid #e5e7eb" }
};
