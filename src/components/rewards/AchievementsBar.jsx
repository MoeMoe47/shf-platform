import React from "react";
import { listBadges, getBadgeProgress, isUnlocked } from "@/shared/rewards/shim.js";
import { getStreak } from "@/shared/engagement/streaks.js";

export default function AchievementsBar({ onOpen }) {
  const [badges, setBadges] = React.useState(() => listBadges());

  React.useEffect(() => {
    const tick = () => setBadges(listBadges());
    const onStorage = (e) => { if (!e || !e.key) tick(); };
    window.addEventListener("storage", onStorage);
    const t = setInterval(tick, 1500);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(t); };
  }, []);

  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
      {badges.map(b => {
        const prog = getBadgeProgress(b.id, { streak: getStreak() }) || { pct: 0, label: "" };
        const unlocked = isUnlocked(b.id);
        return (
          <button
            key={b.id}
            className="sh-chip"
            onClick={() => onOpen?.(b.id)}
            title={unlocked ? `${b.title} — unlocked` : `${b.title} — ${prog.label}`}
            style={{
              display:"inline-flex",
              alignItems:"center",
              gap:8,
              borderColor: unlocked ? "var(--accent)" : "var(--ring)",
            }}
          >
            <span aria-hidden>{unlocked ? "🔓" : "🔒"}</span>
            <span style={{ fontWeight:600 }}>{b.short || b.title}</span>
            <span className="sh-progressSlim" style={{ width:80, marginLeft:6 }}>
              <span className="sh-progressSlimFill" style={{ width: `${prog.pct || 0}%` }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
