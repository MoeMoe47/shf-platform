// src/components/sales/CaseloadTable.jsx
import React from "react";

const rows = [
  { id:"s1", name:"Alex J", modules:3, last:"3d", risk:"low" },
  { id:"s2", name:"Bri K", modules:1, last:"9d", risk:"med" },
  { id:"s3", name:"Chris M", modules:0, last:"14d", risk:"high" },
  { id:"s4", name:"Dee P", modules:2, last:"5d", risk:"med" },
  { id:"s5", name:"El Z", modules:4, last:"1d", risk:"low" },
];

export default function CaseloadTable(){
  return (
    <section className="card card--pad">
      <h3 style={{ marginTop:0 }}>Caseload</h3>
      <table className="tbl lux-table" style={{ width:"100%" }}>
        <thead><tr><th>Learner</th><th>Modules</th><th>Last Active</th><th>Alert</th></tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.modules}</td>
              <td>{r.last}</td>
              <td><span className={`badge ${r.risk==="high"?"stage-lead":r.risk==="med"?"stage-proposal":"stage-qualified"}`}>
                {r.risk==="high"?"Needs outreach":r.risk==="med"?"Nudge":"On track"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
