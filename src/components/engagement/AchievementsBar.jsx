import React from "react";
import { getStreak } from "@/shared/engagement/streaks.js";

const ACH_LIST = [
  { id: "first_reflection", label: "First Reflection" },
  { id: "five_lessons", label: "5 Lessons Completed" },
  { id: "streak_3", label: "3-Day Streak" },
  { id: "streak_7", label: "7-Day Streak" },
];

function has(id){ try{ return localStorage.getItem(`sh:ach:${id}`) === "1"; }catch{ return false; } }

export default function AchievementsBar(){
  const [streak, setStreak] = React.useState(() => getStreak());
  const [state, setState] = React.useState(() => Object.fromEntries(ACH_LIST.map(a=>[a.id, has(a.id)])));

  React.useEffect(() => {
    const onA = () => setState(Object.fromEntries(ACH_LIST.map(a=>[a.id, has(a.id)])));
    const onS = () => setStreak(getStreak());
    window.addEventListener("achievements:update", onA);
    window.addEventListener("streak:update", onS);
    return () => { window.removeEventListener("achievements:update", onA); window.removeEventListener("streak:update", onS); };
  }, []);

  return (
    <div className="card card--pad" aria-label="Streak & achievements">
      <div style={{display:"flex", alignItems:"center", gap:12}}>
        <span className="sh-chip soft">🔥 Streak: <strong style={{marginLeft:6}}>{streak} day{streak===1?"":"s"}</strong></span>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {ACH_LIST.map(a => (
            <span key={a.id} className="sh-chip" style={{opacity: state[a.id] ? 1 : .45}}>
              {state[a.id] ? "🏅" : "🔒"} {a.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
