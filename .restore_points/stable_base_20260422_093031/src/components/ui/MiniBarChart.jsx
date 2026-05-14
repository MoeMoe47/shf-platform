import React from "react";

/**
 * MiniBarChart — tiny SVG bar chart for quick visuals (no libs).
 * props:
 *  - title?: string
 *  - labels: string[]
 *  - values: number[] (same length as labels)
 *  - max?: number (optional; auto if omitted)
 */
export default function MiniBarChart({ title, labels = [], values = [], max }) {
  const m = max ?? Math.max(1, ...values);
  const padX = 20, padY = 20, w = 340, h = 160;
  const barW = (w - padX * 2) / (values.length || 1) - 8;

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          border: "1px solid var(--line,#e6e4de)",
          borderRadius: 12
        }}
      >
        <style>
          {`.t{font:12px system-ui,Segoe UI,Roboto}
            .axis{stroke:#9ca3af;stroke-width:.5}
            .bar{fill:#ff7a45}`}
        </style>

        {title && (
          <text x="12" y="18" className="t" fill="#111">
            {title}
          </text>
        )}

        {/* x-axis */}
        <line
          x1={padX}
          y1={h - padY}
          x2={w - padX}
          y2={h - padY}
          className="axis"
        />

        {/* bars */}
        {values.map((v, i) => {
          const x = padX + i * (barW + 8);
          const bh = Math.max(2, (v / m) * (h - padY * 2));
          const y = h - padY - bh;
          return (
            <g key={i} transform={`translate(${x},0)`}>
              <rect className="bar" x="0" y={y} width={barW} height={bh} rx="4" />
              <text
                className="t"
                x={barW / 2}
                y={h - padY + 14}
                textAnchor="middle"
                fill="#111"
              >
                {labels[i] ?? ""}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
