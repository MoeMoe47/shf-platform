// ProgramDetailMetrics.jsx — four summary metric cards. DEMO / FRAME
// DATA — values come from programDetailMockData.js, not from the
// Metric Registry or any real CivicSure assurance source.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function ProgramDetailMetrics({ program }) {
  const hasOpenExceptions = program.metrics.openExceptions !== "0";

  const cards = [
    { key: "totalFunding", label: "Total Funding", value: program.metrics.totalFunding, icon: "bank" },
    { key: "spentToDate", label: "Spent to Date", value: program.metrics.spentToDate, icon: "trend" },
    { key: "verifiedOutcomes", label: "Verified Outcomes", value: program.metrics.verifiedOutcomes, icon: "shieldCheck", tone: "green" },
    {
      key: "openExceptions",
      label: "Open Exceptions",
      value: program.metrics.openExceptions,
      icon: "infoCircle",
      tone: hasOpenExceptions ? "amber" : undefined,
    },
  ];

  return (
    <div className="cse-pd-metrics" role="list" aria-label={`Summary metrics for ${program.name} (demo data)`}>
      {cards.map((c) => (
        <div className={`cse-metric-card${c.tone ? ` cse-metric-card--${c.tone}` : ""}`} role="listitem" key={c.key}>
          <span className="cse-metric-card__icon">
            <ExplorerIcon name={c.icon} />
          </span>
          <div>
            <p className="cse-metric-card__value">{c.value}</p>
            <p className="cse-metric-card__label">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
