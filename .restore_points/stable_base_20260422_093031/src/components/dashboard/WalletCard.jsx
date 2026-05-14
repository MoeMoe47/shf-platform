// src/components/dashboard/WalletCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function WalletCard() {
  const credit = useCreditCtx();
  const { balances = {}, score = 620, convert } = credit || {};

  return (
    <section className="card card--pad" role="region" aria-label="Wallet">
      <div className="sh-row" style={{ alignItems: "baseline" }}>
        <h3 className="h4" style={{ margin: 0 }}>Wallet</h3>
        <div style={{ flex: 1 }} />
        <Link className="sh-linkBtn" to="/wallet">Open wallet →</Link>
      </div>

      <div className="sh-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginTop: 8 }}>
        <Stat label="SHF" value={Number(balances.shf || 0)} strong />
        <Stat label="🌽 Corn" value={Number(balances.corn || 0)} />
        <Stat label="🌾 Wheat" value={Number(balances.wheat || 0)} />
        <Stat label="❤️ Hearts" value={Number(balances.heart || 0)} />
        <Stat label="🚀 Rockets" value={Number(balances.rocket || 0)} />
      </div>

      <div className="subtle" style={{ marginTop: 8 }}>
        Score: <strong>{score}</strong>
      </div>

      <div className="sh-actionsRow" style={{ marginTop: 8 }}>
        <button
          className="sh-btn sh-btn--secondary"
          onClick={() => convert({ corn: 10 })}
          disabled={Number(balances.corn || 0) < 10}
          title="Convert 10 corn → SHF"
        >
          Quick convert: 10 🌽 → SHF
        </button>
        <button
          className="sh-btn sh-btn--secondary"
          onClick={() => convert({ wheat: 5 })}
          disabled={Number(balances.wheat || 0) < 5}
          title="Convert 5 wheat → SHF"
        >
          Quick convert: 5 🌾 → SHF
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value, strong = false }) {
  return (
    <div className="pathRow" style={{ display: "grid", gap: 2 }}>
      <div className="subtle" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: strong ? 700 : 600 }}>{value.toLocaleString()}</div>
    </div>
  );
}
