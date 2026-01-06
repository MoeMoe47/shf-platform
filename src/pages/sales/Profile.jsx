// src/pages /sales/ProfileResults.jsx
import React from "react";
import { Link } from "react-router-dom";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";

/* -------------------- Storage helpers -------------------- */
function readJSON(k, d){ try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch { return d; } }
function saveJSON(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

/* -------------------- Keys (multiple fallbacks) -------------------- */
const KEY_PROFILE_XY   = "civic:profile:xy";         // { x, y, updatedAt }
const KEY_SURVEY_A     = "civic:survey";             // flexible survey saves
const KEY_SURVEY_B     = "civic:issueSurvey";
const KEY_SURVEY_C     = "civic:survey:issues";
const KEY_ATTEST       = "civic:attestations";       // micro-lesson completions
const KEY_VOTES        = "civic:votes";              // practice ballots
const KEY_PROPOSALS    = "civic:proposals";          // user proposals (for “moved” list)
const KEY_SNAPSHOTS    = "civic:treasury:snapshots"; // treasury scenarios
const KEY_WALLET_HIST  = "wallet:history";           // unified activity log (optional)

/* -------------------- XY derivation --------------------
   Axis (example, neutral-friendly):
   X: Change  ⟷  Tradition   (−100..+100)
   Y: Collective ⟷ Individual (−100..+100)

   We try, in order:
   1) Stored profile XY (if present)
   2) Lightweight derivation from survey answers (if present)
   3) Fallback neutral (0,0)

   NOTE: This is intentionally simple/transparent and you can swap
   in your real scoring map anytime inside `scoreFromSurvey`.
------------------------------------------------------------------ */
function scoreFromSurvey(raw) {
  // Expect either {answers:[{id,choice}]} or a plain object map {id:choice}
  const answers = Array.isArray(raw?.answers)
    ? raw.answers
    : raw && typeof raw === "object"
      ? Object.entries(raw).map(([id, choice]) => ({ id, choice }))
      : [];

  // Lightweight heuristic mapping (edit freely):
  // each answer nudges X or Y by a small integer; we keep it small.
  const WEIGHTS = {
    // id: { choiceValue: { dx, dy } }
    "budget-balance": { increase:{dx:-4, dy:+1}, decrease:{dx:+4, dy:-1}, stable:{dx:0, dy:0} },
    "civic-participation": { volunteer:{dx:-2, dy:-4}, vote_only:{dx:+1, dy:+2} },
    "public-safety": { more_police:{dx:+6, dy:+2}, prevention:{dx:-6, dy:-2} },
    "schools-funding": { raise:{dx:-3, dy:-1}, lower:{dx:+3, dy:+1}, keep:{dx:0, dy:0} },
    "transit-priority": { transit:{dx:-4, dy:-2}, roads:{dx:+4, dy:+2} },
  };

  let x = 0, y = 0;
  for (const { id, choice } of answers) {
    const rule = WEIGHTS[id]?.[String(choice)];
    if (rule) { x += rule.dx || 0; y += rule.dy || 0; }
  }
  return { x: clamp(x, -100, 100), y: clamp(y, -100, 100) };
}

function deriveProfileXY() {
  // 1) Stored XY?
  const stored = readJSON(KEY_PROFILE_XY, null);
  if (stored && typeof stored.x === "number" && typeof stored.y === "number") {
    return stored;
  }

  // 2) Any survey data to score?
  const survey =
    readJSON(KEY_SURVEY_A, null)
    || readJSON(KEY_SURVEY_B, null)
    || readJSON(KEY_SURVEY_C, null);

  if (survey) {
    const s = scoreFromSurvey(survey);
    const out = { ...s, updatedAt: Date.now() };
    saveJSON(KEY_PROFILE_XY, out);
    return out;
  }

  // 3) Neutral fallback
  return { x: 0, y: 0, updatedAt: null };
}

/* -------------------- "What moved your profile" list --------------------
   Pulls from:
   - wallet:history (preferred, already normalized by your flows)
   - attestations (micro-lessons)
   - practice votes
   - proposal submits / outcomes
   - treasury snapshots
-------------------------------------------------------------------------- */
function recentMovers(limit = 10) {
  const items = [];

  // Wallet history (already formatted with note + delta)
  const hist = readJSON(KEY_WALLET_HIST, []).slice().reverse();
  for (const h of hist) {
    if (!h) continue;
    items.push({
      at: h.at || Date.now(),
      note: h.note || "Wallet event",
      meta: (h.delta != null ? ((h.delta >= 0 ? "+" : "") + h.delta + " pts") : null),
      kind: "wallet",
    });
  }

  // Micro-lesson attestations
  const att = readJSON(KEY_ATTEST, []);
  for (const a of att) {
    if (a.eventType === "micro-lesson-complete") {
      items.push({
        at: a.timestamp || Date.now(),
        note: `Micro-lesson completed: ${a.lessonId}`,
        meta: "✓ attested",
        kind: "attestation",
      });
    }
  }

  // Practice votes
  const votes = readJSON(KEY_VOTES, []);
  for (const v of votes) {
    items.push({
      at: v.at || Date.now(),
      note: `Practice vote cast in ${v.raceId || "race"}`,
      meta: Array.isArray(v.selections)
        ? v.selections.join(", ")
        : v.choiceId
          ? String(v.choiceId)
          : null,
      kind: "vote",
    });
  }

  // Proposals
  const props = readJSON(KEY_PROPOSALS, []);
  for (const p of props) {
    items.push({
      at: p.createdAt || Date.now(),
      note: `Proposal created: ${p.title}`,
      meta: p.status ? `status: ${p.status}` : null,
      kind: "proposal",
    });
    if (p.statusAt && p.status && p.status !== "open") {
      items.push({
        at: p.statusAt,
        note: `Proposal ${p.status}: ${p.title}`,
        meta: `score ${p.score >= 0 ? "+" : ""}${p.score}`,
        kind: "proposal-status",
      });
    }
  }

  // Treasury snapshots
  const snaps = readJSON(KEY_SNAPSHOTS, []);
  for (const s of snaps) {
    items.push({
      at: s.at || Date.now(),
      note: "Treasury scenario saved",
      meta: `total $${(s.total||0).toLocaleString()}M`,
      kind: "treasury",
    });
  }

  // Sort newest first and trim
  return items
    .sort((a,b) => Number(b.at||0) - Number(a.at||0))
    .slice(0, limit);
}

/* -------------------- XY Map UI -------------------- */
function XYBoard({ x=-0, y=-0 }) {
  // x,y ∈ [-100,100]; center (0,0)
  const size = 280;
  const pad  = 16;
  const mid  = size / 2;

  // convert x,y to canvas coords (right/up positive)
  const cx = mid + (x/100)*(mid - pad);
  const cy = mid - (y/100)*(mid - pad);

  // Quadrant titles + tooltips
  const quads = [
    { id:"Q1", label:"Change + Collective",    x: size*0.75, y: size*0.25, tip:"Prioritizes reforms with community-wide solutions." },
    { id:"Q2", label:"Tradition + Collective", x: size*0.25, y: size*0.25, tip:"Prefers stability with shared responsibility." },
    { id:"Q3", label:"Tradition + Individual", x: size*0.25, y: size*0.75, tip:"Values continuity and personal agency." },
    { id:"Q4", label:"Change + Individual",    x: size*0.75, y: size*0.75, tip:"Embraces innovation with individual initiative." },
  ];

  return (
    <div className="card card--pad" role="img" aria-label="Civic profile XY map">
      <div style={{display:"grid", gap:8}}>
        <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} style={{ background:"#fff" }}>
          {/* grid */}
          <rect x="0" y="0" width={size} height={size} fill="#fff" stroke="var(--ring,#e5e7eb)" />
          {/* axes */}
          <line x1={mid} y1={0}   x2={mid} y2={size} stroke="#c7d2fe" strokeWidth="2"/>
          <line x1={0}   y1={mid} x2={size} y2={mid} stroke="#c7d2fe" strokeWidth="2"/>

          {/* labels (axes) */}
          <text x={size-6} y={mid-6} textAnchor="end" fontSize="12" fill="#111">Change →</text>
          <text x={6} y={mid-6} textAnchor="start" fontSize="12" fill="#111">← Tradition</text>
          <text x={mid+8} y={12} fontSize="12" fill="#111">↑ Collective</text>
          <text x={mid+8} y={size-6} fontSize="12" fill="#111">↓ Individual</text>

          {/* quadrants */}
          {quads.map(q => (
            <g key={q.id}>
              <title>{q.tip}</title>
              <circle cx={q.x} cy={q.y} r="0" />
              <text x={q.x} y={q.y} textAnchor="middle" fontSize="11" fill="#374151">{q.label}</text>
            </g>
          ))}

          {/* point */}
          <circle cx={cx} cy={cy} r="6" fill="var(--brand,#2563eb)" />
          <circle cx={cx} cy={cy} r="10" fill="none" stroke="var(--brand,#2563eb)" strokeOpacity=".25" />
        </svg>

        <div style={{display:"flex", gap:16, fontSize:13, color:"#374151"}}>
          <span><strong>X</strong>: {x >= 0 ? `+${x}` : x} (Change ↔ Tradition)</span>
          <span><strong>Y</strong>: {y >= 0 ? `+${y}` : y} (Collective ↔ Individual)</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Page -------------------- */
export default function ProfileResults(){
  const [xy, setXY] = React.useState(deriveProfileXY);
  const [movers, setMovers] = React.useState(() => recentMovers(10));

  // live-ish refresh
  React.useEffect(() => {
    const refresh = () => {
      setXY(deriveProfileXY());
      setMovers(recentMovers(10));
    };
    const onStorage = (e) => {
      if (!e || e.key == null) { refresh(); return; }
      // Any of these events could affect profile + movers list
      const keys = [KEY_PROFILE_XY, KEY_SURVEY_A, KEY_SURVEY_B, KEY_SURVEY_C, KEY_ATTEST, KEY_VOTES, KEY_PROPOSALS, KEY_SNAPSHOTS, KEY_WALLET_HIST];
      if (keys.includes(e.key)) refresh();
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(refresh, 1500);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(t); };
  }, []);

  return (
    <section className="crb-main" aria-labelledby="prof-title">
      <header className="db-head">
        <div>
          <h1 id="prof-title" className="db-title">Civic Profile</h1>
          <p className="db-subtitle">Your current position from survey + activity. This is for learning only.</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <Link className="sh-btn is-ghost" to="/survey">Edit Survey</Link>
          <RewardsChip />
        </div>
      </header>

      <div className="db-grid" style={{ gridTemplateColumns:"1.1fr .9fr", gap:12 }}>
        {/* XY Map */}
        <XYBoard x={clamp(Math.round(xy.x||0), -100, 100)} y={clamp(Math.round(xy.y||0), -100, 100)} />

        {/* Movers */}
        <aside className="card card--pad" aria-label="What moved your profile">
          <div style={{display:"flex", alignItems:"baseline", gap:8}}>
            <strong>What moved your profile</strong>
            <span className="sh-badge is-ghost">last 10</span>
            <span style={{marginLeft:"auto", fontSize:12, opacity:.75}}>
              Based on recent survey updates, micro-lessons, votes, treasury, and proposals.
            </span>
          </div>

          {movers.length === 0 ? (
            <div style={{
              marginTop: 8, padding: "12px 10px",
              border: "1px dashed var(--ring,#e5e7eb)", borderRadius: 10, background: "#fafafa"
            }}>
              No activity yet. Try the <Link to="/missions">micro-lessons</Link>, the <Link to="/elections">practice ballot</Link>, or the <Link to="/survey">issue survey</Link>.
            </div>
          ) : (
            <ul style={{ listStyle:"none", padding:0, margin:"10px 0 0", display:"grid", gap:8 }}>
              {movers.map((m, i) => (
                <li key={m.at + ":" + i} style={{
                  padding:"10px 12px",
                  border:"1px solid var(--ring,#eee)",
                  borderRadius:10, background:"#fff",
                  display:"grid", gridTemplateColumns:"1fr auto", gap:8, alignItems:"center"
                }}>
                  <div>
                    <div style={{ fontWeight:600 }}>{m.note}</div>
                    {m.meta && <div style={{ fontSize:12, opacity:.75 }}>{m.meta}</div>}
                  </div>
                  <span style={{ fontSize:12, opacity:.7 }}>
                    {new Date(m.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {/* Small helper footer */}
      <div className="card card--pad" style={{ marginTop:12 }}>
        <strong>How this works</strong>
        <p style={{ marginTop:6, opacity:.85 }}>
          Your profile starts neutral (center). The issue survey nudges you along each axis
          based on your choices. Learning activities (micro-lessons, practice votes, proposals,
          treasury sims) appear in <em>What moved your profile</em> so you can trace changes.
        </p>
      </div>
    </section>
  );
}
