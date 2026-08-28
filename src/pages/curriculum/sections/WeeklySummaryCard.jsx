// src/pages/curriculum/sections/WeeklySummaryCard.jsx
import React from "react";
import { PersonCircleIcon, ClipboardIcon, FlameIcon } from "@/components/curriculum/icons.jsx";

/**
 * Reuses the same window.__mock* injection point the previous
 * CurriculumDashboard.jsx used for attendance, so any code that
 * already sets window.__mockAttendancePct keeps working. The two
 * new fields follow the identical, isolated convention so real data
 * can replace them the same way.
 */
function readMock(key, fallback) {
  const v = typeof window !== "undefined" ? window[key] : undefined;
  return Number.isFinite(v) ? v : fallback;
}

export default function WeeklySummaryCard() {
  const attendancePct = readMock("__mockAttendancePct", 86);
  const assignmentsDue = readMock("__mockAssignmentsDueCount", 3);
  const streakDays = readMock("__mockStreakDays", 12);

  return (
    <section className="ld-card" aria-labelledby="ld-week-h">
      <p id="ld-week-h" className="ld-eyebrow">This Week</p>

      <div className="ld-statRow">
        <div className="ld-stat">
          <PersonCircleIcon size={26} className="ld-statIcon" />
          <span className="ld-statValue">{attendancePct}%</span>
          <span className="ld-statLabel">Attendance</span>
        </div>
        <div className="ld-stat">
          <ClipboardIcon size={26} className="ld-statIcon" />
          <span className="ld-statValue">{assignmentsDue}</span>
          <span className="ld-statLabel">due</span>
          <span className="ld-statLabel ld-statLabelTop">Assignments</span>
        </div>
        <div className="ld-stat">
          <FlameIcon size={26} className="ld-statIcon" />
          <span className="ld-statValue">{streakDays}</span>
          <span className="ld-statLabel">days</span>
          <span className="ld-statLabel ld-statLabelTop">Streak</span>
        </div>
      </div>
    </section>
  );
}
