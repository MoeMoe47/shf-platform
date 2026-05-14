import React from "react";
import { getVerificationItems } from "./adapters";

function verificationBadgeClass(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "verified") return "is-verified";
  if (normalized === "pending") return "is-pending";
  if (normalized === "disputed") return "is-disputed";
  if (normalized === "rejected") return "is-rejected";
  return "is-neutral";
}

export default function VerificationWorkbench() {
  const items = getVerificationItems();

  return (
    <section className="admin-aggregation-verification">
      <div className="admin-aggregation-verification__header">
        <div>
          <p className="admin-aggregation-verification__eyebrow">Trust + Review Actions</p>
          <h2 className="admin-aggregation-verification__title">Verification Workbench</h2>
          <p className="admin-aggregation-verification__subtitle">
            Verification records aligned to the shared trust contract and review workflow.
          </p>
        </div>
      </div>

      <div className="admin-aggregation-verification__table-wrap">
        <table className="admin-aggregation-verification__table">
          <thead>
            <tr>
              <th>Target Type</th>
              <th>Target ID</th>
              <th>Verification</th>
              <th>Verified By</th>
              <th>Verified At</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.targetEntityType}</td>
                <td>{item.targetEntityId}</td>
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
                <td>{item.verifiedBy}</td>
                <td>{item.verifiedAt}</td>
                <td>{item.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
