// src/pages/career/portfolio-sections/StudentProfileHero.jsx
import React from "react";
import { useEntitlements } from "@/context/EntitlementsContext.jsx";

export default function StudentProfileHero({
  editOpen,
  onToggleEdit,
  artifactCount = 0,
  learnerResultCount = 0,
  skillCount = 0,
  credentialCount = null,
  organizationName = "",
  pathwayName = "",
  studentName = "",
  aboutText = "",
  avatarReference = null,
}) {
  const { user } = useEntitlements();
  const displayName = studentName || user?.name || "Student";

  return (
    <section className="sp-card sp-hero" aria-labelledby="sp-hero-name">
      <div className="sp-heroLeft">
        {avatarReference ? (
          <img src={avatarReference} alt={`${displayName}'s profile photo`} className="sp-avatar" />
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
          <p className="sp-heroRole">{pathwayName || "Learning pathway unavailable"}</p>
          <p className="sp-heroLocation">{organizationName || "Organization details unavailable in this view."}</p>
          <p className="sp-heroIntro">
            {aboutText ? `"${aboutText}"` : "Student-authored introduction has not been added yet."}
          </p>
          <p className="sp-heroLocation">Profile presentation fields are learner-owned and not verified evidence.</p>
        </div>
      </div>

      <div className="sp-heroRight">
        <div className="sp-heroStats">
          <div className="sp-heroStat">
            <span className="sp-heroStatIcon" aria-hidden="true">▥</span>
            <span className="sp-heroStatValue">{artifactCount}</span>
            <span className="sp-heroStatLabel">Verified artifacts</span>
          </div>
          <div className="sp-heroStat">
            <span className="sp-heroStatIcon" aria-hidden="true">◫</span>
            <span className="sp-heroStatValue">{learnerResultCount}</span>
            <span className="sp-heroStatLabel">Learning results</span>
          </div>
          <div className="sp-heroStat">
            <span className="sp-heroStatIcon" aria-hidden="true">▤</span>
            <span className="sp-heroStatValue">{skillCount}</span>
            <span className="sp-heroStatLabel">Skills verified</span>
          </div>
          <div className="sp-heroStat">
            <span className="sp-heroStatIcon" aria-hidden="true">◉</span>
            <span className="sp-heroStatValue">{credentialCount == null ? "—" : credentialCount}</span>
            <span className="sp-heroStatLabel">Issued credentials</span>
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
            Upload / Change Photo
          </button>
        </div>
      </div>
    </section>
  );
}
