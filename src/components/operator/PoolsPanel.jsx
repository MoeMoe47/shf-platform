import React from "react";
import { fetchPoolBalances } from "@/lib/operatorDataApi";

export default function PoolsPanel() {
  const [balances, setBalances] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let live = true;
    fetchPoolBalances()
      .then((d) => {
        if (!live) return;
        setBalances(d.balances || []);
        setError("");
      })
      .catch((e) => {
        if (!live) return;
        setError(e.message || "Failed to load pool balances");
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
        <h3 style={{ margin: 0 }}>Pool Balances</h3>
        <span style={{ opacity: 0.7 }}>{balances.length} pools</span>
      </div>
      {loading ? <div>Loading pool balances…</div> : null}
      {error ? <div style={{ color: "#ff8080" }}>{error}</div> : null}
      {!loading && !error ? (
        <div style={scrollWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Pool</th>
                <th style={th}>Committed</th>
                <th style={th}>Reserved</th>
                <th style={th}>Settled</th>
                <th style={th}>Available</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((p) => (
                <tr key={p.pool_id}>
                  <td style={td}>{p.pool_id}</td>
                  <td style={td}>${Number(p.committed_amount || 0).toLocaleString()}</td>
                  <td style={td}>${Number(p.reserved_amount || 0).toLocaleString()}</td>
                  <td style={td}>${Number(p.settled_amount || 0).toLocaleString()}</td>
                  <td style={td}>${Number(p.available_amount || 0).toLocaleString()}</td>
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
const table = { width: "100%", minWidth: 620, borderCollapse: "collapse" };
const th = { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.12)", whiteSpace: "nowrap" };
const td = { padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" };
