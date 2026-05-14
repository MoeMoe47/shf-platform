// src/components/EarningsProjectionChart.jsx
import React from "react";

/**
 * EarningsProjectionChart
 * Props:
 *   years: number (projection horizon, e.g. 10)
 *   careers: Array<{
 *     id: string, name: string, emoji?: string,
 *     baseIncome: number, annualGrowthPct: number,
 *     aiType?: "AI-Resistant" | "AI-Building"
 *   }>
 */
export default function EarningsProjectionChart({ years = 10, careers = [] }) {
  // --------- GUARD: no careers passed ---------
  if (!careers || careers.length === 0) {
    return (
      <div className="epc-empty">
        <p className="sh-muted">No career data available to project earnings.</p>
      </div>
    );
  }

  const PAD_L = 46;
  const PAD_R = 22;
  const PAD_T = 20;
  const PAD_B = 28;
  const H = 260;
  const X_STEP = 56;

  const projection = React.useMemo(() => {
    const rows = careers.map((c) => {
      const g = Number(c.annualGrowthPct || 0) / 100;
      const base = Number(c.baseIncome || 0);
      const pts = Array.from({ length: years + 1 }, (_, i) => ({
        t: i,
        y: Math.round(base * Math.pow(1 + g, i)),
      }));
      return { ...c, pts };
    });
    const maxY = Math.max(1, ...rows.flatMap((r) => r.pts.map((p) => p.y)));
    return { rows, maxY };
  }, [careers, years]);

  const W = PAD_L + PAD_R + X_STEP * (years + 1);

  const xAt = (t) => PAD_L + t * X_STEP;
  const yAt = (y) => {
    const plotH = H - PAD_T - PAD_B;
    return H - PAD_B - (y / projection.maxY) * plotH;
  };

  const yTicks = niceTicks(0, projection.maxY, 4);

  // Color palette (distinct, friendly)
  const COLORS = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#ef4444", // red
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#14b8a6", // teal
    "#e11d48", // rose
    "#0ea5e9", // sky
  ];

  return (
    <div className="epc-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Projected earnings over ${years} years`}
        className="epc-svg"
      >
        {/* Axes */}
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} className="epc-axis" />
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} className="epc-axis" />

        {/* Y Ticks + labels */}
        {yTicks.map((yt, i) => (
          <g key={i} transform={`translate(0, ${yAt(yt)})`}>
            <line x1={PAD_L} x2={W - PAD_R} y1={0} y2={0} className="epc-grid" />
            <text x={PAD_L - 8} y={4} textAnchor="end" className="epc-tickLabel">
              ${formatK(yt)}
            </text>
          </g>
        ))}

        {/* X year ticks */}
        {Array.from({ length: years + 1 }, (_, t) => (
          <g key={t} transform={`translate(${xAt(t)}, 0)`}>
            <line
              x1={0}
              y1={H - PAD_B}
              x2={0}
              y2={H - PAD_B + 6}
              className="epc-tick"
            />
            <text
              x={0}
              y={H - PAD_B + 18}
              textAnchor="middle"
              className="epc-tickLabel"
            >
              Y{t}
            </text>
          </g>
        ))}

        {/* Series */}
        {projection.rows.map((row, idx) => {
          const color = COLORS[idx % COLORS.length];
          const pts = row.pts.map((p) => `${xAt(p.t)},${yAt(p.y)}`).join(" ");
          return (
            <g key={row.id}>
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={pts}
                opacity="0.95"
              />
              {row.pts.map((p, i) => (
                <circle
                  key={i}
                  cx={xAt(p.t)}
                  cy={yAt(p.y)}
                  r="4"
                  fill="#fff"
                  stroke={color}
                  strokeWidth="2"
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="epc-legend" role="list">
        {projection.rows.map((row, idx) => {
          const color = COLORS[idx % COLORS.length];
          const g = Number(row.annualGrowthPct || 0);
          const last = row.pts[row.pts.length - 1]?.y ?? 0;
          return (
            <div className="epc-legendItem" role="listitem" key={row.id}>
              <span className="epc-swatch" style={{ background: color }} />
              <span className="epc-emoji" aria-hidden>
                {row.emoji || "💼"}
              </span>
              <span className="epc-name">{row.name}</span>
              <span className={`epc-badge ${row.aiType === "AI-Resistant" ? "resist" : "build"}`}>
                {row.aiType || "AI-Building"}
              </span>
              <span className="epc-meta">
                +{g}%/yr · Y{years}: <strong>${last.toLocaleString()}</strong>
              </span>
            </div>
          );
        })}
      </div>

      {/* Scoped style */}
      <style>{CSS}</style>
    </div>
  );
}

/* ---------- helpers ---------- */
function formatK(n) {
  const x = Math.round(Number(n || 0));
  if (x >= 1000000) return `${(x / 1_000_000).toFixed(1)}M`;
  if (x >= 1000) return `${Math.round(x / 1000)}k`;
  return String(x);
}
function niceTicks(min, max, count = 4) {
  const span = max - min || 1;
  const step = niceStep(span / Math.max(1, count));
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = start; v <= end + 0.5 * step; v += step) ticks.push(Math.max(0, Math.round(v)));
  return ticks;
}
function niceStep(raw) {
  const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
  const d = raw / pow10;
  const m = d < 1.5 ? 1 : d < 3 ? 2 : d < 7 ? 5 : 10;
  return m * pow10;
}

const CSS = `
.epc-wrap{ display:grid; gap:10px; }
.epc-empty{ padding:12px; color:#6b7280; font-size:14px; font-style:italic; }
.epc-svg{ width:100%; height:auto; display:block; }
.epc-axis{ stroke: rgba(0,0,0,.25); stroke-width:1; }
.epc-grid{ stroke: rgba(0,0,0,.08); stroke-width:1; }
.epc-tick{ stroke: rgba(0,0,0,.25); }
.epc-tickLabel{ fill:#6b7280; font-size:12px; }
.epc-legend{ display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:10px; }
.epc-legendItem{
  display:flex; align-items:center; gap:8px;
  border:1px solid var(--line); border-radius:12px; padding:8px 10px; background:#fff;
}
.epc-swatch{ width:16px; height:6px; border-radius:999px; display:inline-block; }
.epc-emoji{ font-size:18px; }
.epc-name{ font-weight:700; color:var(--slate); }
.epc-badge{
  margin-left:auto;
  font-size:11px; line-height:1; padding:3px 8px; border-radius:999px; border:1px solid var(--line);
  background:#fff; color:#374151;
}
.epc-badge.build{ border-color:#0ea5e9; color:#0369a1; background:#eff6ff; }
.epc-badge.resist{ border-color:#22c55e; color:#166534; background:#ecfdf5; }
.epc-meta{ color:#6b7280; font-size:12px; }
@media (max-width:560px){
  .epc-legend{ grid-template-columns:1fr; }
  .epc-badge{ margin-left:0; }
}
`;
