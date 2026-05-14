import React from "react";
import { buildOracleTrustView } from "./shf-oracle-trust-adapter";
import { useSHFOracle } from "../hooks/useSHFOracle";

export default function TrustVerificationPanel({
  entityId = null,
  items = [],
  onTrustClick = null,
}) {
  const { truth: hookTruth } = useSHFOracle(entityId || null);
  const oracleView = hookTruth ? buildOracleTrustView(hookTruth) : null;

  const displayItems =
    items && items.length
      ? items
      : [
          {
            label: "Truth Status",
            value: oracleView?.status || "unknown",
          },
          {
            label: "Verification",
            value: oracleView?.verification || "unknown",
          },
          {
            label: "Readiness",
            value: oracleView?.readiness || "unknown",
          },
          {
            label: "Confidence",
            value: oracleView?.confidence || "—",
          },
        ];

  return (
    <section className="shf-panel">
      <div className="shf-panel__header">
        <div>
          <div className="shf-panel__small-label">TRUST + VERIFICATION</div>
          <h2>Proof Layer</h2>
        </div>
      </div>

      <div className="shf-panel__body">
        <div className="shf-trust-grid">
          {displayItems.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="shf-trust-card"
              onClick={() => onTrustClick?.(item)}
            >
              <div className="shf-trust-card__label">{item.label}</div>
              <div className="shf-trust-card__value">{item.value}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
