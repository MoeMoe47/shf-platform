// src/components/sales/RewardsMarketplace.jsx
// Restored from src/_archive/components.sales.20251107-000126/
// RewardsMarketplace.jsx, with one fix: the original used a blocking
// window.alert() for the redeem confirmation, which would freeze browser
// automation/testing and is generally poor UX — replaced with a
// non-blocking inline status message.
import React from "react";

const partners = [
  { id:"p1", name:"Iron City Gym", offer:"Day Pass", cost:250 },
  { id:"p2", name:"City Library Cafe", offer:"Drink Credit", cost:150 },
  { id:"p3", name:"Makerspace", offer:"Laser Cutter Hour", cost:400 },
];

export default function RewardsMarketplace(){
  const [status, setStatus] = React.useState("");
  const redeem = (p) => setStatus(`Redeemed ${p.offer} at ${p.name} (demo)`);
  return (
    <section className="card card--pad" style={{ display:"grid", gap:10 }}>
      <h3 style={{ margin:0 }}>Rewards Marketplace</h3>
      <ul role="list" style={{ display:"grid", gap:8, margin:0, padding:0 }}>
        {partners.map(p=>(
          <li key={p.id} className="card" style={{ padding:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div><b>{p.name}</b><div style={{ fontSize:12, color:"var(--ink-soft)" }}>{p.offer}</div></div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span className="badge">{p.cost} credits</span>
              <button className="sh-btn" onClick={()=>redeem(p)}>Redeem</button>
            </div>
          </li>
        ))}
      </ul>
      {status && <p role="status" style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>{status}</p>}
    </section>
  );
}
