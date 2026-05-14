import React from "react";
import { useSearchParams } from "react-router-dom";

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "general"; // general | keys | alerts

  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Settings</h1>
          <p className="db-subtitle">Configure Treasury behavior and chain integrations</p>
        </div>
        <div className="db-headR" style={{display:"flex",gap:8}}>
          <button className={`btn ${tab==="general"?"btn--primary":""}`} onClick={() => setParams({ tab:"general" })}>General</button>
          <button className={`btn ${tab==="keys"   ?"btn--primary":""}`} onClick={() => setParams({ tab:"keys"    })}>Keys</button>
          <button className={`btn ${tab==="alerts" ?"btn--primary":""}`} onClick={() => setParams({ tab:"alerts"  })}>Alerts</button>
        </div>
      </header>

      {tab === "general" && (
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>General</h3>
          <label className="db-subtitle">Default Range</label>
          <select className="sh-select" defaultValue="30d">
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
          </select>
        </div>
      )}

      {tab === "keys" && (
        <div className="db-grid">
          <div className="card card--pad">
            <h3 style={{marginTop:0}}>Polygon</h3>
            <label className="db-subtitle">RPC URL</label>
            <input className="sh-input" placeholder="https://polygon.rpc.example" />
            <label className="db-subtitle" style={{marginTop:8}}>Chain ID</label>
            <input className="sh-input" defaultValue="137" />
            <label className="db-subtitle" style={{marginTop:8}}>Signer Key</label>
            <input className="sh-input" placeholder="0x…" />
            <div style={{marginTop:10, display:"flex", gap:8}}>
              <button className="btn btn--primary">Save</button>
              <button className="btn">Test Connection</button>
            </div>
          </div>
          <div className="card card--pad">
            <h3 style={{marginTop:0}}>Webhooks</h3>
            <label className="db-subtitle">Callback URL</label>
            <input className="sh-input" placeholder="https://your.app/hooks/treasury" />
            <div style={{marginTop:10}}>
              <button className="btn">Send Test Event</button>
            </div>
          </div>
        </div>
      )}

      {tab === "alerts" && (
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Alerts</h3>
          <label><input type="checkbox" defaultChecked /> Batch failures</label><br/>
          <label><input type="checkbox" defaultChecked /> Large outflows</label><br/>
          <label><input type="checkbox" /> New donations</label>
          <div style={{marginTop:10}}>
            <button className="btn btn--primary">Update Alerts</button>
          </div>
        </div>
      )}
    </section>
  );
}
