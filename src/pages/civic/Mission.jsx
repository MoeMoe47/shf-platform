// src/pages/civic/Mission.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import lessons from "@/data/civic/micro-lessons.v1.json";
import { useRewards } from "@/hooks/useRewards.js";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";
import { completeMicroLesson } from "@/shared/civic/completeMission.js";

export default function Mission() {
  const { id } = useParams();
  const lesson = (lessons.items || []).find((m) => m.id === id);
  const rewards = (typeof useRewards === "function" ? useRewards() : null) || {};

  if (!lesson) {
    return (
      <section className="crb-main">
        <header className="db-head">
          <div><h1 className="db-title">Mission</h1><p className="db-subtitle">Not found.</p></div>
          <div style={{display:"flex",gap:8}}><RewardsChip /></div>
        </header>
        <div className="card card--pad">Unknown mission: <code>{id}</code></div>
      </section>
    );
  }

  const complete = () => {
    completeMicroLesson({ id: lesson.id, points: lesson?.rewards?.points ?? 10 }, rewards);
  };

  return (
    <section className="crb-main" aria-labelledby="ms-title">
      <header className="db-head">
        <div>
          <h1 id="ms-title" className="db-title">{lesson.title}</h1>
          <p className="db-subtitle">{lesson.objective || "Short mission"}</p>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <RewardsChip />
          <Link className="sh-btn is-ghost" to="/missions">All Missions</Link>
        </div>
      </header>

      <article className="card card--pad" style={{display:"grid", gap:10}}>
        {(lesson.content||[]).map((p,i)=> <p key={i} style={{margin:0}}>{p}</p>)}

        <div style={{display:"flex", gap:8, marginTop:8}}>
          <button className="sh-btn" onClick={complete}>Mark Complete</button>
          <span className="sh-badge is-ghost">+{lesson?.rewards?.points ?? 10} pts</span>
          <span className="sh-badge is-ghost">Badge micro:{lesson.id}</span>
        </div>
      </article>
    </section>
  );
}
