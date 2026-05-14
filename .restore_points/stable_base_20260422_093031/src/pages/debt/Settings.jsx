// src/pages/debt/Settings.jsx
import React from "react";

export default function Settings() {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Settings</h1>
          <p className="db-subtitle">Alerts, rounding, and data connections</p>
        </div>
      </header>

      <div className="db-grid">
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Alerts</h3>
          <label><input type="checkbox" defaultChecked /> Payment due reminders</label><br/>
          <label><input type="checkbox" /> Large interest spikes</label><br/>
          <button className="btn btn--primary" style={{marginTop:8}}>Save</button>
        </div>

        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Bank Connections</h3>
          <button className="btn">Connect Plaid</button>
        </div>
      </div>
    </section>
  );
}
