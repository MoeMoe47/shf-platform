// src/pages/career/calendar/CalendarAgendaView.jsx
import React from "react";
import { EVENT_TYPE_META } from "./eventContract.js";
import { groupForAgenda, formatTime, parseLocalDate } from "./dateUtils.js";

const SECTIONS = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "thisWeek", label: "This Week" },
  { key: "later", label: "Later" },
];

export default function CalendarAgendaView({ events, today, onOpenEvent, emptyMessage = "New classes, deadlines, and events will show up here as they're scheduled. You can still add a personal reminder." }) {
  const buckets = React.useMemo(() => groupForAgenda(events, today), [events, today]);
  const hasAny = SECTIONS.some((s) => buckets[s.key].length > 0);

  if (!hasAny) {
    return (
      <div className="cal-emptyState" role="status">
        <p className="cal-emptyTitle">Nothing on your calendar right now.</p>
        <p className="sh-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="cal-agenda">
      {SECTIONS.map((section) => {
        const items = buckets[section.key];
        if (!items.length) return null;
        return (
          <section key={section.key} className="cal-agendaSection" aria-labelledby={`agenda-${section.key}`}>
            <h3 id={`agenda-${section.key}`} className="cal-agendaSectionTitle">{section.label}</h3>
            <ul className="cal-agendaList">
              {items.map((evt) => {
                const meta = EVENT_TYPE_META[evt.type];
                const d = parseLocalDate(evt.start);
                return (
                  <li key={evt.id}>
                    <button type="button" className="cal-agendaItem" onClick={() => onOpenEvent(evt)}>
                      <span
                        className="cal-agendaTypeDot"
                        style={{ "--chip-color": `var(${meta.colorVar})` }}
                        aria-hidden="true"
                      />
                      <span className="cal-agendaBody">
                        <span className="cal-agendaTitleRow">
                          <span aria-hidden="true">{meta.icon}</span>
                          <span className="cal-agendaTitle">{evt.title}</span>
                        </span>
                        <span className="cal-agendaMeta">
                          {evt.allDay ? "All day" : formatTime(d)}
                          {evt.location ? ` · ${evt.location}` : ""}
                          {" · "}
                          <span className="cal-agendaTypeLabel">{meta.label}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
