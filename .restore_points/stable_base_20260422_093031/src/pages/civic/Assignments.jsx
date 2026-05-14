import React from "react";
import { Link } from "react-router-dom";
import data from "@/data/civic/micro-lessons.v1.json";

function Row({ item }) {
  return (
    <li className="card card--pad" style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center"}}>
      <div>
        <div style={{display:"flex",alignItems:"baseline",gap:8}}>
          <strong>{item.title || item.id}</strong>
          {item.estMinutes ? <span className="sh-badge is-ghost">~{item.estMinutes}m</span> : null}
        </div>
        {item.summary ? <p className="sh-muted" style={{marginTop:4}}>{item.summary}</p> : null}
      </div>
      <Link className="sh-btn" to={`/lesson?id=${encodeURIComponent(item.id)}`}>Open</Link>
    </li>
  );
}

export default function CivicAssignments() {
  const items = Array.isArray(data) ? data : data?.items || [];
  return (
    <section className="crb-main">
      <header className="db-head">
        <div>
          <h1 className="db-title">Assignments</h1>
          <p className="db-subtitle">Your micro-lessons and civic missions.</p>
        </div>
      </header>
      <ul style={{listStyle:"none",padding:0,display:"grid",gap:8}}>
        {items.map(item => <Row key={item.id} item={item} />)}
      </ul>
    </section>
  );
}
