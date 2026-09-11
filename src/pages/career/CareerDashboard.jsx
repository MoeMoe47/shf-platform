// src/pages/career/CareerDashboard.jsx
//
// SHF Ecosystem Phase 11.5 — "Upcoming assignments" and "Events this
// week" are Calendar facts, so they now derive from the same canonical
// GET /calendar/events/me every other SHF Calendar surface uses (Phase
// 9), instead of the hardcoded "3"/"2" this page previously always
// showed regardless of what was actually true. Portfolio counts are owned by
// Portfolio, so this dashboard links there instead of repeating a hardcoded
// count as a production fact.
import React from "react";
import { useUser } from "@/context/UserContext.jsx";
import { listCalendarEvents } from "@/lib/calendar/api.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function CareerDashboard() {
  const { role } = useUser();
  const [summary, setSummary] = React.useState({ loading: true, assignmentsDue: null, eventsThisWeek: null });

  React.useEffect(() => {
    let active = true;
    listCalendarEvents(role)
      .then((data) => {
        if (!active) return;
        const items = data?.items || [];
        const now = Date.now();
        const weekEnd = now + WEEK_MS;
        const inWindow = (iso) => {
          const t = iso ? new Date(iso).getTime() : NaN;
          return Number.isFinite(t) && t >= now && t <= weekEnd;
        };
        const assignmentsDue = items.filter((e) => e.type === "ASSIGNMENT_DUE" && inWindow(e.dueAt || e.startsAt)).length;
        const eventsThisWeek = items.filter((e) => (e.type === "LIVE_SESSION" || e.type === "CAREER_EVENT") && inWindow(e.startsAt)).length;
        setSummary({ loading: false, assignmentsDue, eventsThisWeek });
      })
      .catch(() => { if (active) setSummary({ loading: false, assignmentsDue: null, eventsThisWeek: null }); });
    return () => { active = false; };
  }, [role]);

  const displayCount = (value) => {
    if (summary.loading) return "…";
    return value === null ? "—" : value;
  };

  return (
    <section className="crb-main">
      <header className="db-head">
        <div>
          <h1 className="db-title">My Career Center</h1>
          <p className="db-subtitle">Personal assignments, calendar, portfolio, and planning.</p>
        </div>
      </header>

      <div className="db-grid db-grid--kpis">
        <div className="card card--pad">Upcoming assignments: <strong>{displayCount(summary.assignmentsDue)}</strong></div>
        <div className="card card--pad">Portfolio: <a href="/career.html#/portfolio">View artifacts and credentials</a></div>
        <div className="card card--pad">Events this week: <strong>{displayCount(summary.eventsThisWeek)}</strong></div>
      </div>
    </section>
  );
}
