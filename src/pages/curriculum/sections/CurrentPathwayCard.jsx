// src/pages/curriculum/sections/CurrentPathwayCard.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * Mock content isolated as a single constant: there is no connected
 * "current pathway / resume lesson" data source in this repo yet
 * (src/pages/curriculum/Lesson.jsx reads a user-imported localStorage
 * list that is empty by default). Replace this object with real data
 * once a pathway-progress source exists; the JSX below does not need
 * to change.
 */
const CURRENT_PATHWAY = {
  name: "AI & Web Development",
  lessonTitle: "Building Your First AI Agent",
  percentComplete: 68,
};

export default function CurrentPathwayCard() {
  const pct = Math.max(0, Math.min(100, CURRENT_PATHWAY.percentComplete));

  return (
    <section className="ld-card ld-cardPathway" aria-labelledby="ld-pathway-h">
      <p className="ld-eyebrow">Current Pathway</p>
      <h2 id="ld-pathway-h" className="ld-cardTitle">{CURRENT_PATHWAY.name}</h2>

      <p className="ld-mutedLine">Resume where you left off</p>
      <p className="ld-lessonName">{CURRENT_PATHWAY.lessonTitle}</p>

      <div className="ld-progressRow">
        <div
          className="ld-progressBar"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${CURRENT_PATHWAY.lessonTitle} progress`}
        >
          <div className="ld-progressBarFill" style={{ width: `${pct}%` }} />
        </div>
        <span className="ld-progressPct">{pct}% complete</span>
      </div>

      <Link to="/curriculum/lessons" className="ld-btn ld-btnPrimary">
        Resume lesson
      </Link>
    </section>
  );
}
