import React from "react";
import ky from "ky";
export default function Ticker() {
  const [items, setItems] = React.useState([]); const [paused, setPaused] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    (async () => { try { const data = await ky.get("/api/mock/ticker").json(); if (alive) setItems(Array.isArray(data?.items)?data.items:[]);} catch(e){console.error("ticker",e);} })();
    const id = setInterval(async () => { try { const data = await ky.get("/api/mock/ticker").json(); if (alive) setItems(Array.isArray(data?.items)?data.items:[]);} catch{} }, 60_000);
    return ()=>{ alive=false; clearInterval(id); };
  }, []);
  return (
    <div className={`ticker-wrap ${paused ? "is-paused" : ""}`} role="region" aria-label="Live job market ticker"
      onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
      <div className="ticker-track" aria-live="polite">
        {[...items, ...items].map((it, i) => <Item key={`${it.id||it.label}-${i}`} item={it} />)}
      </div>
    </div>
  );
}
function Item({ item }) {
  const isGain = item?.type === "jobs"; const isLoss = item?.type === "loss"; const isAI = item?.type === "ai";
  return (
    <span className={`tick ${isGain?"gain":isLoss?"loss":isAI?"ai":""}`}>
      {isGain && <span className="icon" aria-hidden>▲</span>}
      {isLoss && <span className="icon" aria-hidden>▼</span>}
      {isAI   && <span className="icon" aria-hidden>◆</span>}
      <strong className="label">{item.label}</strong>
      <em className="meta">{item.meta}</em>
    </span>
  );
}
