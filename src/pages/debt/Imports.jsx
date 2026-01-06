import React from "react";

export default function DebtImports() {
  const [rows, setRows] = React.useState([]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    // naive CSV: name,balance,apr,min
    const out = [];
    for (const line of lines) {
      const [name, bal, apr, min] = line.split(",").map((s) => s?.trim());
      if (!name) continue;
      out.push({
        id: Date.now() + Math.random(),
        name,
        balance: parseFloat(bal || "0"),
        apr: parseFloat(apr || "0"),
        min: parseFloat(min || "0"),
      });
    }
    setRows(out);
  };

  const importToLedger = () => {
    try {
      const raw = localStorage.getItem("debt.ledger");
      const prev = JSON.parse(raw || "[]");
      const merged = [...prev, ...rows];
      localStorage.setItem("debt.ledger", JSON.stringify(merged));
      alert(`Imported ${rows.length} rows to your ledger.`);
    } catch {
      alert("Failed to import.");
    }
  };

  return (
    <div className="page pad" data-page="debt-imports">
      <header className="card card--pad">
        <h1 style={{ margin: 0 }}>Import Debts (CSV)</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-soft)" }}>
          CSV columns: <code>name,balance,apr,min</code>
        </p>
      </header>

      <div className="card card--pad" style={{ display: "grid", gap: 12 }}>
        <input type="file" accept=".csv,text/csv" onChange={onFile} />
        {rows.length > 0 && (
          <>
            <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <table className="sh-table">
                <thead><tr><th>Name</th><th>Balance</th><th>APR</th><th>Min</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>${r.balance.toLocaleString()}</td>
                      <td>{r.apr}%</td>
                      <td>${r.min.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="sh-btn" onClick={importToLedger}>Add to Ledger</button>
          </>
        )}
      </div>
    </div>
  );
}
