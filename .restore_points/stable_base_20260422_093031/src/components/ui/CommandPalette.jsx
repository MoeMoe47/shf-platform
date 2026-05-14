import React from "react";
import { useNavigate } from "react-router-dom";

export default function CommandPalette({ open, onClose, commands=[] }) {
  const nav = useNavigate();
  const [q, setQ] = React.useState("");

  React.useEffect(()=>{ if(open) setQ(""); },[open]);

  const filtered = !q
    ? commands.slice(0, 8)
    : commands.filter(c => (c.label||"").toLowerCase().includes(q.toLowerCase()));

  const run = (cmd) => {
    try {
      if (cmd.href) { window.location.href = cmd.href; }
      else if (cmd.to) { nav(cmd.to); }
      else if (typeof cmd.action === "function") { cmd.action(); }
    } finally { onClose?.(); }
  };

  if (!open) return null;
  return (
    <div className="cmdp-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="cmdp" onClick={e=>e.stopPropagation()}>
        <div className="cmdp-h">
          <input
            autoFocus
            className="cmdp-input"
            placeholder="Type a command…"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            aria-label="Command search"
          />
          <button className="cmdp-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <ul className="cmdp-list">
          {filtered.map((c,i)=>(
            <li key={i}>
              <button className="cmdp-item" onClick={()=>run(c)}>
                <span className="cmdp-ic" aria-hidden>{c.icon||"⚡"}</span>
                <span className="cmdp-label">{c.label}</span>
                {c.kbd ? <kbd className="cmdp-kbd">{c.kbd}</kbd> : null}
              </button>
            </li>
          ))}
          {!filtered.length && <li className="cmdp-empty">No results</li>}
        </ul>
      </div>
    </div>
  );
}
