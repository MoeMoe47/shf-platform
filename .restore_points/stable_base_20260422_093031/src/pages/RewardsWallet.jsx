// src/pages/RewardsWallet.jsx
import React, { useState } from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";
import { rateTable, toSHF } from "@/utils/creditMath.js";

export default function RewardsWallet() {
  const credit = useCreditCtx();
  const { balances = {}, score = 620, logs = [], convert } = credit || {};
  const [bundle, setBundle] = useState({ corn: 0, wheat: 0, heart: 0, rocket: 0 });

  const estSHF = toSHF(bundle);

  function setVal(k, v) {
    setBundle((b) => ({
      ...b,
      [k]: Math.max(0, Math.min(Number(v || 0), Number(balances[k] || 0))),
    }));
  }

  return (
    <div className="page pad" style={{ display: "grid", gap: 12 }}>
      <div className="card card--pad">
        <h2 className="h3" style={{ marginTop: 0 }}>Wallet</h2>
        <div className="subtle">Score: <strong>{score}</strong></div>
        <div
          className="sh-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 8 }}
        >
          {["corn", "wheat", "heart", "rocket", "shf"].map((k) => (
            <div key={k} className="pathRow" style={{ display: "grid", gap: 4 }}>
              <div style={{ fontWeight: 600, textTransform: "uppercase" }}>{k}</div>
              <div>{Number(balances[k] || 0).toLocaleString()}</div>
              {k !== "shf" && (
                <div style={{ fontSize: 12 }} className="subtle">
                  → rate: {rateTable[k]} SHF / {k}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card card--pad">
        <h3 className="h4" style={{ marginTop: 0 }}>Convert to SHF</h3>
        <div
          className="sh-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}
        >
          {["corn", "wheat", "heart", "rocket"].map((k) => (
            <label key={k} style={{ display: "grid", gap: 4 }}>
              <span className="subtle">
                {k} (max {Number(balances[k] || 0)})
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={bundle[k]}
                onChange={(e) => setVal(k, e.target.value)}
                className="sh-input"
              />
            </label>
          ))}
        </div>
        <div className="subtle" style={{ marginTop: 8 }}>
          Estimated: <strong>{estSHF}</strong> SHF
        </div>
        <div className="sh-actionsRow" style={{ marginTop: 8 }}>
          <button className="sh-btn" onClick={() => convert(bundle)}>Convert</button>
          <button
            className="sh-btn sh-btn--secondary"
            onClick={() => setBundle({ corn: 0, wheat: 0, heart: 0, rocket: 0 })}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="card card--pad">
        <h3 className="h4" style={{ marginTop: 0 }}>Recent activity</h3>
        {!logs.length ? (
          <div className="subtle">No ledger entries yet.</div>
        ) : (
          <ul className="sh-listPlain" style={{ display: "grid", gap: 6 }}>
            {logs.slice(0, 20).map((r, idx) => {
              const when = r.ts ? new Date(r.ts).toLocaleString() : "";
              const label = r.action || r.type || "event";
              const deltaShf =
                typeof r.shfGain === "number"
                  ? r.shfGain
                  : typeof r.currencyDelta === "number"
                  ? r.currencyDelta
                  : 0;
              const tokenSummary = r.tokens
                ? Object.entries(r.tokens)
                    .map(([k, v]) => `${Number(v) > 0 ? "+" : ""}${v} ${k}`)
                    .join(", ")
                : "";
              const scoreDelta =
                typeof r.scoreDelta === "number"
                  ? r.scoreDelta
                  : typeof r.credits === "number"
                  ? r.credits
                  : 0;

              let rightCol = "";
              if (deltaShf) rightCol = `${deltaShf > 0 ? "+" : ""}${deltaShf} SHF`;
              else if (tokenSummary) rightCol = tokenSummary;
              else if (scoreDelta) rightCol = `${scoreDelta > 0 ? "+" : ""}${scoreDelta} score`;

              return (
                <li
                  key={r.id || `${r.ts}-${idx}`}
                  className="pathRow"
                  style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center" }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{label}</div>
                    <div className="subtle" style={{ fontSize: 12 }}>
                      {when}
                    </div>
                  </div>
                  <div>{rightCol}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
