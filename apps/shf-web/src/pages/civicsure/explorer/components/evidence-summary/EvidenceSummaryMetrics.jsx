// EvidenceSummaryMetrics.jsx — five summary metric cards. DEMO / FRAME
// DATA (see ../../evidenceSummaryMockData.js). Five items, so this
// reuses the shared .cse-metrics 5-column grid.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function EvidenceSummaryMetrics({ evidence }) {
  const cards = [
    { key: "recordsCovered", label: "Records Covered", value: evidence.metrics.recordsCovered, icon: "shieldCheck", tone: "green" },
    { key: "eligiblePopulation", label: "Eligible Population", value: evidence.metrics.eligiblePopulation, icon: "people" },
    { key: "coverage", label: "Coverage", value: evidence.metrics.coverage, icon: "userCheck" },
    { key: "evidenceSources", label: "Evidence Sources", value: evidence.metrics.evidenceSources, icon: "document" },
    { key: "notYetVerified", label: "Not Yet Verified", value: evidence.metrics.notYetVerified, icon: "infoCircle", tone: "amber" },
  ];

  return (
    <div className="cse-metrics" role="list" aria-label={`Summary metrics for ${evidence.name} (demo data)`}>
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
