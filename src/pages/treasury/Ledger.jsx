import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

const ROWS = [
  { id:"TX-1048", date:"2025-10-21", memo:"EVU: Career Launchpad v1.2", program:"grants",    amt:+3200,  asset:"A-1001", chain:"0xabc…91e" },
  { id:"TX-1047", date:"2025-10-18", memo:"Grant: STEM Rural Pilot",    program:"grants",    amt:-15000, asset:"A-1002", chain:"0x7de…2f1" },
  { id:"TX-1046", date:"2025-10-16", memo:"Donation: Corporate Match",  program:"donations", amt:+2100,  asset:null,      chain:"0xa04…9b2" },
];

export default function Ledger() {
  const [params, setParams] = useSearchParams();
  const view   = params.get("view");         // grants | donations | reports
  const range  = params.get("range") || "all"; // 30d | all
  const asset  = params.get("asset");

  const loc = useLocation();
  React.useEffect(() => {
    if (loc.hash === "#export") {
      const el = document.getElementById("ledger-export");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loc.hash]);

  let list = [...ROWS];
  if (view)  list = list.filter(r => r.program === view);
  if (asset) list = list.filter(r => r.asset === asset);

  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Ledger</h1>
          <p className="db-subtitle">Transactions by program, asset, and date</p>
        </div>
        <div className="db-headR" style={{display:"flex",gap:8}}>
          <button className="btn" onClick={() => setParams({})}>All</button>
          <button className="btn" onClick={() => setParams({ view:"grants" })}>Grants</button>
          <button className="btn" onClick={() => setParams({ view:"donations" })}>Donations</button>
          <button className="btn" onClick={() => setParams({ range:"30d" })}>Last 30d</button>
          <a href="#export" className="btn btn--primary">Export</a>
        </div>
      </header>

      <div className="card card--pad">
        <div className="table-wrap">
          <table className="sh-table">
            <thead>
              <tr>
                <th align="left">Date</th>
                <th align="left">Memo</th>
                <th align="left">Program</th>
                <th align="right">Amount</th>
                <th align="left">Asset</th>
                <th align="left">Chain</th>
                <th align="left">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.memo}</td>
                  <td>{r.program}</td>
                  <td className={`num ${r.amt >= 0 ? "pos" : "neg"}`}>{r.amt.toLocaleString()}</td>
                  <td>{r.asset ?? "—"}</td>
                  <td><code style={{fontSize:12}}>{r.chain}</code></td>
                  <td>
                    <Link className="btn" to={`/transaction/${r.id}`}>Details</Link>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={7} style={{textAlign:"center", color:"var(--ink-soft)"}}>No matching entries.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div id="export" className="card card--pad" style={{marginTop:12}}>
        <h3 style={{marginTop:0}}>Export</h3>
        <p className="db-subtitle">Download CSV for the current view (filters & range applied).</p>
        <div style={{display:"flex", gap:8}}>
          <button className="btn">Export CSV</button>
          <button className="btn">Export JSON</button>
        </div>
      </div>
    </section>
  );
}
