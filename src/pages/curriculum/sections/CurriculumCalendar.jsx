// src/pages/curriculum/sections/CurriculumCalendar.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function CurriculumCalendar() {
  return (
    <section className="ld-card ld-cardCalendar" aria-labelledby="ld-cal-h">
      <div className="ld-cardHeadRow">
        <p id="ld-cal-h" className="ld-eyebrow">Learning calendar</p>
        <Link className="ld-viewLink ld-viewLinkSmall" to="/curriculum/asl/calendar">Open calendar</Link>
      </div>
      <p className="ld-calendarSummary">View live learning sessions, weekly schedules, and upcoming Curriculum activity.</p>
    </section>
  );
}
