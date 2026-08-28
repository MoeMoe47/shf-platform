// src/pages/curriculum/sections/UpcomingAssignmentsCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { GlobeIcon, CodeIcon, DatabaseIcon } from "@/components/curriculum/icons.jsx";

/**
 * No connected assignments-feed data source exists for Curriculum yet
 * (src/pages/Assignments.jsx renders its own static placeholder list).
 * Isolated here so a real feed can replace this array without touching
 * the row-rendering markup below.
 */
const ASSIGNMENTS = [
  {
    id: "intro-ml",
    title: "Intro to Machine Learning",
    course: "AI & Web Development",
    date: "Aug 21, 2026",
    day: "Thursday",
    status: "Due Soon",
    Icon: GlobeIcon,
    iconTone: "blue",
  },
  {
    id: "responsive-site",
    title: "Build a Responsive Website",
    course: "Web Development",
    date: "Aug 24, 2026",
    day: "Monday",
    status: "Due Soon",
    Icon: CodeIcon,
    iconTone: "slate",
  },
  {
    id: "db-fundamentals",
    title: "Database Fundamentals Quiz",
    course: "Data Fundamentals",
    date: "Aug 28, 2026",
    day: "Friday",
    status: "Due Later",
    Icon: DatabaseIcon,
    iconTone: "blue",
  },
];

export default function UpcomingAssignmentsCard() {
  return (
    <section className="ld-card ld-cardAssignments" aria-labelledby="ld-assign-h">
      <div className="ld-cardHeadRow">
        <p id="ld-assign-h" className="ld-eyebrow">Upcoming Assignments</p>
        <Link to="/curriculum/asl/assignments" className="ld-viewLink ld-viewLinkSmall">
          View all
        </Link>
      </div>

      <ul className="ld-assignList">
        {ASSIGNMENTS.map((a) => (
          <li key={a.id} className="ld-assignRow">
            <span className={`ld-assignIcon ld-tone-${a.iconTone}`} aria-hidden="true">
              <a.Icon size={18} />
            </span>
            <span className="ld-assignMain">
              <span className="ld-assignTitle">{a.title}</span>
              <span className="ld-assignCourse">{a.course}</span>
            </span>
            <span className="ld-assignDate">
              <span className="ld-assignDateValue">{a.date}</span>
              <span className="ld-assignDay">{a.day}</span>
            </span>
            <span className={`ld-statusPill ${a.status === "Due Soon" ? "is-soon" : "is-later"}`}>
              {a.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
