import React from "react";
export default function Legend({ layers, onToggle }) {
  return (
    <aside className="ai-legend" aria-label="Map legend">
      <header><span>Legend</span><small>Brightness = intensity</small></header>
      <ul>
        <Row active={layers.red} label="Displacement" desc="AI-exposed job loss"
             shape="triangle" color="var(--red)" onClick={()=>onToggle("red")} />
        <Row active={layers.green} label="Jobs & Opportunities" desc="AI-resistant demand"
             shape="circle" color="var(--green)" onClick={()=>onToggle("green")} />
        <Row active={layers.orange} label="AI-Building Jobs" desc="New AI roles & hubs"
             shape="diamond" color="var(--orange)" onClick={()=>onToggle("orange")} />
      </ul>
    </aside>
  );
}
function Row({ active, label, desc, shape, color, onClick }) {
  return (
    <li>
      <button className={`ai-legRow ${active?"is-on":"is-off"}`}
        onClick={onClick} aria-pressed={active}
        aria-label={`${label}: ${active?"visible":"hidden"}. ${desc}.`} title={`${label} — ${desc}`}>
        <Marker shape={shape} color={color} />
        <span className="ai-legLabel">{label}</span>
      </button>
    </li>
  );
}
function Marker({ shape, color }) {
  if (shape === "triangle") {
    return <span className="ai-mark triangle" style={{ borderBottomColor: "var(--red)" }} aria-hidden />;
  }
  const cls = shape === "diamond" ? "ai-mark diamond" : "ai-mark circle";
  return <span className={cls} style={{ background: color }} aria-hidden />;
}
