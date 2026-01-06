import React from "react";

export default function DebtSnowball() {
  const [extra, setExtra] = React.useState(100);
  const [debts, setDebts] = React.useState([
    { id: 1, name: "Visa", balance: 1200, apr: 22.9, min: 35 },
    { id: 2, name: "Store Card", balance: 600, apr: 25.5, min: 25 },
    { id: 3, name: "Loan", balance: 2400, apr: 9.9, min: 90 },
  ]);

  const ordered = [...debts].sort((a, b) => a.balance - b.balance);
  const totalMin = debts.reduce((s, d) => s + d.min, 0);

  return (
    <div className="page pad" data-page="debt-snowball">
      <header className="card card--pad">
        <h1 style={{ margin: 0 }}>Snowball Calculator</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-soft)" }}>
          Pays off smallest balances first. Add extra payment to accelerate.
        </p>
      </header>

      <div className="card card--pad" style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <span>Extra monthly payment</span>
          <input
            type="number"
            min="0"
            value={extra}
            onChange={(e) => setExtra(parseInt(e.target.value || "0", 10))}
            className="sh-input"
            style={{ width: 140 }}
          />
        </label>

        <div className="card" style={{ padding: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Payoff order</div>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {ordered.map((d) => (
              <li key={d.id} style={{ margin: "6px 0" }}>
                {d.name} — ${d.balance.toLocaleString()} ({d.apr}% APR)
              </li>
            ))}
          </ol>
          <div style={{ marginTop: 10, color: "var(--ink-soft)" }}>
            Paying at least min ${totalMin.toLocaleString()} + extra ${extra.toLocaleString()} each month.
          </div>
        </div>
      </div>
    </div>
  );
}
