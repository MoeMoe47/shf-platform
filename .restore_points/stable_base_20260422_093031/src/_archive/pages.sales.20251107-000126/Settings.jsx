// src/pages/sales/Settings.jsx
import React from "react";
export default function Settings(){
  return (
    <section className="db-shell">
      <header className="db-head"><div><h1 className="db-title">Settings</h1><p className="db-subtitle">Team & integrations</p></div></header>
      <div className="db-grid">
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Integrations</h3>
          <button className="btn">Connect CRM</button>
        </div>
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Notifications</h3>
          <label><input type="checkbox" defaultChecked/> Daily digest</label>
        </div>
      </div>
    </section>
  );
}
