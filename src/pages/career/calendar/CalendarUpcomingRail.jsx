// src/pages/career/calendar/CalendarUpcomingRail.jsx
import React from "react";
import { EVENT_TYPE_META } from "./eventContract.js";
import { formatDayLabel, formatTime, parseLocalDate, startOfDay } from "./dateUtils.js";

const RAIL_LIMIT = 6;

export default function CalendarUpcomingRail({ events, today, onOpenEvent, linkBase = "/career.html#" }) {
  const upcoming = React.useMemo(() => {
    const todayStart = startOfDay(today);
    return events
      .filter((evt) => {
        const d = parseLocalDate(evt.start);
        return d && startOfDay(d) >= todayStart;
      })
      .sort((a, b) => parseLocalDate(a.start) - parseLocalDate(b.start))
      .slice(0, RAIL_LIMIT);
  }, [events, today]);

  return (
    <aside className="cal-upcomingRail" aria-label="Upcoming">
      <h2 className="cal-upcomingTitle">Upcoming</h2>
      {upcoming.length === 0 ? (
        <p className="sh-muted cal-upcomingEmpty">Nothing coming up yet.</p>
      ) : (
        <ul className="cal-upcomingList">
          {upcoming.map((evt) => {
            const meta = EVENT_TYPE_META[evt.type];
            const d = parseLocalDate(evt.start);
            return (
              <li key={evt.id} className="cal-upcomingItem">
                <button type="button" className="cal-upcomingItemBtn" onClick={() => onOpenEvent(evt)}>
                  <span
                    className="cal-upcomingDot"
                    style={{ "--chip-color": `var(${meta.colorVar})` }}
                    aria-hidden="true"
                  />
                  <span className="cal-upcomingBody">
                    <span className="cal-upcomingItemTitle">{meta.icon} {evt.title}</span>
                    <span className="cal-upcomingItemMeta">
                      {formatDayLabel(d)}{!evt.allDay ? ` · ${formatTime(evt.start)}` : ""}
                    </span>
                  </span>
                </button>
                {evt.route && (
                  <a className="cal-upcomingAction" href={`${linkBase}${evt.route}`}>
                    Go →
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
