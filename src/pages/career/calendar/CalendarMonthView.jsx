// src/pages/career/calendar/CalendarMonthView.jsx
import React from "react";
import { EVENT_TYPE_META } from "./eventContract.js";
import { buildMonthGrid, isSameDay, WEEKDAY_LABELS, toDateKey, buildEventsByDay } from "./dateUtils.js";

const MAX_VISIBLE_PER_CELL = 3;

export default function CalendarMonthView({ anchorDate, selectedDate, eventsByDay, today, onSelectDate, onOpenEvent }) {
  const grid = React.useMemo(
    () => buildMonthGrid(anchorDate.getFullYear(), anchorDate.getMonth()),
    [anchorDate]
  );
  const gridRef = React.useRef(null);

  function focusCell(key) {
    const el = gridRef.current?.querySelector(`[data-daykey="${key}"]`);
    el?.focus();
  }

  function onCellKeyDown(e, cell, index) {
    const deltas = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
    if (e.key in deltas) {
      e.preventDefault();
      const nextIndex = index + deltas[e.key];
      const nextCell = grid[nextIndex];
      if (nextCell) {
        onSelectDate(nextCell.date);
        focusCell(nextCell.key);
      }
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const dayEvents = eventsByDay.get(cell.key) || [];
      if (dayEvents[0]) onOpenEvent(dayEvents[0]);
    }
  }

  return (
    <div className="cal-month" role="grid" aria-label="Month view" ref={gridRef}>
      <div className="cal-monthHeadRow" role="row">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="cal-monthHeadCell" role="columnheader">{label}</div>
        ))}
      </div>
      <div className="cal-monthGrid">
        {grid.map((cell, i) => {
          const dayEvents = eventsByDay.get(cell.key) || [];
          const visible = dayEvents.slice(0, MAX_VISIBLE_PER_CELL);
          const overflow = dayEvents.length - visible.length;
          const isToday = isSameDay(cell.date, today);
          const isSelected = selectedDate && isSameDay(cell.date, selectedDate);

          return (
            <button
              type="button"
              key={cell.key}
              data-daykey={cell.key}
              role="gridcell"
              tabIndex={isSelected ? 0 : -1}
              aria-selected={isSelected}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${cell.date.toDateString()}${isToday ? ", today" : ""}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ", no events"}`}
              className={[
                "cal-dayCell",
                cell.inMonth ? "" : "is-outside",
                isToday ? "is-today" : "",
                isSelected ? "is-selected" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => onSelectDate(cell.date)}
              onKeyDown={(e) => onCellKeyDown(e, cell, i)}
            >
              <span className="cal-dayNumber">{cell.day}</span>
              <span className="cal-dayEvents">
                {visible.map((evt) => {
                  const meta = EVENT_TYPE_META[evt.type];
                  return (
                    <span
                      key={evt.id}
                      className="cal-dayEventChip"
                      style={{ "--chip-color": `var(${meta.colorVar})` }}
                      onClick={(e) => { e.stopPropagation(); onOpenEvent(evt); }}
                      title={evt.title}
                    >
                      <span aria-hidden="true" className="cal-dayEventDot" />
                      <span className="cal-dayEventTitle">{meta.icon} {evt.title}</span>
                    </span>
                  );
                })}
                {overflow > 0 && (
                  <span className="cal-dayEventMore">+{overflow} more</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { toDateKey, buildEventsByDay };
