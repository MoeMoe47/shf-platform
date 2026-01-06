import React from "react";
export default function Settings(){
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Settings</h1>
          <p className="db-subtitle">ATS, calendar, and webhooks</p>
        </div>
      </header>
      <div className="db-grid">
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Integrations</h3>
          <button className="btn">Connect Google Calendar</button>
          <button className="btn" style={{marginLeft:8}}>Connect Webhook</button>
        </div>
      </div>
    </section>
  );
}
