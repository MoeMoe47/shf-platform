import React from "react";
import { getLineageItems } from "./adapters";

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
        {items.map((item) => (
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
          </article>
        ))}
      </div>
    </section>
  );
}
