// src/pages/career/calendar/eventContract.js
//
// One normalized event shape every source in the Career Calendar (real or
// demo) is adapted into, so the Calendar UI never reaches into a source
// system's own data shape directly. New sources register an adapter
// (see adapters.js) that returns arrays of objects built with
// createCalendarEvent() — the UI only ever depends on this contract.
//
// Only fields the app can actually populate today are used by any adapter;
// the rest exist so a future source can register without a contract change.

/**
 * @typedef {"lesson"|"assignment"|"portfolio"|"mentor"|"arcade"|"credential"|"career"|"personal"|"instructor"} CalendarEventType
 */

// One entry per event type: display label, the filter group it belongs to,
// a color token (CSS custom property name, not a literal hex — themeable in
// light/dark without touching this file), and a non-color icon glyph so
// type is never conveyed by color alone (WCAG 1.4.1).
export const EVENT_TYPE_META = {
  lesson:     { label: "Learning",     filterGroup: "learning",    colorVar: "--cal-type-learning",   icon: "📚" },
  assignment: { label: "Assignment",   filterGroup: "assignments", colorVar: "--cal-type-assignment", icon: "📝" },
  portfolio:  { label: "Portfolio",    filterGroup: "portfolio",   colorVar: "--cal-type-portfolio",  icon: "📁" },
  mentor:     { label: "Mentoring",    filterGroup: "mentoring",   colorVar: "--cal-type-mentor",     icon: "🤝" },
  arcade:     { label: "Arcade",       filterGroup: "arcade",      colorVar: "--cal-type-arcade",     icon: "🕹️" },
  credential: { label: "Credential",   filterGroup: "credentials", colorVar: "--cal-type-credential", icon: "🎓" },
  career:     { label: "Career Event", filterGroup: "career",      colorVar: "--cal-type-career",     icon: "💼" },
  personal:   { label: "Personal",     filterGroup: "personal",    colorVar: "--cal-type-personal",   icon: "📌" },
  instructor: { label: "Class Session",filterGroup: "learning",    colorVar: "--cal-type-learning",   icon: "🎥" },
};

export const FILTER_GROUPS = [
  { id: "all",         label: "All" },
  { id: "learning",    label: "Learning" },
  { id: "assignments", label: "Assignments" },
  { id: "portfolio",   label: "Portfolio" },
  { id: "mentoring",   label: "Mentoring" },
  { id: "arcade",      label: "Arcade" },
  { id: "credentials", label: "Credentials" },
  { id: "career",      label: "Career Events" },
  { id: "personal",    label: "Personal" },
];

let _seq = 0;
function nextLocalId() {
  _seq += 1;
  return `local-${Date.now()}-${_seq}`;
}

/**
 * Build a normalized event. Every field is optional except title/type/start;
 * unsupported/unknown fields are simply left undefined rather than guessed.
 */
export function createCalendarEvent(partial) {
  const now = new Date().toISOString();
  const type = partial.type;
  const meta = EVENT_TYPE_META[type];
  if (!meta) {
    throw new Error(`[CareerCalendar] Unknown event type "${type}" — register it in EVENT_TYPE_META first.`);
  }
  return {
    id: partial.id || nextLocalId(),
    title: partial.title || "Untitled event",
    description: partial.description || "",
    type,
    start: partial.start, // "YYYY-MM-DD" (all-day) or ISO datetime string
    end: partial.end || null,
    allDay: !!partial.allDay,
    timeZone: partial.timeZone || null, // null = browser-local, displayed explicitly when set
    location: partial.location || null,
    meetingUrl: partial.meetingUrl || null,
    route: partial.route || null, // in-app destination; only set when a real route exists
    source: partial.source || type, // which adapter produced this
    status: partial.status || "confirmed", // confirmed | tentative | cancelled
    priority: partial.priority || null, // low | medium | high
    dueDate: partial.dueDate || null,
    organizer: partial.organizer || null,
    participants: partial.participants || null,
    reminder: partial.reminder || null, // minutes-before, or null
    recurrence: partial.recurrence || null,
    colorVar: meta.colorVar,
    icon: meta.icon,
    completed: !!partial.completed,
    visibility: partial.visibility || "private", // this student's calendar only, today
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
    editable: !!partial.editable, // true only for this student's own personal reminders
  };
}
