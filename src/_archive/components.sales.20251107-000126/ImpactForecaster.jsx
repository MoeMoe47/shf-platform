// src/components/sales/ImpactForecaster.jsx
import React from "react";

function usd0(n){ return n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}); }

export default function ImpactForecaster({ onChange }) {
  const [learners, setLearners] = React.useState(120);
  const [completion, setCompletion] = React.useState(70);     // %
  const [creditsPer, setCreditsPer] = React.useState(250);    // demo “rewards” credits funded
  const [siteLic, setSiteLic] = React.useState(15000);        // base per-site
  const [sponsor, setSponsor] = React.useState(5000);         // sponsor contribution

  const completionCount = Math.round((learners * completion)/100);
  const projectedBadges = completionCount;                    // 1 badge / fin-lit pass
  const sponsorValue = completionCount * creditsPer * 0.01;   // 1¢ per credit, demo
  const total = siteLic + sponsor;
  const kpi = { learners, completion, completionCount, projectedBadges, sponsorValue, siteLic, sponsor, total };

  React.useEffect(()=>{ onChange?.(kpi) }, [learners, completion, creditsPer, siteLic, sponsor]);

  return (
    <section className="card card--pad" style={{ display:"grid", gap:12 }}>
      <h3 style={{ margin:0 }}>Impact Forecaster</h3>

      <div style={{ display:"grid", gap:12, gridTemplateColumns:"repeat(2, minmax(220px,1fr))" }}>
        <Num label="# Learners" value={learners} set={setLearners} min={20} max={2000} step={10} />
        <Num label="Completion %" value={completion} set={setCompletion} min={10} max={100} step={1} />
        <Num label="Credits funded / learner" value={creditsPer} set={setCreditsPer} min={0} max={1000} step={50} />
        <Money label="Site license" value={siteLic} set={setSiteLic} step={500} />
        <Money label="Sponsor contribution" value={sponsor} set={setSponsor} step={500} />
      </div>

      <div className="pro-kpis" style={{ display:"grid", gap:12, gridTemplateColumns:"repeat(4, minmax(0,1fr))" }}>
        <KPI label="Projected Completers" value={completionCount} />
        <KPI label="Badges Issued" value={projectedBadges} />
        <KPI label="Sponsor Value" value={usd0(sponsorValue)} />
        <KPI label="Annual Total" value={usd0(total)} />
      </div>
    </section>
  );
}

function KPI({label, value}) {
  return <div className="card" style={{ padding:12 }}>
    <div style={{ fontSize:12, color:"var(--ink-soft)" }}>{label}</div>
    <div style={{ fontSize:20, fontWeight:800 }}>{value}</div>
  </div>;
}
function Num({label, value, set, min, max, step}){
  return <label className="sh-label" style={{ display:"grid", gap:6 }}>
    {label}
    <input className="sh-input" type="number" value={value}
      min={min} max={max} step={step} onChange={e=>set(Number(e.target.value)||0)} />
    <input type="range" value={value} min={min} max={max} step={step} onChange={e=>set(Number(e.target.value)||0)} />
  </label>;
}
function Money({label, value, set, step=100}){
  const fmt = (v)=>v.toLocaleString("en-US");
  return <label className="sh-label" style={{ display:"grid", gap:6 }}>
    {label}
    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
      <span>$</span>
      <input className="sh-input" type="number" value={value}
        step={step} onChange={e=>set(Number(e.target.value)||0)} />
    </div>
    <div aria-hidden style={{ fontSize:12, color:"var(--ink-soft)" }}>≈ ${fmt(value)}</div>
  </label>;
}
