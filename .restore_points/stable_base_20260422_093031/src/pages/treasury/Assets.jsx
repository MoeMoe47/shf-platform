import React from "react";
import { Link, useSearchParams } from "react-router-dom";

const DEMO_ASSETS = [
  { id:"A-1001", name:"Voiceflow Course IP", type:"ip",        evu:40000, owner:"Foundation" },
  { id:"A-1002", name:"STNA Curriculum",     type:"ip",        evu:52000, owner:"Foundation" },
  { id:"A-1003", name:"Metaverse Parcels",   type:"metaverse", evu: 6800, owner:"Realty" },
  { id:"A-1004", name:"Impact Dataset",      type:"impact",    evu: 9700, owner:"Data Ops" },
];

const typeLabel = (t) => ({ ip:"Curriculum IP", metaverse:"Metaverse", impact:"Impact Data" }[t] || t);

export default function Assets() {
  const [params, setParams] = useSearchParams();
  const type = params.get("type"); // ip | metaverse | impact

  const list = type ? DEMO_ASSETS.filter(a => a.type === type) : DEMO_ASSETS;

  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Assets</h1>
          <p className="db-subtitle">Education Value Units (EVU) across programs</p>
        </div>
        <div className="db-headR" style={{display:"flex",gap:8}}>
          <button className="btn" onClick={() => setParams({})}>All</button>
          <button className="btn" onClick={() => setParams({ type:"ip" })}>IP</button>
          <button className="btn" onClick={() => setParams({ type:"metaverse" })}>Metaverse</button>
          <button className="btn" onClick={() => setParams({ type:"impact" })}>Impact</button>
          <Link to="/proofs?tab=batches" className="btn btn--primary">Batch to Chain</Link>
        </div>
      </header>

      <div className="db-grid">
        {list.map(a => (
          <div key={a.id} className="card card--pad">
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:800}}>{a.name}</div>
                <div style={{fontSize:12,color:"var(--ink-soft)"}}>{typeLabel(a.type)} • Owner: {a.owner}</div>
              </div>
              <div style={{fontWeight:800}}>{a.evu.toLocaleString()} EVU</div>
            </div>
            <div style={{marginTop:10, display:"flex", gap:8}}>
              <Link className="btn" to={`/ledger?asset=${encodeURIComponent(a.id)}`}>View in Ledger</Link>
              <Link className="btn" to={`/proofs?asset=${encodeURIComponent(a.id)}`}>Proofs</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
