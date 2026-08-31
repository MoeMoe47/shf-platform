// src/pages/curriculum/calendar/UpcomingDeadlinesCard.jsx
//
// Next few time-sensitive items (anything with a dueDate — currently
// assignments and opportunities; see curriculumAdapters). "View all"
// links to the real Assignments page, the closest existing real
// destination for a full deadlines list.
import React from "react";
import { EVENT_TYPE_META } from "@/pages/career/calendar/eventContract.js";
import { formatDayLabel, parseLocalDate, startOfDay } from "@/pages/career/calendar/dateUtils.js";

const LIMIT = 5;

export default function UpcomingDeadlinesCard({ events, today, onOpenEvent }) {
  const deadlines = React.useMemo(() => {
    const todayStart = startOfDay(today);
    return events
      .filter((evt) => {
        if (!evt.dueDate) return false;
        const d = parseLocalDate(evt.dueDate);
        return d && startOfDay(d) >= todayStart;
      })
      .sort((a, b) => parseLocalDate(a.dueDate) - parseLocalDate(b.dueDate))
      .slice(0, LIMIT);
  }, [events, today]);

  return (
    <section className="lc-railCard" aria-labelledby="lc-deadlines-title">
      <div className="lc-railCardHead">
        <h2 id="lc-deadlines-title" className="lc-railCardTitle">Upcoming Deadlines</h2>
        <a className="lc-railViewAll" href="/curriculum.html#/curriculum/asl/assignments">
          View all
        </a>
      </div>
      {deadlines.length === 0 ? (
        <p className="lc-railEmpty">You're caught up.</p>
      ) : (
        <ul className="lc-plainList">
          {deadlines.map((evt) => {
            const meta = EVENT_TYPE_META[evt.type];
            const d = parseLocalDate(evt.dueDate);
            return (
              <li key={evt.id}>
                <button type="button" className="lc-plainRow" onClick={() => onOpenEvent(evt)}>
                  <span className="lc-typeDot" style={{ "--chip-color": `var(${meta.colorVar})` }} aria-hidden="true" />
                  <span className="lc-plainRowTitle">{evt.title}</span>
                  <span className="lc-plainRowDate">{d ? formatDayLabel(d).replace(/^\w+,\s/, "") : ""}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
