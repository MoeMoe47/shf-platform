import React from "react";
import model from "@/data/civic/issues.v1.json";
import { storage } from "@/utils/storage.js";

const KEY_PROFILE = "civic:profile:latest";

export default function ProfileResults() {
  const rec = storage.get(KEY_PROFILE, null);
  if (!rec) {
    return (
      <section className="crb-main">
        <header className="db-head"><h1 className="db-title">Civic Profile</h1></header>
        <div className="card card--pad">
          No profile yet. <a className="sh-btn sh-btn--soft" href="/civic.html#/survey">Take the survey</a>.
        </div>
      </section>
    );
  }
  const { profile } = rec;
  const axes = profile.axes;
  const vals = axes.map(a => profile.normalized[a.id] ?? 0.5);

  const summary = `Civic placement: ${profile.placement.quadrant} — confidence ${(profile.confidence*100).toFixed(0)}%.`;

  return (
    <section className="crb-main">
      <header className="db-head">
        <div>
          <h1 className="db-title">Your Civic Profile</h1>
          <p className="db-subtitle">
            Placement: <strong>{profile.placement.quadrant}</strong> · Confidence: {(profile.confidence*100).toFixed(0)}%
          </p>
        </div>
        <div style={{display:"flex", gap:8}}>
          <a className="sh-btn sh-btn--soft" href="/civic.html#/survey">Retake Survey</a>
          <button className="sh-btn sh-btn--soft" onClick={() => navigator.clipboard.writeText(summary)}>Copy summary</button>
        </div>
      </header>

      <div className="db-grid">
        <div className="card card--pad">
          <strong>Axis Scores</strong>
          <ul style={{ listStyle:"none", padding:0, margin:"8px 0 0", display:"grid", gap:8 }}>
            {axes.map((a,i)=>(
              <li key={a.id}>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:12, opacity:.8}}>
                  <span>{a.label}</span><span>{Math.round(vals[i]*100)}%</span>
                </div>
                <div style={{height:8, background:"#eef2ff", borderRadius:999, overflow:"hidden"}}>
                  <span style={{display:"block", height:"100%", width:`${vals[i]*100}%`, background:"var(--brand,#2563eb)"}}/>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card card--pad">
          <strong>Placement Map (Fiscal vs Social)</strong>
          <PlacementXY fiscal={profile.placement.fiscal} social={profile.placement.social}/>
          <div style={{fontSize:12, opacity:.8, marginTop:8}}>0 = center; ±0.5 = strong lean</div>
        </div>

        <div className="card card--pad">
          <strong>Suggested Learning Gaps</strong>
          <ul style={{ margin:"8px 0 0", paddingLeft: 18 }}>
            {suggestGaps(profile).map((g, i)=> <li key={i}>{g}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PlacementXY({ fiscal, social }) {
  const map = v => 100 + v * 200; // -0.5..+0.5 -> 0..200
  const cx = map(fiscal);
  const cy = 100 - social * 200;
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ background:"#fff", border:"1px solid var(--ring,#eee)", borderRadius:8 }}>
      <line x1="0" y1="100" x2="200" y2="100" stroke="#e5e7eb"/>
      <line x1="100" y1="0" x2="100" y2="200" stroke="#e5e7eb"/>
      <circle cx={cx} cy={cy} r="6" fill="var(--brand,#2563eb)" />
      <text x="6" y="12"  fontSize="10" fill="#94a3b8">Community</text>
      <text x="150" y="12" fontSize="10" fill="#94a3b8">Liberty</text>
      <text x="6" y="196" fontSize="10" fill="#94a3b8">Stewardship</text>
      <text x="156" y="196" fontSize="10" fill="#94a3b8">Prosperity</text>
    </svg>
  );
}

function suggestGaps(profile) {
  const n = profile.normalized || {};
  const out = [];
  if ((n.fiscal ?? .5) < 0.45) out.push("Explore budgeting & tax tradeoffs in the Treasury Simulator.");
  if ((n.govern ?? .5) < 0.5)  out.push("Review governance & anti-corruption micro-lessons.");
  if ((n.civic ?? .5) < 0.55)  out.push("Join an upcoming mock election to practice participation.");
  if ((profile.confidence ?? 0) < 0.7) out.push("Complete more questions to raise confidence.");
  return out.length ? out : ["Great balance! Consider proposing a policy in Proposals."];
}
import PortfolioHint from "@/components/civic/PortfolioHint.jsx";

// ...inside your JSX, after the main profile summary tiles:
<PortfolioHint note="From your Civic Profile, save a snapshot to your Portfolio." />
