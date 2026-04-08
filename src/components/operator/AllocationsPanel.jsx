import React from "react";
import { fetchAllocations } from "@/lib/operatorDataApi";

export default function AllocationsPanel() {
  const [allocations, setAllocations] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let live = true;
    fetchAllocations()
      .then((d) => {
        if (!live) return;
        setAllocations(d.allocations || []);
        setError("");
      })
      .catch((e) => {
        if (!live) return;
        setError(e.message || "Failed to load allocations");
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
        <h3 style={{ margin: 0 }}>Allocations</h3>
        <span style={{ opacity: 0.7 }}>{allocations.length} total</span>
      </div>
      {loading ? <div>Loading allocations…</div> : null}
      {error ? <div style={{ color: "#ff8080" }}>{error}</div> : null}
      {!loading && !error ? (
        <div style={scrollWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Contract</th>
                <th style={th}>Max</th>
                <th style={th}>Issued</th>
                <th style={th}>Settled</th>
                <th style={th}>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a) => (
                <tr key={a.id}>
                  <td style={td}>{a.contract_code || a.contract_id}</td>
                  <td style={td}>{a.max_contracts}</td>
                  <td style={td}>{a.issued_count}</td>
                  <td style={td}>{a.settled_count}</td>
                  <td style={td}>{a.remaining_capacity}</td>
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
