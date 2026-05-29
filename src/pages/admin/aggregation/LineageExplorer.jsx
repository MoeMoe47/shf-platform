import React from "react";
import LineageTraceButton from "@/components/aggregation/LineageTraceButton";
import { getLineageItems } from "./adapters";
import { buildOracleRowReadiness, oracleReadinessClass } from "./oracle-row-readiness";

function lineageSignal(item) {
  const hasTrace = Boolean(item.lineageId);
  const sourceCount = Number(item.sourceCount || 0);
  const freshness = String(item.freshness || "").toLowerCase();

  if (hasTrace && sourceCount > 0 && !freshness.includes("stale")) {
    return { label: "Trace Ready", tone: "ready" };
  }

  if (hasTrace && sourceCount > 0) {
    return { label: "Review Freshness", tone: "review" };
  }

  return { label: "Trace Missing", tone: "blocked" };
}

export default function LineageExplorer() {
  const items = getLineageItems();

  return (
    <section className="admin-aggregation-lineage">
      <div className="admin-aggregation-lineage__header">
        <div>
          <p className="admin-aggregation-lineage__eyebrow">Provenance + Trust Trace</p>
          <h2 className="admin-aggregation-lineage__title">Lineage Explorer</h2>
          <p className="admin-aggregation-lineage__subtitle">
            First-pass lineage objects showing source count, freshness, and trace IDs from the shared contract layer.
          </p>
        </div>
      </div>

      <div className="admin-aggregation-lineage__grid">
        {items.map((item) => {
          const signal = lineageSignal(item);
          const oracleReadiness = buildOracleRowReadiness({
            type: "lineage",
            lineageId: item.lineageId,
            sourceCount: item.sourceCount,
            freshness: item.freshness,
          });

          return (
            <article key={`${item.type}-${item.id}`} className="admin-aggregation-lineage__card">
              <div className="admin-aggregation-lineage__top">
                <span className="admin-aggregation-lineage__type">{item.type}</span>
                <strong className="admin-aggregation-lineage__name">{item.title}</strong>
              </div>

              <div className="admin-aggregation-lineage__meta">
                <div>
                  <span className="admin-aggregation-lineage__meta-label">Lineage ID</span>
                  <strong>{item.lineageId}</strong>
                </div>
                <div>
                  <span className="admin-aggregation-lineage__meta-label">Sources</span>
                  <strong>{item.sourceCount}</strong>
                </div>
                <div>
                  <span className="admin-aggregation-lineage__meta-label">Freshness</span>
                  <strong>{item.freshness}</strong>
                </div>
              </div>

              <div className="admin-aggregation-lineage__oracle">
                <span
                  className={[
                    "admin-aggregation-oracle-ready",
                    oracleReadinessClass(oracleReadiness.tone),
                  ].join(" ")}
                  title={oracleReadiness.nextAction}
                >
                  {oracleReadiness.label}
                </span>
              </div>

              <div className="admin-aggregation-lineage__actions">
                <span
                  className={[
                    "admin-aggregation-signal-pill",
                    `admin-aggregation-signal-pill--${signal.tone}`,
                  ].join(" ")}
                >
                  {signal.label}
                </span>
                <LineageTraceButton lineageId={item.lineageId} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
