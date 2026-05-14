// src/components/CoachPanel.jsx
import React from "react";
import { track } from "@/utils/analytics.js";

function readJSON(key, fallback){ try{ return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }catch{ return fallback; } }
function writeJSON(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch{} }

const SESSIONS_KEY = "sh:coach:sessions";

function useCoachSessions(){
  const [sessions, setSessions] = React.useState(() => readJSON(SESSIONS_KEY, []));
  const add = React.useCallback((entry) => {
    const next = [{ ts: Date.now(), ...entry }, ...readJSON(SESSIONS_KEY, [])].slice(0, 500);
    writeJSON(SESSIONS_KEY, next);
    setSessions(next);
  }, []);
  return { sessions, add };
}

function tipListFromLesson(lesson = {}){
  const tips = [];
  if (lesson?.objectives?.length) tips.push("Start by reading objectives aloud and asking the learner to restate them in their own words.");
  if (lesson?.pacing?.minutes) tips.push(`Timebox this lesson to ~${lesson.pacing.minutes} minutes and plan a 2-minute break halfway.`);
  tips.push("Use the 'explain it differently' pattern: show → say → ask → draw → act.");
  tips.push("Praise process, not just answers (\"Great strategy trying two methods!\").");
  return tips;
}

export function CoachPanel({ lesson, compact = false }){
  const { sessions, add } = useCoachSessions();
  const tips = React.useMemo(() => tipListFromLesson(lesson), [lesson]);

  function markGuided(){
    add({ lesson: { slug: lesson?.slug, title: lesson?.title }, mode: "guided" });
    track("coach_guided_session_marked", { slug: lesson?.slug, title: lesson?.title }, { silent: true });
  }

  return (
    <section className="card card--pad" aria-label="Coach Panel">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8 }}>
        <strong>Coach Panel</strong>
        <span className="subtle">{sessions.length} sessions logged</span>
      </div>

      <div style={{ marginTop: 8 }}>
        {lesson?.title && <div className="subtle">Lesson: <b>{lesson.title}</b></div>}
        {!compact && tips.length > 0 && (
          <ul style={{ marginTop: 8 }}>
            {tips.map((t,i)=><li key={i}>{t}</li>)}
          </ul>
        )}
      </div>

      <div style={{ display:"flex", gap:8, marginTop: 8 }}>
        <button className="btn" onClick={markGuided}>Mark Guided Session</button>
        {!compact && (
          <button
            className="btn"
            onClick={() => window.alert("Try: show → say → ask → draw → act.\nIf stuck, reduce the step size and model one example.")}
          >
            How do I explain this?
          </button>
        )}
      </div>
    </section>
  );
}

// Default export so `import CoachPanel from ...` works
export default CoachPanel;
/* --- SHF: Coach booking/attendance micro-awards (drop-in) --- */
(() => {
  if (typeof window === "undefined") return;
  if (window.__shfHook_coach) return;
  window.__shfHook_coach = true;

  const once = (key) => {
    if (!key) return true;
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
    return true;
  };

  const award = (action, rewards, scoreDelta, meta) => {
    try { window.shfCredit?.earn?.({ action, rewards, scoreDelta, meta }); } catch {}
  };

  // Fired when a user successfully books a session
  //   window.dispatchEvent(new CustomEvent("coach:booked", { detail:{ coachId, slot, title } }))
  window.addEventListener("coach:booked", (e) => {
    const d = (e && e.detail) || {};
    award("coach.book", { heart: 1 }, 4, { coachId: d.coachId, slot: d.slot, title: d.title });
    window.shToast?.("🗓️ Coach booked · +1 ❤️ · +4 score");
  });

  // Fired after user attends (guarded once per session)
  //   window.dispatchEvent(new CustomEvent("coach:attended", { detail:{ sessionId, coachId, title } }))
  window.addEventListener("coach:attended", (e) => {
    const d = (e && e.detail) || {};
    const key = d.sessionId ? `shf.award.coach.att.${d.sessionId}` : "";
    if (!once(key)) return;
    award("coach.attend", { heart: 2 }, 8, { sessionId: d.sessionId, coachId: d.coachId, title: d.title });
    window.shToast?.("🎧 Session attended · +2 ❤️ · +8 score");
  });
})();
