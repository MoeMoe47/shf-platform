// src/pages/AllPages.jsx
import React from "react";

const Section = ({ title, links }) => (
  <section className="card card--pad" style={{ padding: 12 }}>
    <h3 className="h4" style={{ marginTop: 0 }}>{title}</h3>
    <ul className="sh-listPlain" style={{ display:"grid", gap:6 }}>
      {links.map(({ to, label, note }) => (
        <li key={to} className="pathRow" style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8, alignItems:"center", padding:8, border:"1px solid var(--ring,#e5e7eb)", borderRadius:10 }}>
          <div>
            <div style={{ fontWeight:600 }}>{label}</div>
            <div className="subtle" style={{ fontSize:12 }}>{to}{note ? ` — ${note}` : ""}</div>
          </div>
          <a className="sh-btn sh-btn--secondary" href={to}>Open</a>
        </li>
      ))}
    </ul>
  </section>
);

export default function AllPages() {
  const career = [
    { to: "/career",          label: "Career Planner" },
    { to: "/explore",         label: "Pathways Explore" },
    { to: "/career/pathways", label: "Career Pathways (alt/legacy)" },
  ];

  const learner = [
    { to: "/dashboard",     label: "Dashboard" },
    { to: "/assignments",   label: "Assignments" },
    { to: "/calendar",      label: "Calendar" },
    { to: "/portfolio",     label: "Portfolio" },
    { to: "/rewards",       label: "Rewards Wallet" },
    { to: "/credit/report", label: "Credit Report" },
    { to: "/marketplace",   label: "Marketplace" },
    { to: "/settings",      label: "Settings" },
    { to: "/help",          label: "Help" },
  ];

  const curriculum = [
    { to: "/curriculum",                 label: "Curriculum Home" },
    { to: "/asl/lessons",               label: "ASL Lessons Index" },
    { to: "/asl/lesson/chapter1?demo=1",label: "LessonPage Demo (no API)", note: "uses ?demo=1" },
    // If your slugs exist in the API, add real ones too:
    // { to: "/asl/lesson/asl-1-foundations", label: "Lesson: ASL 1 Foundations" },
  ];

  const instructor = [
    { to: "/instructor",               label: "Instructor" },
    { to: "/instructor/unit/asl-01",   label: "Instructor Unit: ASL 01" },
    { to: "/master",                   label: "Master Index" },
    { to: "/master/unit/asl-1",        label: "Master Unit: ASL 1" },
  ];

  const coach = [
    { to: "/coach", label: "Coach" },
  ];

  const arcade = [
    { to: "/arcade",                   label: "Arcade" },
    { to: "/arcade/leaderboard",       label: "Arcade Leaderboard" },
    { to: "/arcade/games",             label: "Games Index" },
    { to: "/arcade/games/leaderboard", label: "Games Leaderboard" },
    { to: "/arcade-legacy",            label: "Arcade (legacy single page)" },
  ];

  const admin = [
    { to: "/admin",                 label: "Admin Dashboard" },
    { to: "/admin/alerts",          label: "Admin Alerts" },
    { to: "/admin/analytics",       label: "Admin Analytics" },
    { to: "/admin/cohorts",         label: "Admin Cohorts" },
    { to: "/admin/compare",         label: "Admin Compare" },
    { to: "/admin/credit",          label: "Admin Credit Debug" },
    { to: "/admin/learning-heatmap",label: "Admin Learning Heatmap" },
    { to: "/admin/relayer",         label: "Admin Relayer" },
    { to: "/admin/zoom",            label: "Admin Zoom" },
  ];

  const debug = [
    { to: "/debug/content", label: "Debug Content" },
    { to: "/_dev/pages",    label: "This Page" },
  ];

  return (
    <main className="page pad" style={{ display:"grid", gap:12 }}>
      <h2 className="h3" style={{ marginTop: 0 }}>All Pages (Dev Index)</h2>
      <Section title="Career Center" links={career} />
      <Section title="Student / Learner" links={learner} />
      <Section title="Curriculum" links={curriculum} />
      <Section title="Instructor / Master" links={instructor} />
      <Section title="Coach / Collab" links={coach} />
      <Section title="Arcade" links={arcade} />
      <Section title="Admin" links={admin} />
      <Section title="Debug / Dev" links={debug} />
    </main>
  );
}
