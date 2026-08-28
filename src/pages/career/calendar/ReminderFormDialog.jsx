// src/pages/career/calendar/ReminderFormDialog.jsx
import React from "react";
import { validateReminder } from "./reminders.js";
import { toDateKey } from "./dateUtils.js";

export default function ReminderFormDialog({ initial, onSave, onCancel }) {
  const dialogRef = React.useRef(null);
  const returnFocusRef = React.useRef(document.activeElement);
  const firstFieldRef = React.useRef(null);

  const [title, setTitle] = React.useState(initial?.title || "");
  const [date, setDate] = React.useState(initial?.date || toDateKey(new Date()));
  const [allDay, setAllDay] = React.useState(initial?.allDay ?? false);
  const [time, setTime] = React.useState(initial?.time || "09:00");
  const [note, setNote] = React.useState(initial?.note || "");
  const [remind, setRemind] = React.useState(!!initial?.reminderMinutes);
  const [errors, setErrors] = React.useState({});
  const [announce, setAnnounce] = React.useState("");

  React.useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    firstFieldRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "Tab") {
        const items = Array.from(node.querySelectorAll('a, button, input, textarea, [tabindex]:not([tabindex="-1"])'));
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
  }, [onCancel]);

  function handleSubmit(e) {
    e.preventDefault();
    const input = { title, date, allDay, time, note, reminderMinutes: remind ? 30 : null };
    const { ok, errors: fieldErrors } = validateReminder(input);
    if (!ok) {
      setErrors(fieldErrors);
      setAnnounce("There were problems with your reminder — check the highlighted fields.");
      return;
    }
    setErrors({});
    const result = onSave(input);
    if (result && result.ok === false) {
      setErrors(result.errors || {});
      setAnnounce("Couldn't save that reminder.");
    } else {
      setAnnounce(initial ? "Reminder updated." : "Reminder saved.");
    }
  }

  const titleId = "cal-reminder-form-title";

  return (
    <div className="cal-dialogScrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div ref={dialogRef} className="cal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="cal-dialogHead">
          <h2 id={titleId} className="cal-dialogTitle">{initial ? "Edit reminder" : "New personal reminder"}</h2>
          <button type="button" className="cal-iconBtn" onClick={onCancel} aria-label="Cancel">
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <p className="sh-muted cal-reminderScopeNote">
          Personal reminders are visible only to you. They can't represent official class, assignment, or credential events.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="cal-field">
            <label htmlFor="rem-title">Title</label>
            <input
              id="rem-title"
              ref={firstFieldRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "rem-title-err" : undefined}
              maxLength={120}
              required
            />
            {errors.title && <p id="rem-title-err" role="alert" className="cal-fieldError">{errors.title}</p>}
          </div>

          <div className="cal-fieldRow">
            <div className="cal-field">
              <label htmlFor="rem-date">Date</label>
              <input
                id="rem-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? "rem-date-err" : undefined}
                required
              />
              {errors.date && <p id="rem-date-err" role="alert" className="cal-fieldError">{errors.date}</p>}
            </div>

            <div className="cal-field">
              <label htmlFor="rem-time">Time</label>
              <input
                id="rem-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={allDay}
                aria-invalid={!!errors.time}
                aria-describedby={errors.time ? "rem-time-err" : undefined}
              />
              {errors.time && <p id="rem-time-err" role="alert" className="cal-fieldError">{errors.time}</p>}
            </div>
          </div>

          <label className="cal-checkboxRow">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            All-day
          </label>

          <label className="cal-checkboxRow">
            <input type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} />
            Remind me 30 minutes before
          </label>

          <div className="cal-field">
            <label htmlFor="rem-note">Note (optional)</label>
            <textarea
              id="rem-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              aria-invalid={!!errors.note}
              aria-describedby={errors.note ? "rem-note-err" : undefined}
            />
            {errors.note && <p id="rem-note-err" role="alert" className="cal-fieldError">{errors.note}</p>}
          </div>

          <div aria-live="polite" className="cal-srOnly">{announce}</div>

          <div className="cal-dialogActions">
            <button type="submit" className="sh-btn sh-btn--primary">Save</button>
            <button type="button" className="sh-btn" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
