import React from "react";
export default function DashboardNorthstar(){
  return (
    <section>
      <h1 style={{marginTop:0}}>Sales Northstar</h1>
      <p>If you see this, router & layout are healthy.</p>
      <div style={{display:"grid",gap:12,gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))"}}>
        <div style={{padding:12,border:"1px solid #eee",borderRadius:8}}><strong>Leads Touched</strong><div>0 / 50</div></div>
        <div style={{padding:12,border:"1px solid #eee",borderRadius:8}}><strong>Meetings Booked</strong><div>0 / 20</div></div>
        <div style={{padding:12,border:"1px solid #eee",borderRadius:8}}><strong>Proposals Sent</strong><div>0 / 12</div></div>
        <div style={{padding:12,border:"1px solid #eee",borderRadius:8}}><strong>Closed Won</strong><div>0 / 5</div></div>
      </div>
    </section>
  );
}
