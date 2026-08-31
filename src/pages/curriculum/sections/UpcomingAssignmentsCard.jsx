// src/pages/curriculum/sections/UpcomingAssignmentsCard.jsx
//
// SHF Ecosystem Phase 11.5 — this card used to render three permanently
// hardcoded assignments ("Intro to Machine Learning," fabricated Aug 2026
// dates) regardless of what was actually true for the signed-in learner.
// It now derives from the same canonical GET /calendar/events/me every
// other SHF Calendar surface uses (Phase 9). The original row layout's
// "course" subtitle and per-subject icon are dropped rather than faked —
// the Assignment domain carries no real course-name field to show
// honestly (see apps/shs-api/.../assignments/model/assignment.ts:
// lesson_id is an unlinked TEXT column, not a joinable course reference).
// "Due Soon" vs "Due Later" is a real, proximity-derived label (<=3 days),
// the same discipline Calendar Intelligence's own DEADLINE_SOON
// recommendation already uses (Phase 10).
import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { listCalendarEvents } from "@/lib/calendar/api.js";
import { AssignmentsIcon } from "@/components/curriculum/icons.jsx";

const LIMIT = 3;
const DUE_SOON_DAYS = 3;

function formatDate(iso) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}
function formatDay(iso) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date(iso));
}

export default function UpcomingAssignmentsCard() {
  const { role } = useUser();
  const [state, setState] = React.useState({ loading: true, items: [] });

  React.useEffect(() => {
    let active = true;
    listCalendarEvents(role)
      .then((data) => {
        if (!active) return;
        const now = Date.now();
        const items = (data?.items || [])
          .filter((e) => e.type === "ASSIGNMENT_DUE" && (e.dueAt || e.startsAt))
          .map((e) => ({ id: e.id, title: e.title, dueAt: e.dueAt || e.startsAt }))
          .filter((e) => new Date(e.dueAt).getTime() >= now)
          .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
          .slice(0, LIMIT);
        setState({ loading: false, items });
      })
      .catch(() => { if (active) setState({ loading: false, items: [] }); });
    return () => { active = false; };
  }, [role]);

  return (
    <section className="ld-card ld-cardAssignments" aria-labelledby="ld-assign-h">
      <div className="ld-cardHeadRow">
        <p id="ld-assign-h" className="ld-eyebrow">Upcoming Assignments</p>
        <Link to="/curriculum/asl/assignments" className="ld-viewLink ld-viewLinkSmall">
          View all
        </Link>
      </div>

      {state.loading ? (
        <p className="sh-muted">Loading…</p>
      ) : state.items.length === 0 ? (
        <p className="sh-muted">You&rsquo;re caught up — nothing due soon.</p>
      ) : (
        <ul className="ld-assignList">
          {state.items.map((a) => {
            const daysUntil = Math.floor((new Date(a.dueAt).getTime() - Date.now()) / 86_400_000);
            const isSoon = daysUntil <= DUE_SOON_DAYS;
            return (
              <li key={a.id} className="ld-assignRow">
                <span className="ld-assignIcon ld-tone-blue" aria-hidden="true">
                  <AssignmentsIcon size={18} />
                </span>
                <span className="ld-assignMain">
                  <span className="ld-assignTitle">{a.title}</span>
                </span>
                <span className="ld-assignDate">
                  <span className="ld-assignDateValue">{formatDate(a.dueAt)}</span>
                  <span className="ld-assignDay">{formatDay(a.dueAt)}</span>
                </span>
                <span className={`ld-statusPill ${isSoon ? "is-soon" : "is-later"}`}>
                  {isSoon ? "Due Soon" : "Due Later"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
