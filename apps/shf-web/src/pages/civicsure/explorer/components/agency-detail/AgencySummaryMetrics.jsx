// AgencySummaryMetrics.jsx — five summary metric cards. DEMO / FRAME
// DATA (see ../../agencyDetailMockData.js). Five items, so this
// reuses the shared .cse-metrics 5-column grid.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function AgencySummaryMetrics({ agency }) {
  const cards = [
    { key: "activePrograms", label: "Active Programs", value: agency.metrics.activePrograms, icon: "grid" },
    { key: "fundingAdministered", label: "Funding Administered", value: agency.metrics.fundingAdministered, icon: "bank" },
    { key: "providers", label: "Providers", value: agency.metrics.providers, icon: "people" },
    { key: "verifiedOutcomes", label: "Verified Outcomes", value: agency.metrics.verifiedOutcomes, icon: "shieldCheck", tone: "green" },
    { key: "openExceptions", label: "Open Exceptions", value: agency.metrics.openExceptions, icon: "infoCircle", tone: "amber" },
  ];

  return (
    <div className="cse-metrics" role="list" aria-label={`Summary metrics for ${agency.name} (demo data)`}>
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
