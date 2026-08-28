// src/pages/career/portfolio-sections/RecentAchievements.jsx
import React from "react";
import { BookIcon, AwardIcon, FlameIcon } from "@/components/curriculum/icons.jsx";

/**
 * No connected achievements/activity-feed data source exists in the
 * repo for this student. Isolated fallback list; a real activity feed
 * can replace this array without touching the rendering markup below.
 */
const ACHIEVEMENTS = [
  { id: "ai-agent", Icon: BookIcon, title: "Completed Building Your First AI Agent", date: "May 16, 2024" },
  { id: "ai-foundations", Icon: AwardIcon, title: "Earned AI Foundations credential", date: "May 12, 2024" },
  { id: "streak", Icon: FlameIcon, title: "12-day learning streak", date: "May 11, 2024" },
];

export default function RecentAchievements() {
  return (
    <section className="sp-card" aria-labelledby="sp-achievements-h">
      <div className="sp-cardHeadRow">
        <h2 id="sp-achievements-h" className="sp-cardTitle">
          Recent Achievements
        </h2>
      </div>

      <ol className="sp-achieveList">
        {ACHIEVEMENTS.map((a, i) => (
          <React.Fragment key={a.id}>
            <li className="sp-achieveItem">
              <span className="sp-achieveIcon" aria-hidden="true">
                <a.Icon size={18} />
              </span>
              <div className="sp-achieveText">
                <p className="sp-achieveTitle">{a.title}</p>
                <p className="sp-achieveDate">{a.date}</p>
              </div>
            </li>
            {i < ACHIEVEMENTS.length - 1 && <span className="sp-achieveConnector" aria-hidden="true" />}
          </React.Fragment>
        ))}
      </ol>
    </section>
  );
}
