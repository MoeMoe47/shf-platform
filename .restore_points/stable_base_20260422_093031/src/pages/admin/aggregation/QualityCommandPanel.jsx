import React from "react";
import {
  getAggregationOverviewStats,
  getEntityResolutionItems,
  getLineageItems,
  getReconciliationItems,
  getVerificationItems,
} from "./adapters";

function buildQualitySummary() {
  const stats = getAggregationOverviewStats();
  const entityItems = getEntityResolutionItems();
  const lineageItems = getLineageItems();
  const reconciliationItems = getReconciliationItems();
  const verificationItems = getVerificationItems();

  const avgConfidence =
    entityItems.length > 0
      ? Math.round(
          entityItems.reduce((sum, item) => sum + Number(item.confidenceScore || 0), 0) /
            entityItems.length
        )
      : 0;

  const pendingVerifications = verificationItems.filter(
    (item) => String(item.verificationState).toLowerCase() === "pending"
  ).length;

  const highPriorityReconciliation = reconciliationItems.filter(
    (item) => String(item.priority).toLowerCase() === "high"
  ).length;

  const staleLineage = lineageItems.filter(
    (item) => String(item.freshness).toLowerCase() !== "24h"
  ).length;

  return {
    stats,
    avgConfidence,
    pendingVerifications,
    highPriorityReconciliation,
    staleLineage,
  };
}

export default function QualityCommandPanel() {
  const summary = buildQualitySummary();

  const cards = [
    {
      label: "Avg Confidence",
      value: `${summary.avgConfidence}%`,
      note: "Entity resolution confidence average",
    },
    {
      label: "Pending Verifications",
      value: summary.pendingVerifications,
      note: "Records awaiting trust confirmation",
    },
    {
      label: "High Priority Reconciliation",
      value: summary.highPriorityReconciliation,
      note: "Referral items needing closer review",
    },
    {
      label: "Non-24h Lineage",
      value: summary.staleLineage,
      note: "Lineage items not in freshest tier",
    },
    {
      label: "Tracked Organizations",
      value: summary.stats.organizations,
      note: "Organizations in canonical aggregation view",
    },
    {
      label: "Tracked Reports",
      value: summary.stats.reports,
      note: "Report artifacts inside aggregation scope",
    },
  ];

  return (
    <section className="admin-aggregation-quality">
      <div className="admin-aggregation-quality__header">
        <div>
          <p className="admin-aggregation-quality__eyebrow">Freshness + Risk Summary</p>
          <h2 className="admin-aggregation-quality__title">Quality Command Panel</h2>
          <p className="admin-aggregation-quality__subtitle">
            A first-pass command summary for confidence, verification backlog, reconciliation pressure,
            and lineage freshness.
          </p>
        </div>
      </div>

      <div className="admin-aggregation-quality__grid">
        {cards.map((card) => (
          <article key={card.label} className="admin-aggregation-quality__card">
            <span className="admin-aggregation-quality__label">{card.label}</span>
            <strong className="admin-aggregation-quality__value">{card.value}</strong>
            <p className="admin-aggregation-quality__note">{card.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
