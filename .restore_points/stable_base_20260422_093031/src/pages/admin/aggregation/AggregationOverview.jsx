import React from "react";
import { getAggregationOverviewStats } from "./adapters";

const CARD_ORDER = [
  { key: "organizations", label: "Organizations" },
  { key: "referrals", label: "Referrals" },
  { key: "outcomes", label: "Outcomes" },
  { key: "verifications", label: "Verifications" },
  { key: "reports", label: "Reports" },
  { key: "signals", label: "Signals" },
];

export default function AggregationOverview() {
  const stats = getAggregationOverviewStats();

  return (
    <section className="admin-aggregation-overview">
      <div className="admin-aggregation-overview__header">
        <div>
          <p className="admin-aggregation-overview__eyebrow">Verified Aggregation Fabric</p>
          <h2 className="admin-aggregation-overview__title">Aggregation Overview</h2>
          <p className="admin-aggregation-overview__subtitle">
            Canonical entity counts and first-pass system totals from the shared contract layer.
          </p>
        </div>
      </div>

      <div className="admin-aggregation-overview__grid">
        {CARD_ORDER.map((card) => (
          <article key={card.key} className="admin-aggregation-overview__card">
            <span className="admin-aggregation-overview__label">{card.label}</span>
            <strong className="admin-aggregation-overview__value">
              {stats[card.key]}
            </strong>
          </article>
        ))}
      </div>
    </section>
  );
}
