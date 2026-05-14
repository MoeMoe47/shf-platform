import React from "react";
import { useParams } from "react-router-dom";
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

const LESSONS = {
  "elections-howto": { title: "Practice Voting", pts: 10 },
  "survey-issues":   { title: "Issues Survey",   pts: 6  },
};

export default function MicroLessonDetail() {
  const { id } = useParams();
  const meta = LESSONS[id] || { title:"Micro-lesson", pts: 5 };

  const { toast } = useToasts();
  const rewards = (typeof useRewards === "function" ? useRewards() : { addPoints:()=>{}, badges:[] });
  const { addPoints } = rewards;

  const complete = () => {
    const arr = readJSON("civic:attestations", []);
    if (!arr.some(a => a.eventType==="micro-lesson-complete" && a.lessonId===id)) {
      arr.push({ eventType:"micro-lesson-complete", lessonId:id, timestamp: Date.now() });
      saveJSON("civic:attestations", arr);
      bump("ns:kpi:microLessonsCompleted", +1);
      bump("civic:kpi:microDone", +1);

      try { addPoints?.(meta.pts); } catch {}

      // badge via helper (normalized to micro:{id})
      awardBadge({
        useRewards,
        id: `micro:${id}`,
        note: `Micro-lesson completed: ${id}`,
        pointsOnAward: 0,
      });

      try {
        const h = readJSON("wallet:history", []);
        h.push({ at: Date.now(), delta: +meta.pts, note: `Micro-lesson completed: ${id}` });
        saveJSON("wallet:history", h);
      } catch {}

      toast(`Lesson complete · +${meta.pts} pts`, { type: "success" });
    } else {
      toast("Already completed.", { type: "info" });
    }
  };

  return (
    <section className="crb-main" aria-labelledby="ml2-title">
      <header className="db-head">
        <div>
          <h1 id="ml2-title" className="db-title">{meta.title}</h1>
          <p className="db-subtitle">Complete this activity to earn points and update your KPIs.</p>
        </div>
      </header>

      <article className="card card--pad">
        <p>…your lesson content…</p>
        <button className="sh-btn" onClick={complete}>Mark Complete</button>
      </article>
    </section>
  );
}
