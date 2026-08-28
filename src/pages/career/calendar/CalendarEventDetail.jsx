// src/pages/career/calendar/CalendarEventDetail.jsx
//
// Accessible event-detail dialog. Focus-trap/Escape/focus-restore mirrors
// the proven pattern already used by AppShellLayout's mobile nav drawer
// (src/layouts/AppShellLayout.jsx) rather than inventing a new one. Uses
// the shared --z-dialog token (career-shell.css :root) so it always sits
// above Ask Coach (--z-ask-coach) and the nav drawer (--z-nav-drawer).
import React from "react";
import { EVENT_TYPE_META } from "./eventContract.js";
import { formatDayLabel, formatTime, parseLocalDate } from "./dateUtils.js";

export default function CalendarEventDetail({ event, onClose, onEdit, onDelete, linkBase = "/career.html#" }) {
  const dialogRef = React.useRef(null);
  const returnFocusRef = React.useRef(document.activeElement);

  React.useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const focusables = () =>
      Array.from(node.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])'));
    focusables()[0]?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus?.();
    };
  }, [onClose]);

  if (!event) return null;
  const meta = EVENT_TYPE_META[event.type];
  const startDate = parseLocalDate(event.start);
  const titleId = "cal-event-detail-title";
  const descId = "cal-event-detail-desc";

  return (
    <div className="cal-dialogScrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        className="cal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={event.description ? descId : undefined}
      >
        <div className="cal-dialogHead">
          <span className="cal-typeChip" data-color-var={meta.colorVar}>
            <span aria-hidden="true">{meta.icon}</span> {meta.label}
          </span>
          <button type="button" className="cal-iconBtn" onClick={onClose} aria-label="Close event details">
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <h2 id={titleId} className="cal-dialogTitle">{event.title}</h2>

        <div className="cal-dialogMeta">
          {startDate && (
            <div className="cal-dialogRow">
              <span className="cal-dialogRowLabel">When</span>
              <span>
                {formatDayLabel(startDate)}
                {!event.allDay && ` · ${formatTime(event.start)}`}
                {event.allDay && " · All day"}
                {event.timeZone ? ` (${event.timeZone})` : ""}
              </span>
            </div>
          )}
          {event.location && (
            <div className="cal-dialogRow">
              <span className="cal-dialogRowLabel">Location</span>
              <span>{event.location}</span>
            </div>
          )}
          {event.meetingUrl && (
            <div className="cal-dialogRow">
              <span className="cal-dialogRowLabel">Meeting</span>
              <a href={event.meetingUrl} target="_blank" rel="noreferrer">Join link</a>
            </div>
          )}
          {event.organizer && (
            <div className="cal-dialogRow">
              <span className="cal-dialogRowLabel">Organizer</span>
              <span>{event.organizer}</span>
            </div>
          )}
          {event.status && event.status !== "confirmed" && (
            <div className="cal-dialogRow">
              <span className="cal-dialogRowLabel">Status</span>
              <span className="cal-statusBadge">{event.status}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p id={descId} className="cal-dialogDesc">{event.description}</p>
        )}

        <div className="cal-dialogActions">
          {event.editable ? (
            <>
              <button type="button" className="sh-btn sh-btn--soft" onClick={() => onEdit(event)}>Edit</button>
              <button type="button" className="sh-btn cal-btnDanger" onClick={() => onDelete(event)}>Delete</button>
            </>
          ) : event.route ? (
            <a className="sh-btn sh-btn--primary" href={`${linkBase}${event.route}`}>
              Go to {meta.label.toLowerCase()}
            </a>
          ) : (
            <p className="sh-muted cal-noActionNote">No linked destination for this event yet.</p>
          )}
          <button type="button" className="sh-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
