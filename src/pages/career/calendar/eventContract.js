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
 * @typedef {"lesson"|"assignment"|"project"|"portfolio"|"mentor"|"arcade"|"credential"|"career"|"opportunity"|"personal"|"instructor"} CalendarEventType
 */

// One entry per event type: display label, the filter group it belongs to,
// a color token (CSS custom property name, not a literal hex — themeable in
// light/dark without touching this file), and a non-color icon glyph so
// type is never conveyed by color alone (WCAG 1.4.1).
//
// "opportunity" added for the SHF Learning Calendar rebuild (internships /
// scholarships / employer events / grants) — additive only, every existing
// type/filter/color is unchanged, so this is non-breaking for the Career
// Calendar already shipping on this file.
export const EVENT_TYPE_META = {
  lesson:      { label: "Learning",     filterGroup: "learning",     colorVar: "--cal-type-learning",     icon: "📚" },
  assignment:  { label: "Assignment",   filterGroup: "assignments",  colorVar: "--cal-type-assignment",   icon: "📝" },
  project:     { label: "Project",      filterGroup: "projects",     colorVar: "--cal-type-project",      icon: "🧩" },
  portfolio:   { label: "Portfolio",    filterGroup: "portfolio",    colorVar: "--cal-type-portfolio",    icon: "📁" },
  mentor:      { label: "Mentoring",    filterGroup: "mentoring",    colorVar: "--cal-type-mentor",       icon: "🤝" },
  arcade:      { label: "Arcade",       filterGroup: "arcade",       colorVar: "--cal-type-arcade",       icon: "🕹️" },
  credential:  { label: "Credential",   filterGroup: "credentials",  colorVar: "--cal-type-credential",   icon: "🎓" },
  career:      { label: "Career Event", filterGroup: "career",       colorVar: "--cal-type-career",       icon: "💼" },
  opportunity: { label: "Opportunity",  filterGroup: "opportunities",colorVar: "--cal-type-opportunity",  icon: "⭐" },
  personal:    { label: "Personal",     filterGroup: "personal",     colorVar: "--cal-type-personal",     icon: "📌" },
  instructor:  { label: "Live Session", filterGroup: "live",         colorVar: "--cal-type-live",          icon: "🎥" },
};

export const FILTER_GROUPS = [
  { id: "all",           label: "All" },
  { id: "learning",      label: "Learning" },
  { id: "live",          label: "Live" },
  { id: "assignments",   label: "Assignments" },
  { id: "projects",      label: "Projects" },
  { id: "portfolio",     label: "Portfolio" },
  { id: "mentoring",     label: "Mentoring" },
  { id: "arcade",        label: "Arcade" },
  { id: "credentials",   label: "Credentials" },
  { id: "career",        label: "Career Events" },
  { id: "opportunities", label: "Opportunities" },
  { id: "personal",      label: "Personal" },
];

let _seq = 0;
function nextLocalId() {
  _seq += 1;
  return `local-${Date.now()}-${_seq}`;
}

/**
 * SHF Calendar Wave 2A — deterministic Calendar event identity.
 * `sourceDomain + sourceRecordId` is the canonical identity: stable across
 * re-renders/re-fetches, source-neutral, and never a randomly generated
 * UUID (nextLocalId() above stays reserved for the one case that has no
 * real backend record to key off of — personal reminders' own local id
 * already serves that role, see reminders.js).
 *
 * Deliberately NOT title+date — two distinct real records can share both
 * (e.g. two different cohorts' "Quiz 2", both due the same day), and that
 * must never be treated as "the same event."
 */
export function createCalendarEventId(sourceDomain, sourceRecordId) {
  if (!sourceDomain || !sourceRecordId) {
    throw new Error("[CalendarEventId] both sourceDomain and sourceRecordId are required.");
  }
  return `${sourceDomain}:${sourceRecordId}`;
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
    // Free-form passthrough for source-specific data the common UI doesn't
    // need to know about (e.g. a Live Learning session's real backend id,
    // required to call requestJoin() — join authorization is 100%
    // server-side, see src/lib/liveLearning/api.js, so this is never a
    // ready-to-use URL, just enough for the caller to ask the real API).
    metadata: partial.metadata || null,
  };
}

/**
 * SHF Calendar Wave 2A — safe deduplication by canonical identity only.
 * If the same real record ever reached the Calendar twice (e.g. two
 * producers both surfacing the same underlying record before a future
 * source registers real cross-domain equivalence), the first occurrence
 * wins and the rest are dropped. Deliberately does NOT merge distinct
 * records that merely share a title/date/course — that would be
 * incorrect, not deduplication (see createCalendarEventId()'s own
 * comment for why title+date is never used as identity).
 *
 * Future cross-domain equivalence (e.g. a Career-side "employer workshop"
 * that Curriculum also references) is a distinct problem — real semantic
 * matching across two different canonical ids — and is out of scope
 * here; this only removes exact id collisions.
 */
export function dedupeCalendarEvents(events) {
  const seen = new Set();
  const out = [];
  for (const evt of events) {
    if (seen.has(evt.id)) continue;
    seen.add(evt.id);
    out.push(evt);
  }
  return out;
}
