// src/pages/sales/DealDetails.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";

export default function DealDetails(){
  const { id } = useParams();
  return (
    <section className="db-shell">
      <header className="db-head">
        <div><h1 className="db-title">Deal {id}</h1><p className="db-subtitle">Opportunity details</p></div>
        <div className="db-headR"><Link className="btn" to="/pipeline">Back to Pipeline</Link></div>
      </header>
      <div className="card card--pad">Details coming soon.</div>
    </section>
  );
}
