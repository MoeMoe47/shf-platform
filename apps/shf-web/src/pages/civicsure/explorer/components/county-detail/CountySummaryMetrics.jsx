// CountySummaryMetrics.jsx — five summary metric cards, visible on
// every tab. DEMO / FRAME DATA — values come from
// countyDetailMockData.js, not from the Metric Registry or any real
// CivicSure assurance source. Reuses .cse-metrics (the same 5-column
// grid class the Explorer main page's own metric row uses) rather
// than defining a county-specific grid class.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function CountySummaryMetrics({ county }) {
  const hasOpenExceptions = county.metrics.openExceptions !== "0";

  const cards = [
    { key: "activePrograms", label: "Active Programs", value: county.metrics.activePrograms, icon: "grid" },
    { key: "totalFunding", label: "Total Funding", value: county.metrics.totalFunding, icon: "bank" },
    { key: "providers", label: "Providers", value: county.metrics.providers, icon: "people" },
    { key: "verifiedOutcomes", label: "Verified Outcomes", value: county.metrics.verifiedOutcomes, icon: "shieldCheck", tone: "green" },
    {
      key: "openExceptions",
      label: "Open Exceptions",
      value: county.metrics.openExceptions,
      icon: "infoCircle",
      tone: hasOpenExceptions ? "amber" : undefined,
    },
  ];

  return (
    <div className="cse-metrics" role="list" aria-label={`Summary metrics for ${county.name} (demo data)`}>
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
