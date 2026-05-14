import React from "react";
import { fetchLedger } from "@/lib/operatorDataApi";

export default function LedgerPanel() {
  const [entries, setEntries] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let live = true;
    fetchLedger(25)
      .then((d) => {
        if (!live) return;
        setEntries(d.entries || []);
        setError("");
      })
      .catch((e) => {
        if (!live) return;
        setError(e.message || "Failed to load ledger");
      })
      .finally(() => {
        if (!live) return;
        setLoading(false);
      });
    return () => { live = false; };
  }, []);

  return (
    <section style={card}>
      <div style={head}>
        <h3 style={{ margin: 0 }}>Treasury Ledger</h3>
        <span style={{ opacity: 0.7 }}>{entries.length} entries</span>
      </div>
      {loading ? <div>Loading ledger…</div> : null}
      {error ? <div style={{ color: "#ff8080" }}>{error}</div> : null}
      {!loading && !error ? (
        <div style={scrollWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Type</th>
                <th style={th}>Pool</th>
                <th style={th}>Amount</th>
                <th style={th}>Reference</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td style={td}>{e.entry_type}</td>
                  <td style={td}>{e.pool_id}</td>
                  <td style={td}>${Number(e.amount || 0).toLocaleString()}</td>
                  <td style={td}>{e.ref_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

const card = { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 20, background: "rgba(255,255,255,0.04)", overflow: "hidden", minWidth: 0 };
const head = { display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 12, flexWrap: "wrap" };
const scrollWrap = { width: "100%", overflowX: "auto" };
const table = { width: "100%", minWidth: 560, borderCollapse: "collapse" };
const th = { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", whiteSpace: "nowrap" };
const td = { padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" };
