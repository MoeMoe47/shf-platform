import React from "react";
export default function Pipeline(){
  const stages = ["Sourced","Screen","Interview","Offer","Hired"];
  return (
    <section className="db-shell">
      <header className="db-head"><div><h1 className="db-title">Pipeline</h1></div></header>
      <div className="db-grid" style={{gridTemplateColumns:"repeat(5,minmax(220px,1fr))"}}>
        {stages.map(s => (
          <div key={s} className="card card--pad">
            <h3 style={{marginTop:0}}>{s}</h3>
            <div className="db-subtitle">0 items (wire data)</div>
          </div>
        ))}
      </div>
    </section>
  );
}
