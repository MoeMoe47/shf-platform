// ProviderSummaryMetrics.jsx — four summary metric cards, visible on
// every tab. DEMO / FRAME DATA — values come from
// providerDetailMockData.js, not from the Metric Registry or any real
// CivicSure assurance source.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function ProviderSummaryMetrics({ provider }) {
  const cards = [
    { key: "activePrograms", label: "Active Programs", value: provider.metrics.activePrograms, icon: "grid" },
    { key: "totalFunding", label: "Total Funding", value: provider.metrics.totalFunding, icon: "bank" },
    { key: "peopleServed", label: "People Served", value: provider.metrics.peopleServed, icon: "people" },
    { key: "verifiedOutcomes", label: "Verified Outcomes", value: provider.metrics.verifiedOutcomes, icon: "shieldCheck", tone: "green" },
  ];

  return (
    <div className="cse-pvd-metrics" role="list" aria-label={`Summary metrics for ${provider.name} (demo data)`}>
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
