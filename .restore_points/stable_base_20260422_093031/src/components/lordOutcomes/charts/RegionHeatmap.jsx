// src/components/lordOutcomes/charts/RegionHeatmap.jsx
import React from "react";

export default function RegionHeatmap({ states }) {
  if (!states || states.length === 0) return null;

  const maxJobs = Math.max(...states.map((s) => s.jobsPlaced || 0), 1);

  return (
    <section className="lord-heatmap">
      <div className="lord-heatmap-title">Regional Heatmap (Jobs Placed)</div>
      <div className="lord-heatmap-grid">
        {states.map((s) => {
          const ratio = (s.jobsPlaced || 0) / maxJobs;
          const bg = `rgba(34,197,94,${0.2 + ratio * 0.6})`;

          return (
            <div
              key={s.code}
              className="lord-heatmap-cell"
              style={{ backgroundColor: bg }}
            >
              <div className="lord-heatmap-state">
                {s.name} ({s.code})
              </div>
              <div className="lord-heatmap-metric">
                <strong>{s.jobsPlaced}</strong> jobs placed
              </div>
              <div className="lord-heatmap-metric">
                {s.participants} participants · {s.credentials} credentials
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
