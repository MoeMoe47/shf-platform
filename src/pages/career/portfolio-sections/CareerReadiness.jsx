// src/pages/career/portfolio-sections/CareerReadiness.jsx
import React from "react";

/**
 * No connected skills-assessment data source exists in the repo.
 * Isolated fallback values; a real assessment source can replace this
 * array without touching the rendering markup below.
 */
const READINESS = [
  { key: "technical", label: "Technical Skills", value: 76 },
  { key: "communication", label: "Communication", value: 68 },
  { key: "interview", label: "Interview Readiness", value: 72 },
];

export default function CareerReadiness() {
  return (
    <section className="sp-card" aria-labelledby="sp-readiness-h">
      <div className="sp-cardHeadRow">
        <h2 id="sp-readiness-h" className="sp-cardTitle">
          Career Readiness
        </h2>
      </div>

      <ul className="sp-readinessList">
        {READINESS.map((r) => (
          <li key={r.key} className="sp-readinessItem">
            <div className="sp-readinessTop">
              <span className="sp-readinessLabel">{r.label}</span>
              <span className="sp-readinessValue">{r.value}%</span>
            </div>
            <div
              className="sp-progressBar"
              role="progressbar"
              aria-valuenow={r.value}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={r.label}
            >
              <div className="sp-progressBarFill" style={{ width: `${r.value}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
