import React from "react";
import { Link } from "react-router-dom";
import { useToasts } from "@/context/Toasts.jsx";
import { useRewards } from "@/hooks/useRewards.js";
import { awardBadge } from "@/shared/rewards/shim.js";

function readJSON(k, d){ try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch { return d; } }
function saveJSON(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function bump(key, delta=1){ try {
  const n = Math.max(0, (Number(localStorage.getItem(key))||0) + Number(delta||0));
  localStorage.setItem(key, String(n));
  window.dispatchEvent(new StorageEvent("storage", { key, newValue: String(n) }));
} catch {} }

export default function MicroLessons() {
  const { toast } = useToasts();
  const rewards = (typeof useRewards === "function" ? useRewards() : { addPoints:()=>{}, badges:[] });
  const { addPoints } = rewards;

  const lessons = [
    { id: "elections-howto", title: "Practice Voting", pts: 10 },
    { id: "survey-issues",   title: "Issues Survey",   pts: 6  },
  ];

  const complete = (id, pts) => {
    // mark attestation
    const arr = readJSON("civic:attestations", []);
    if (!arr.some(a => a.eventType==="micro-lesson-complete" && a.lessonId===id)) {
      arr.push({ eventType:"micro-lesson-complete", lessonId:id, timestamp: Date.now() });
      saveJSON("civic:attestations", arr);
      bump("ns:kpi:microLessonsCompleted", +1);
      bump("civic:kpi:microDone", +1);

      // points
      try { addPoints?.(pts); } catch {}

      // badge via helper (normalized to micro:{id})
      awardBadge({
        useRewards,
        id: `micro:${id}`,
        note: `Micro-lesson completed: ${id}`,
        pointsOnAward: 0,
      });

      // wallet history
      try {
        const h = readJSON("wallet:history", []);
        h.push({ at: Date.now(), delta: +pts, note: `Micro-lesson completed: ${id}` });
        saveJSON("wallet:history", h);
      } catch {}

      toast(`Lesson complete · +${pts} pts`, { type: "success" });
    } else {
      toast("Already completed.", { type: "info" });
    }
  };

  return (
    <section className="crb-main" aria-labelledby="ml-title">
      <header className="db-head">
        <div>
          <h1 id="ml-title" className="db-title">Micro-lessons</h1>
          <p className="db-subtitle">Quick wins that move your KPIs.</p>
        </div>
      </header>

      <div className="db-grid">
        <article className="card card--pad">
          <ul style={{ listStyle:"none", padding:0, margin:0, display:"grid", gap:10 }}>
            {lessons.map(l => (
              <li key={l.id} style={{ display:"flex", gap:8, alignItems:"center" }}>
                <strong>{l.title}</strong>
                <span className="sh-badge is-ghost">{l.pts} pts</span>
                <button className="sh-btn" onClick={()=> complete(l.id, l.pts)}>Mark Complete</button>
                {l.id==="elections-howto" && (
                  <Link className="sh-btn is-ghost" to="/elections">Try ballot →</Link>
                )}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
