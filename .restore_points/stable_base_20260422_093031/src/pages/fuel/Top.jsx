import React from "react";
function Pill({label,value}){return <span className="ft-pill"><span>{label}</span><b>{value}</b></span>;}
export default function Top(){
  return <>
    <section className="ft-hero"><div className="ft-metrics">
      <Pill label="Fuel Pool" value="50,000 SHF"/><Pill label="Pitches Live" value="12"/>
      <Pill label="Votes Cast" value="3,284"/><Pill label="Matching" value="1:1 (10k cap)"/>
      <Pill label="Season" value="S1 • 13 days left"/>
    </div></section>
    <main className="ft-main">
      <section className="ft-panel"><div className="ft-head">Spotlight</div><div className="ft-body"><p style={{margin:0,color:"var(--ft-dim)"}}>Your spotlight project will appear here.</p></div></section>
      <aside className="ft-panel"><div className="ft-head">Top</div><div className="ft-body ft-list"><div style={{color:"var(--ft-dim)"}}>Project cards will list here.</div></div></aside>
    </main>
  </>;
}
