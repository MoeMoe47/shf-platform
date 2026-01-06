import React from "react";
export default function Help(){
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Help & Docs</h1>
          <p className="db-subtitle">Jobs, pipeline, interviews</p>
        </div>
        <div className="db-headR">
          <a className="btn" href="/employer.html#/__docs">Open Dev Docs</a>
        </div>
      </header>
      <div className="card card--pad">FAQ and contact…</div>
    </section>
  );
}
