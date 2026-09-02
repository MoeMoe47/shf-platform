// src/pages/curriculum/sections/WeeklySummaryCard.jsx
import React from "react";
import { PersonCircleIcon, ClipboardIcon, FlameIcon } from "@/components/curriculum/icons.jsx";

/**
 * No canonical weekly attendance, assignment, or streak aggregate exists
 * for this surface yet. Do not render browser-injected or fallback values
 * as institutional progress.
 */

export default function WeeklySummaryCard() {
  return (
    <section className="ld-card" aria-labelledby="ld-week-h">
      <p id="ld-week-h" className="ld-eyebrow">This Week</p>

      <div className="ld-statRow">
        <div className="ld-stat">
          <PersonCircleIcon size={26} className="ld-statIcon" />
          <span className="ld-statValue">—</span>
          <span className="ld-statLabel">Attendance</span>
        </div>
        <div className="ld-stat">
          <ClipboardIcon size={26} className="ld-statIcon" />
          <span className="ld-statValue">—</span>
          <span className="ld-statLabel">due</span>
          <span className="ld-statLabel ld-statLabelTop">Assignments</span>
        </div>
        <div className="ld-stat">
          <FlameIcon size={26} className="ld-statIcon" />
          <span className="ld-statValue">—</span>
          <span className="ld-statLabel">days</span>
          <span className="ld-statLabel ld-statLabelTop">Streak</span>
        </div>
      </div>
    </section>
  );
}
