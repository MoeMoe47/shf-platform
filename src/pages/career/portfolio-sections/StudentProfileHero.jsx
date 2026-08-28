// src/pages/career/portfolio-sections/StudentProfileHero.jsx
import React from "react";
import { useEntitlements } from "@/context/EntitlementsContext.jsx";

const PHOTO_KEY = "sh_profile_photo";

/**
 * No connected "pathway completion / lessons / credentials / streak"
 * aggregate exists yet (see LearningProgressCard.jsx in the Curriculum
 * Dashboard for the same note) — isolated here so a real source can
 * replace it without touching the JSX. Location has no connected
 * source anywhere in the repo either.
 */
const FALLBACK = {
  location: "Columbus, Ohio",
  pathwayName: "AI & Web Development",
  percentComplete: 68,
  lessons: 14,
  credentials: 8,
  streakDays: 12,
};

function initialsFor(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function StudentProfileHero({ editOpen, onToggleEdit, onShare, shareStatus }) {
  const { user } = useEntitlements();
  const displayName = user?.name || "Michael Slate";
  const [photo, setPhoto] = React.useState(null);

  React.useEffect(() => {
    const read = () => {
      try {
        setPhoto(localStorage.getItem(PHOTO_KEY));
      } catch {
        setPhoto(null);
      }
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("sh-profile-photo-updated", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("sh-profile-photo-updated", read);
    };
  }, []);

  const pct = Math.max(0, Math.min(100, FALLBACK.percentComplete));

  return (
    <section className="sp-card sp-hero" aria-labelledby="sp-hero-name">
      <div className="sp-heroLeft">
        {photo ? (
          <img src={photo} alt={`${displayName}'s profile photo`} className="sp-avatar" />
        ) : (
          <div className="sp-avatar sp-avatarFallback" role="img" aria-label={`${displayName}'s profile photo, not set`}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.6-4 4.8-6 8-6s6.4 2 8 6" />
            </svg>
          </div>
        )}

        <div className="sp-heroText">
          <h2 id="sp-hero-name" className="sp-heroName">
            {displayName}
          </h2>
          <p className="sp-heroRole">{FALLBACK.pathwayName} Student</p>
          <p className="sp-heroLocation">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
              <circle cx="12" cy="9.5" r="2.3" />
            </svg>
            {FALLBACK.location}
          </p>

          <div className="sp-heroProgressRow">
            <span className="sp-heroProgressLabel">{pct}% pathway complete</span>
            <div
              className="sp-progressBar"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Pathway completion"
            >
              <div className="sp-progressBarFill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="sp-heroRight">
        <div className="sp-heroStats">
          <div className="sp-heroStat">
            <span className="sp-heroStatValue">{FALLBACK.lessons}</span>
            <span className="sp-heroStatLabel">Lessons</span>
          </div>
          <div className="sp-heroStat">
            <span className="sp-heroStatValue">{FALLBACK.credentials}</span>
            <span className="sp-heroStatLabel">Credentials</span>
          </div>
          <div className="sp-heroStat">
            <span className="sp-heroStatValue">{FALLBACK.streakDays}</span>
            <span className="sp-heroStatLabel">Day streak</span>
          </div>
        </div>

        <div className="sp-heroActions">
          <button
            type="button"
            className="sp-btn sp-btnPrimary"
            aria-expanded={editOpen}
            aria-controls="sp-edit-panel"
            onClick={onToggleEdit}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Edit profile
          </button>
          <button type="button" className="sp-btn sp-btnSecondary" onClick={onShare}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="18" cy="6" r="2.5" />
              <circle cx="18" cy="18" r="2.5" />
              <path d="M8.2 10.8 15.8 7M8.2 13.2l7.6 3.8" />
            </svg>
            Share portfolio
          </button>
        </div>
        <span
          role="status"
          aria-live="polite"
          style={{ fontSize: 12, color: "var(--sp-muted)", minHeight: 16 }}
        >
          {shareStatus}
        </span>
      </div>
    </section>
  );
}
