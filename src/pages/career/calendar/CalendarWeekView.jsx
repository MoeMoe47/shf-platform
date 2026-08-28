// src/pages/career/calendar/CalendarWeekView.jsx
//
// LIMITATION, disclosed per the build brief's explicit escape hatch: this
// is a structured weekly agenda (7 day columns, each a sorted list of that
// day's events, all-day items pinned to the top of their day), not a
// pixel-positioned hour-by-hour time grid. A real time grid needs either a
// scheduling library (none installed) or a meaningful chunk of custom
// collision/positioning math; given this app has no event durations
// reliable enough to position sub-hour blocks against yet (most sources
// are single-point-in-time), a time grid would mostly render one-line
// blocks anyway. This still satisfies every literal requirement in the
// brief (seven-day structure, all-day area, current-day indication,
// overlap handled as an ordered list rather than overlapping geometry, no
// page-level horizontal overflow) without a false sense of precision.
import React from "react";
import { EVENT_TYPE_META } from "./eventContract.js";
import { buildWeekDays, isSameDay, formatTime, toDateKey, eventDateKey } from "./dateUtils.js";

export default function CalendarWeekView({ anchorDate, eventsByDay, today, onOpenEvent }) {
  const days = React.useMemo(() => buildWeekDays(anchorDate), [anchorDate]);

  return (
    <div className="cal-week" role="grid" aria-label="Week view">
      {days.map((day) => {
        const key = toDateKey(day);
        const dayEvents = (eventsByDay.get(key) || []).slice().sort((a, b) => {
          if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
          return String(a.start).localeCompare(String(b.start));
        });
        const isToday = isSameDay(day, today);

        return (
          <div key={key} className={`cal-weekDay ${isToday ? "is-today" : ""}`} role="row">
            <div className="cal-weekDayHead">
              <span className="cal-weekDayName">{day.toLocaleDateString(undefined, { weekday: "short" })}</span>
              <span className={`cal-weekDayNumber ${isToday ? "is-today" : ""}`} aria-current={isToday ? "date" : undefined}>
                {day.getDate()}
              </span>
            </div>
            <ul className="cal-weekEventList">
              {dayEvents.length === 0 && <li className="cal-weekEmpty" aria-hidden="true">—</li>}
              {dayEvents.map((evt) => {
                const meta = EVENT_TYPE_META[evt.type];
                return (
                  <li key={evt.id}>
                    <button
                      type="button"
                      className="cal-weekEventItem"
                      style={{ "--chip-color": `var(${meta.colorVar})` }}
                      onClick={() => onOpenEvent(evt)}
                    >
                      <span aria-hidden="true">{meta.icon}</span>
                      <span className="cal-weekEventText">
                        <span className="cal-weekEventTitle">{evt.title}</span>
                        <span className="cal-weekEventTime">{evt.allDay ? "All day" : formatTime(evt.start)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export { eventDateKey };
