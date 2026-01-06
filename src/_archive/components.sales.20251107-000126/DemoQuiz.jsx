// src/pages/sales/DemoQuiz.jsx
import React from "react";
import PageHeaderPortal from "@/components/sales/PageHeaderPortal.jsx";

const Q = [
  { id:"q1", q:"What does a budget help you do?", a:["Track money in/out","Improve crypto mining","Raise your GPA"], correct:0 },
  { id:"q2", q:"Credit score goes up when…", a:["You miss payments","You pay on time","You max cards"], correct:1 },
  { id:"q3", q:"Emergency fund target is…", a:["1 month","3–6 months","12 months"], correct:1 },
];

export default function DemoQuiz(){
  const [ans, setAns] = React.useState({});
  const score = Q.reduce((s, q)=> s + ((ans[q.id]===q.correct)?1:0), 0);
  const done = Object.keys(ans).length === Q.length;

  return (
    <>
      <PageHeaderPortal>
        <section className="lux-hero frost">
          <div className="lux-heroL">
            <div className="lux-eyebrow">Sales · Demo</div>
            <h1 className="lux-title">Quick Quiz</h1>
            <p className="lux-sub">Earn a badge + 250 credits (demo)</p>
          </div>
        </section>
      </PageHeaderPortal>

      <section className="lux-page" style={{ display:"grid", gap:16 }}>
        <div className="card card--pad" style={{ display:"grid", gap:12 }}>
          {Q.map(q=>(
            <div key={q.id} className="card" style={{ padding:12 }}>
              <div style={{ fontWeight:700, marginBottom:8 }}>{q.q}</div>
              <div style={{ display:"grid", gap:8 }}>
                {q.a.map((opt,i)=>(
                  <label key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <input type="radio" name={q.id} checked={ans[q.id]===i} onChange={()=>setAns(v=>({...v,[q.id]:i}))}/>
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card card--pad" style={{ display:"grid", gap:8 }}>
          <div><b>Score:</b> {score}/{Q.length}</div>
          {done && (
            <div className="card" style={{ padding:12, border:"1px dashed var(--ring)", borderRadius:12 }}>
              <div style={{ fontWeight:800 }}>Badge Unlocked: Financial Literacy Basics</div>
              <div style={{ fontSize:13, color:"var(--ink-soft)" }}>+250 credits added (demo)</div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
