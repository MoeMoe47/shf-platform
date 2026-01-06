// src/components/CareerPathCard.jsx
import React from "react";

export default function CareerPathCard({ career }) {
  const {
    name,
    avgIncome,
    annualGrowthPct = 0,
    years = 10,
    progressPct = 0,
  } = career || {};

  const points = buildProjection(avgIncome, annualGrowthPct, years);
  const totalGrowthPct = ((points[points.length - 1].value / points[0].value) - 1) * 100;

  const W = 520, H = 200, PADX = 32, PADY = 18;
  const innerW = W - PADX * 2, innerH = H - PADY * 2;

  const minVal = Math.min(...points.map(p => p.value));
  const maxVal = Math.max(...points.map(p => p.value));
  const yScale = (v) => {
    if (maxVal === minVal) return H / 2;
    const t = (v - minVal) / (maxVal - minVal);
    return PADY + (1 - t) * innerH;
  };
  const xScale = (i) => PADX + (i / (points.length - 1)) * innerW;

  const lineD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(p.value)}`).join(" ");
  const areaD = `${points.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(p.value)}`).join(" ")} 
                L ${xScale(points.length - 1)} ${PADY + innerH}
                L ${xScale(0)} ${PADY + innerH} Z`;

  const progressClamped = Math.max(0, Math.min(100, progressPct));
  const px = xScale((progressClamped / 100) * (points.length - 1));
  const py = yScale(lerp(points[0].value, points[points.length - 1].value, progressClamped / 100));

  return (
    <div className="sh-career">
      <div className="sh-careerTop">
        <div className="sh-careerTitle">
          {name}
          <span className="sh-chip">Avg Income {formatMoney(avgIncome)}</span>
          <span className="sh-chip sh-chip--accent">10y Growth {totalGrowthPct.toFixed(1)}%</span>
        </div>
        <div className="sh-careerProgressWrap">
          <div className="sh-careerProgressTrack" aria-label={`Progress ${progressClamped}%`}>
            <div className="sh-careerProgressFill" style={{ width: `${progressClamped}%` }} />
          </div>
          <div className="sh-careerProgressLabel">{progressClamped}% on your pathway</div>
        </div>
      </div>

      <div className="sh-chartBox">
        <svg viewBox={`0 0 ${W} ${H}`} className="sh-chartSVG" role="img" aria-label="10-year pay projection">
          <defs>
            <linearGradient id="payArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255, 124, 67, 0.35)" />
              <stop offset="100%" stopColor="rgba(255, 124, 67, 0.05)" />
            </linearGradient>
            <linearGradient id="payLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF7C43" />
              <stop offset="100%" stopColor="#FFB703" />
            </linearGradient>
          </defs>

          <line x1={PADX} y1={PADY + innerH} x2={PADX + innerW} y2={PADY + innerH} className="sh-axis" />
          <line x1={PADX} y1={PADY} x2={PADX} y2={PADY + innerH} className="sh-axis" />

          <path d={areaD} fill="url(#payArea)" />
          <path d={lineD} fill="none" stroke="url(#payLine)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

          {points.map((p, i) => (
            <g key={i}>
              <line x1={xScale(i)} y1={PADY + innerH} x2={xScale(i)} y2={PADY + innerH + 4} className="sh-tick" />
              <text x={xScale(i)} y={PADY + innerH + 16} className="sh-tickLabel" textAnchor="middle">
                {i === 0 ? "Now" : `+${i}y`}
              </text>
            </g>
          ))}

          <line x1={px} y1={PADY} x2={px} y2={PADY + innerH} className="sh-progressLine" />
          <circle cx={px} cy={py} r="5.5" className="sh-progressDot" />
        </svg>

        <div className="sh-legend">
          <span className="sh-legendItem">
            <span className="sh-legendSwatch sh-legendSwatch--line" /> Projected Pay
          </span>
          <span className="sh-legendItem">
            <span className="sh-legendSwatch sh-legendSwatch--progress" /> Your Progress
          </span>
        </div>
      </div>
    </div>
  );
}

function buildProjection(startValue, annualPct, years) {
  const pts = [];
  for (let i = 0; i <= years; i++) {
    const value = startValue * Math.pow(1 + (annualPct / 100), i);
    pts.push({ yearOffset: i, value });
  }
  return pts;
}
function lerp(a, b, t) { return a + (b - a) * t; }
function formatMoney(n) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$${Math.round(n).toLocaleString()}`;
  }
}
