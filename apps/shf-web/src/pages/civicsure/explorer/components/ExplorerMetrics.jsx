// ExplorerMetrics.jsx — five assurance summary metric cards.
// DEMO / FRAME DATA — values come from civicsureExplorerMockData.js,
// not from the Metric Registry or any real CivicSure assurance source.
import React from "react";
import { ExplorerIcon } from "../explorerIcons.jsx";
import { EXPLORER_METRICS } from "../civicsureExplorerMockData.js";

export default function ExplorerMetrics() {
  return (
    <div className="cse-metrics" role="list" aria-label="Assurance summary metrics (demo data)">
      {EXPLORER_METRICS.map((m) => (
        <div className={`cse-metric-card${m.tone === "green" ? " cse-metric-card--green" : ""}`} role="listitem" key={m.key}>
          <span className="cse-metric-card__icon">
            <ExplorerIcon name={m.icon} />
          </span>
          <div>
            <p className="cse-metric-card__value">{m.value}</p>
            <p className="cse-metric-card__label">{m.label}</p>
            <p className="cse-metric-card__delta">↑ {m.delta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
