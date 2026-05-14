import React from "react";
import {
  getAggregationOverviewStats,
  getVerificationItems,
  getReconciliationItems,
} from "./adapters";

function buildHeaderStatus() {
  const stats = getAggregationOverviewStats();
  const pendingVerifications = getVerificationItems().filter(
    (item) => String(item.verificationState).toLowerCase() === "pending"
  ).length;

  const highPriorityReconciliation = getReconciliationItems().filter(
    (item) => String(item.priority).toLowerCase() === "high"
  ).length;

  return {
    totalTracked: stats.organizations + stats.referrals + stats.outcomes,
    pendingVerifications,
    highPriorityReconciliation,
    lastRefresh: "24h",
    publicationMode: "admin_internal",
  };
}

export default function AggregationCommandBar() {
  const status = buildHeaderStatus();

  return (
    <section className="admin-aggregation-commandbar">
      <div className="admin-aggregation-commandbar__left">
        <p className="admin-aggregation-commandbar__eyebrow">Verified Aggregation Fabric</p>
        <h1 className="admin-aggregation-commandbar__title">Aggregation Command Surface</h1>
        <p className="admin-aggregation-commandbar__subtitle">
          Review canonical entities, trust signals, lineage traces, and reconciliation pressure from one shared admin layer.
        </p>
      </div>

      <div className="admin-aggregation-commandbar__right">
        <div className="admin-aggregation-commandbar__chips">
          <span className="admin-aggregation-commandbar__chip">
            Tracked: <strong>{status.totalTracked}</strong>
          </span>
          <span className="admin-aggregation-commandbar__chip">
            Pending Verification: <strong>{status.pendingVerifications}</strong>
          </span>
          <span className="admin-aggregation-commandbar__chip">
            High Priority Reconciliation: <strong>{status.highPriorityReconciliation}</strong>
          </span>
          <span className="admin-aggregation-commandbar__chip">
            Freshness: <strong>{status.lastRefresh}</strong>
          </span>
          <span className="admin-aggregation-commandbar__chip">
            Mode: <strong>{status.publicationMode}</strong>
          </span>
        </div>

        <div className="admin-aggregation-commandbar__actions">
          <button type="button">Refresh Snapshot</button>
          <button type="button">Generate Brief</button>
        </div>
      </div>
    </section>
  );
}
