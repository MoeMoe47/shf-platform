// FundingSummaryMetrics.jsx — five summary metric cards. DEMO / FRAME
// DATA (see ../../fundingDetailMockData.js). Five items, so this
// reuses the shared .cse-metrics 5-column grid (the same class the
// Explorer main page's and Geography Explorer's own metric rows use)
// rather than a page-specific grid class.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function FundingSummaryMetrics({ funding }) {
  const cards = [
    { key: "authorized", label: "Authorized", value: funding.metrics.authorized, icon: "bank" },
    { key: "awarded", label: "Awarded", value: funding.metrics.awarded, icon: "document" },
    { key: "obligated", label: "Obligated", value: funding.metrics.obligated, icon: "box" },
    { key: "expended", label: "Expended", value: funding.metrics.expended, icon: "shieldCheck", tone: "green" },
    { key: "remaining", label: "Remaining Obligated", value: funding.metrics.remainingObligated, icon: "infoCircle" },
  ];

  return (
    <div className="cse-metrics" role="list" aria-label={`Funding summary for ${funding.name} (demo data)`}>
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
