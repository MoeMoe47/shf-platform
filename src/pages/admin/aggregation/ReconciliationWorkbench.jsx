import React, { useEffect, useMemo, useState } from "react";
import ReconciliationStatusPill from "@/components/aggregation/ReconciliationStatusPill";
import { getReconciliationItems } from "./adapters";
import { fetchOracleTruth } from "../reporting/oracle-backend-adapter";
import { buildOracleRowReadiness, oracleReadinessClass } from "./oracle-row-readiness";

function priorityBadgeClass(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "high") return "is-high";
  if (normalized === "medium") return "is-medium";
  if (normalized === "low") return "is-low";
  return "is-neutral";
}

function statusBadgeClass(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "accepted" || normalized === "completed") return "is-verified";
  if (normalized === "blocked") return "is-rejected";
  if (normalized === "queued" || normalized === "in_progress") return "is-pending";
  return "is-neutral";
}

function oracleBadgeClass(value) {
  const normalized = String(value || "").toLowerCase();

  if (
    normalized === "certified" ||
    normalized === "verified" ||
    normalized === "funder_ready" ||
    normalized === "public_ready" ||
    normalized === "leadership_ready" ||
    normalized === "resolved"
  ) {
    return "is-verified";
  }

  if (
    normalized === "blocked" ||
    normalized === "disputed" ||
    normalized === "unresolved_conflict" ||
    normalized === "escalated"
  ) {
    return "is-rejected";
  }

  if (
    normalized === "candidate" ||
    normalized === "not_ready" ||
    normalized === "internally_ready" ||
    normalized === "minor_conflict"
  ) {
    return "is-pending";
  }

  return "is-neutral";
}

export default function ReconciliationWorkbench() {
  const items = useMemo(() => getReconciliationItems(), []);
  const [oracleTruth, setOracleTruth] = useState(null);
  const [oracleError, setOracleError] = useState("");

  const activeEntityId = items?.[0]?.id || "test_case_001";

  useEffect(() => {
    let isActive = true;

    setOracleError("");

    fetchOracleTruth(activeEntityId)
      .then((data) => {
        if (!isActive) return;
        setOracleTruth(data);
      })
      .catch((err) => {
        if (!isActive) return;
        setOracleTruth(null);
        setOracleError(err instanceof Error ? err.message : "Oracle unavailable");
      });

    return () => {
      isActive = false;
    };
  }, [activeEntityId]);

  return (
    <section className="admin-aggregation-reconciliation">
      <div className="admin-aggregation-reconciliation__header">
        <div>
          <p className="admin-aggregation-reconciliation__eyebrow">Conflict + Alignment Review</p>
          <h2 className="admin-aggregation-reconciliation__title">Reconciliation Workbench</h2>
          <p className="admin-aggregation-reconciliation__subtitle">
            Referral-level reconciliation items aligned to the shared contract layer.
          </p>
        </div>
      </div>

      <div
        style={{
          marginBottom: 16,
          padding: 14,
          borderRadius: 14,
          border: "1px solid rgba(59,130,246,0.24)",
          background: "rgba(15, 23, 42, 0.88)",
          color: "rgba(226, 232, 240, 0.98)",
          boxShadow: "0 10px 24px rgba(2, 6, 23, 0.16)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(148, 163, 184, 0.86)",
              }}
            >
              Oracle Read-Back
            </p>
            <h3
              style={{
                margin: "6px 0 0",
                fontSize: 24,
                lineHeight: 1.1,
                color: "rgba(241, 245, 249, 0.98)",
              }}
            >
              Certified Reconciliation State
            </h3>
          </div>

          <span
            className={[
              "admin-aggregation-badge",
              oracleBadgeClass(oracleTruth?.truthStatus || "pending"),
            ].join(" ")}
          >
            {oracleTruth?.truthStatus || "pending"}
          </span>
        </div>

        {oracleError ? (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(239, 68, 68, 0.22)",
              background: "rgba(127, 29, 29, 0.14)",
              color: "rgba(254, 202, 202, 0.98)",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {oracleError}
          </div>
        ) : oracleTruth ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.12)",
                background: "rgba(2, 6, 23, 0.18)",
              }}
            >
              <div style={{ fontSize: 12, color: "rgba(148, 163, 184, 0.86)" }}>Truth Status</div>
              <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{oracleTruth.truthStatus}</div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.12)",
                background: "rgba(2, 6, 23, 0.18)",
              }}
            >
              <div style={{ fontSize: 12, color: "rgba(148, 163, 184, 0.86)" }}>Confidence</div>
              <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>
                {oracleTruth.confidenceScore} ({oracleTruth.confidenceBand})
              </div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.12)",
                background: "rgba(2, 6, 23, 0.18)",
              }}
            >
              <div style={{ fontSize: 12, color: "rgba(148, 163, 184, 0.86)" }}>Contradiction Status</div>
              <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{oracleTruth.contradictionStatus}</div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.12)",
                background: "rgba(2, 6, 23, 0.18)",
              }}
            >
              <div style={{ fontSize: 12, color: "rgba(148, 163, 184, 0.86)" }}>Readiness</div>
              <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{oracleTruth.readinessStatus}</div>
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.12)",
                background: "rgba(2, 6, 23, 0.18)",
              }}
            >
              <div style={{ fontSize: 12, color: "rgba(148, 163, 184, 0.86)" }}>Recommended Next Action</div>
              <div style={{ marginTop: 6, fontSize: 15, lineHeight: 1.5, fontWeight: 600 }}>
                {oracleTruth.recommendedNextAction || "—"}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 13,
              color: "rgba(191, 219, 254, 0.95)",
            }}
          >
            Loading Oracle reconciliation truth…
          </div>
        )}
      </div>

      <div className="admin-aggregation-reconciliation__table-wrap">
        <table className="admin-aggregation-reconciliation__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>County</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Confidence</th>
              <th>Operator Signal</th>
              <th>Oracle Readiness</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const oracleReadiness = buildOracleRowReadiness({
                type: "reconciliation",
                status: item.status,
                confidenceScore: item.confidenceScore,
              });

              return (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.county}</td>
                <td>
                  <span
                    className={[
                      "admin-aggregation-badge",
                      statusBadgeClass(item.status),
                    ].join(" ")}
                  >
                    {item.status}
                  </span>
                </td>
                <td>
                  <span
                    className={[
                      "admin-aggregation-badge",
                      priorityBadgeClass(item.priority),
                    ].join(" ")}
                  >
                    {item.priority}
                  </span>
                </td>
                <td>{item.confidenceScore}</td>
                <td>
                  <ReconciliationStatusPill
                    status={item.status}
                    priority={item.priority}
                    confidenceScore={item.confidenceScore}
                  />
                </td>
                <td>
                  <span
                    className={[
                      "admin-aggregation-oracle-ready",
                      oracleReadinessClass(oracleReadiness.tone),
                    ].join(" ")}
                    title={oracleReadiness.nextAction}
                  >
                    {oracleReadiness.label}
                  </span>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
