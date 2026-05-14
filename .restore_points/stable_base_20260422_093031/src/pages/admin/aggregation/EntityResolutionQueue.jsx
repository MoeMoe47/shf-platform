import React from "react";
import { getEntityResolutionItems } from "./adapters";

function verificationBadgeClass(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "verified") return "is-verified";
  if (normalized === "pending") return "is-pending";
  if (normalized === "disputed") return "is-disputed";
  if (normalized === "rejected") return "is-rejected";
  return "is-neutral";
}

function confidenceBadgeClass(score) {
  const value = Number(score || 0);

  if (value >= 90) return "is-verified";
  if (value >= 75) return "is-medium";
  return "is-low";
}

export default function EntityResolutionQueue() {
  const items = getEntityResolutionItems();

  return (
    <section className="admin-aggregation-queue">
      <div className="admin-aggregation-queue__header">
        <div>
          <p className="admin-aggregation-queue__eyebrow">Canonical Entity Review</p>
          <h2 className="admin-aggregation-queue__title">Entity Resolution Queue</h2>
          <p className="admin-aggregation-queue__subtitle">
            First-pass entity resolution items aligned to the shared organization contract.
          </p>
        </div>
      </div>

      <div className="admin-aggregation-queue__table-wrap">
        <table className="admin-aggregation-queue__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>County</th>
              <th>Status</th>
              <th>Confidence</th>
              <th>Verification</th>
              <th>Lineage</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.county}</td>
                <td>{item.status}</td>
                <td>
                  <span
                    className={[
                      "admin-aggregation-badge",
                      confidenceBadgeClass(item.confidenceScore),
                    ].join(" ")}
                  >
                    {item.confidenceScore}
                  </span>
                </td>
                <td>
                  <span
                    className={[
                      "admin-aggregation-badge",
                      verificationBadgeClass(item.verificationState),
                    ].join(" ")}
                  >
                    {item.verificationState}
                  </span>
                </td>
                <td>{item.lineageId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
