import React from "react";
import { fetchContracts } from "@/lib/operatorDataApi";

export default function ContractsPanel() {
  const [contracts, setContracts] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let live = true;
    fetchContracts()
      .then((d) => {
        if (!live) return;
        setContracts(d.contracts || []);
        setError("");
      })
      .catch((e) => {
        if (!live) return;
        setError(e.message || "Failed to load contracts");
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
        <h3 style={{ margin: 0 }}>Contracts</h3>
        <span style={{ opacity: 0.7 }}>{contracts.length} total</span>
      </div>
      {loading ? <div>Loading contracts…</div> : null}
      {error ? <div style={{ color: "#ff8080" }}>{error}</div> : null}
      {!loading && !error ? (
        <div style={scrollWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Code</th>
                <th style={th}>Status</th>
                <th style={th}>Payout</th>
                <th style={th}>Fulfilled</th>
                <th style={th}>Pool</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td style={td}>{c.contract_code}</td>
                  <td style={td}>{c.status}</td>
                  <td style={td}>${Number(c.payout_amount || 0).toLocaleString()}</td>
                  <td style={td}>{c.fulfilled_count}</td>
                  <td style={td}>{c.pool_id || "—"}</td>
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
const table = { width: "100%", minWidth: 520, borderCollapse: "collapse" };
const th = { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", whiteSpace: "nowrap" };
const td = { padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" };
