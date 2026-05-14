import React from "react";
import { getBadge, getBadgeProgress, isUnlocked } from "@/shared/rewards/shim.js";
import { getStreak } from "@/shared/engagement/streaks.js";

export default function BadgeDetailsModal({ open, badgeId, onClose }) {
  if (!open || !badgeId) return null;
  const b = getBadge(badgeId);
  if (!b) return null;

  const unlocked = isUnlocked(badgeId);
  const progress = getBadgeProgress(badgeId, { streak: getStreak() }) || { pct: 0, label: "" };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,.35)", display:"grid",
        placeItems:"center", zIndex:1000, padding:16
      }}
    >
      <div className="card card--pad" style={{ width:"min(720px,95vw)", maxHeight:"85vh", overflow:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <strong style={{ fontSize:18 }}>{b.title}</strong>
          <span className="sh-chip" style={{ marginLeft:"auto" }}>{unlocked ? "Unlocked 🔓" : "Locked 🔒"}</span>
        </div>

        <p className="subtle" style={{ marginTop:8 }}>{b.desc}</p>

        <div className="sh-hero" style={{ marginTop:10 }}>
          <div className="sh-row" style={{ justifyContent:"space-between" }}>
            <div>
              <div className="sh-subtitle">Progress</div>
              <div><strong>{progress.label}</strong></div>
            </div>
            <div className="sh-progressWrap" style={{ width:240 }}>
              <div className="sh-progressBar" style={{ width: `${progress.pct || 0}%` }} />
            </div>
          </div>
        </div>

        {b.how && (
          <div className="sh-callout sh-callout--tip" style={{ marginTop:10 }}>
            <div className="sh-calloutHead"><span>💡</span><strong>How to earn</strong></div>
            <div className="sh-calloutBody">
              <ul className="sh-list">
                {b.how.map((line, i) => (
                  <li key={i} className="sh-listItem"><span className="sh-dot" aria-hidden />{line}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="sh-row" style={{ justifyContent:"flex-end", marginTop:12 }}>
          <button className="sh-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
