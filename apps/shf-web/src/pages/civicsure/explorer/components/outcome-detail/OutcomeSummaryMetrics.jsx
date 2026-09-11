// OutcomeSummaryMetrics.jsx — five summary metric cards. DEMO / FRAME
// DATA (see ../../outcomeDetailMockData.js). Five items, so this
// reuses the shared .cse-metrics 5-column grid.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function OutcomeSummaryMetrics({ outcome }) {
  const cards = [
    { key: "verifiedPlacements", label: "Verified Placements", value: outcome.metrics.verifiedPlacements, icon: "shieldCheck", tone: "green" },
    { key: "eligibleParticipants", label: "Eligible Participants", value: outcome.metrics.eligibleParticipants, icon: "people" },
    { key: "actual", label: "Actual", value: outcome.metrics.actual, icon: "trend" },
    { key: "target", label: "Target", value: outcome.metrics.target, icon: "target" },
    { key: "evidenceCoverage", label: "Evidence Coverage", value: outcome.metrics.evidenceCoverage, icon: "userCheck" },
  ];

  return (
    <div className="cse-metrics" role="list" aria-label={`Summary metrics for ${outcome.name} (demo data)`}>
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
