// src/pages/Marketplace.jsx
import React from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";
import { usd } from "@/utils/creditMath.js";
import PriceTag from "@/components/PriceTag.jsx";
import items from "@/data/marketplace.json";
import { href } from "@/router/paths.js"; // ✅ cross-app links

export default function Marketplace() {
  const credit = useCreditCtx();
  const { balances = {}, score = 620, priceFor, spend } = credit || {};

  const onBuy = (item) => {
    const { price } = priceFor(item.msrp, score); // tier-adjusted SHF price (1 SHF ≈ $1)
    const res = spend?.(
      price,
      { itemId: item.id, title: item.title, msrp: item.msrp },
      "market.buy"
    );
    if (!res?.ok) {
      alert(res?.error || "Could not complete purchase.");
      return;
    }
    alert(`Purchased ${item.title} for ${usd(price)} (remaining SHF: ${res.remaining})`);
  };

  return (
    <div className="page pad" style={{ display: "grid", gap: 12 }}>
      <div className="card card--pad">
        <h2 className="h3" style={{ marginTop: 0 }}>Marketplace</h2>
        <div className="subtle">
          Your SHF: <strong>{Number(balances.shf || 0)}</strong> · Score: <strong>{score}</strong>
        </div>

        {/* NEW: quick paths to Foundation & Solutions */}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <a href={href.foundation("/top")} className="btn pill" title="Go to Foundation">
            🏛️ Foundation
          </a>
          <a href={href.solutions("/top")} className="btn pill" title="Go to Solutions">
            🧩 Solutions
          </a>
        </div>
      </div>

      <div className="card card--pad">
        <div className="clusterGrid">
          {items.map((it) => (
            <article
              key={it.id}
              className="pathRow"
              style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10 }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{it.title}</div>
                <div className="subtle" style={{ fontSize: 12 }}>
                  MSRP {usd(it.msrp)} · <PriceTag msrp={it.msrp} compact />
                </div>
              </div>
              <button className="sh-btn" onClick={() => onBuy(it)}>Buy</button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
