import React from "react";
import { useSearchParams } from "react-router-dom";

const BATCHES = [
  { id:"B-2201", date:"2025-10-20", items: 12, root:"0xd1a…33f", status:"confirmed" },
  { id:"B-2200", date:"2025-10-13", items:  9, root:"0x4ac…77a", status:"confirmed" },
  { id:"B-2199", date:"2025-10-07", items: 15, root:"0x91b…0d2", status:"pending"   },
];

export default function Proofs() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "batches"; // batches | health

  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Chain Proofs</h1>
          <p className="db-subtitle">Polygon mirror with Merkle roots and batch health</p>
        </div>
        <div className="db-headR" style={{display:"flex",gap:8}}>
          <button className={`btn ${tab==="batches"?"btn--primary":""}`} onClick={() => setParams({ tab:"batches" })}>Batches</button>
          <button className={`btn ${tab==="health" ?"btn--primary":""}`} onClick={() => setParams({ tab:"health"  })}>Health</button>
        </div>
      </header>

      {tab === "batches" && (
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Recent Batches</h3>
          <div className="table-wrap">
            <table className="sh-table">
              <thead>
                <tr><th>Date</th><th>Items</th><th>Merkle Root</th><th>Status</th></tr>
              </thead>
              <tbody>
                {BATCHES.map(b => (
                  <tr key={b.id}>
                    <td>{b.date}</td>
                    <td className="num">{b.items}</td>
                    <td><code style={{fontSize:12}}>{b.root}</code></td>
                    <td>{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:10, display:"flex", gap:8}}>
            <button className="btn btn--primary">Create Batch</button>
            <button className="btn">Verify Root</button>
          </div>
        </div>
      )}

      {tab === "health" && (
        <div className="db-grid">
          <div className="card card--pad">
            <h3 style={{marginTop:0}}>Proof Health</h3>
            <ul style={{margin:0, paddingLeft:18, lineHeight:1.7}}>
              <li>Confirmation time: <strong>~14s</strong></li>
              <li>Batch success rate (30d): <strong>98%</strong></li>
              <li>Reorg risk: <strong>Low</strong></li>
            </ul>
          </div>
          <div className="card card--pad">
            <h3 style={{marginTop:0}}>Keys & Config</h3>
            <p className="db-subtitle">Manage RPC, chain ID, and signer keys in Settings.</p>
            <button className="btn" onClick={() => setParams({})}>Back to Batches</button>
          </div>
        </div>
      )}
    </section>
  );
}
