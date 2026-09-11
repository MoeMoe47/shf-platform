// GeographySummaryMetrics.jsx — four Ohio-wide summary cards above
// the map workspace. DEMO / FRAME DATA (see
// ../../geographyExplorerMockData.js). Four items, so this uses its
// own 4-column grid class (cse-geo-metrics) rather than the shared
// 5-column .cse-metrics — same precedent as Provider Detail's
// ProviderSummaryMetrics.jsx.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import { GEO_SUMMARY_METRICS } from "../../geographyExplorerMockData.js";

export default function GeographySummaryMetrics() {
  return (
    <div className="cse-geo-metrics" role="list" aria-label="Ohio-wide summary metrics (demo data)">
      {GEO_SUMMARY_METRICS.map((m) => (
        <div className={`cse-metric-card${m.tone ? ` cse-metric-card--${m.tone}` : ""}`} role="listitem" key={m.key}>
          <span className="cse-metric-card__icon">
            <ExplorerIcon name={m.icon} />
          </span>
          <div>
            <p className="cse-metric-card__value">{m.value}</p>
            <p className="cse-metric-card__label">{m.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
