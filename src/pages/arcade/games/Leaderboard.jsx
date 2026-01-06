// src/pages/arcade/Leaderboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { meta as gameMeta } from "./games/index.js";

/** ---------- Storage key helpers (with CDL legacy support) ---------- */
const LEGACY = {
  bestKeyByGame: { "transport/cdl-driver": "sh_arcade_cdl_best" },
  lbKeyByGame:   { "transport/cdl-driver": "sh_class_cdl_leaderboard_v1" },
};

function keysFor(gameKey) {
  return {
    best: LEGACY.bestKeyByGame[gameKey] || `best_${gameKey}`,
    lb:   LEGACY.lbKeyByGame[gameKey]   || `lb_${gameKey}`,
  };
}

const safeRead = (k, fb = null) => {
  try {
    const v = localStorage.getItem(k);
    if (v == null) return fb;
    try { return JSON.parse(v); } catch { return v; }
  } catch { return fb; }
};
const safeWrite = (k, v) => {
  try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch {}
};

function useLB(gameKey) {
  const { lb } = keysFor(gameKey);
  const [rows, setRows] = useState(() => safeRead(lb, []) || []);
  useEffect(() => {
    const refresh = () => setRows(safeRead(lb, []) || []);
    window.addEventListener("storage", refresh);
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { window.removeEventListener("storage", refresh); document.removeEventListener("visibilitychange", onVis); };
  }, [lb]);
  const set = (next) => { safeWrite(lb, next); setRows(next); };
  return [rows, set];
}

export default function Leaderboard() {
  const [params] = useSearchParams();
  const gameKey = params.get("game") || "transport/cdl-driver"; // sensible default

  const meta = gameMeta[gameKey];
  const title = meta?.title || gameKey;
  const icon = meta?.icon || "🎮";

  const { best: bestKey } = keysFor(gameKey);
  const best = useMemo(() => Number(safeRead(bestKey, 0) || 0), [bestKey]);

  const [rows, setRows] = useLB(gameKey);
  const [name, setName] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const score = Number(safeRead(bestKey, 0) || 0);
    if (!name.trim() || !score) return;
    const entry = {
      id: crypto.randomUUID(),
      name: name.trim(),
      score: Math.round(score),
      date: new Date().toISOString(),
    };
    const next = [...rows, entry].sort((a, b) => b.score - a.score).slice(0, 100);
    setRows(next);
    setName("");
  };

  const S = {
    page: { display:"grid", gap:16, padding:16, maxWidth:920, margin:"0 auto" },
    header: { display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" },
    titleWrap: { display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap" },
    title: { margin:0, fontSize:24, letterSpacing:"-0.01em" },
    sub: { margin:0, color:"var(--ink-soft)" },
    btn: { padding:"8px 12px", borderRadius:10, border:"1px solid var(--ring)", cursor:"pointer", background:"var(--card)", color:"var(--ink)", textDecoration:"none" },
    form: { display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" },
    input: { padding:"8px 10px", border:"1px solid var(--ring)", borderRadius:8, minWidth:220, background:"var(--card)", color:"var(--ink)" },
    pill: { fontSize:12, background:"rgba(0,0,0,.06)", padding:"3px 10px", borderRadius:999, display:"inline-block" },
    table: { width:"100%", borderCollapse:"collapse" },
    th: { textAlign:"left", borderBottom:"1px solid var(--ring)", padding:"8px" },
    td: { borderBottom:"1px solid var(--ring)", padding:"8px", fontSize:14 },
    empty: { padding:14, color:"var(--ink-soft)" },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.titleWrap}>
          <h1 style={S.title}>{icon} Leaderboard — {title}</h1>
          <p style={S.sub}><span style={S.pill}>Game key: {gameKey}</span></p>
        </div>
        <Link to="/arcade" style={S.btn}>← Back to Arcade</Link>
      </div>

      <form onSubmit={submit} style={S.form}>
        <span style={S.pill}>Your Best: {Math.round(best) || 0}</span>
        <input
          style={S.input}
          value={name}
          placeholder="Your name (e.g., J. Smith)"
          onChange={(e)=>setName(e.target.value)}
          aria-label="Your name"
        />
        <button type="submit" style={{...S.btn, background:"var(--accent)", color:"#fff", borderColor:"var(--accent)"}}>
          Submit to Leaderboard
        </button>
      </form>

      <div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Rank</th>
              <th style={S.th}>Name</th>
              <th style={S.th}>Score</th>
              <th style={S.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td style={S.td} colSpan={4}><div style={S.empty}>No entries yet.</div></td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id}>
                <td style={S.td}>{i+1}</td>
                <td style={S.td}>{r.name}</td>
                <td style={S.td}><b>{r.score}</b></td>
                <td style={S.td}>{new Date(r.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
