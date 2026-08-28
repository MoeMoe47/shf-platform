// src/pages/career/calendar/dateUtils.js
//
// No date library is installed in this project (checked package.json — no
// date-fns/dayjs/luxon), so these are small, deliberately-conservative
// local-date helpers. Every function operates on Y/M/D integers via the
// `new Date(year, monthIndex, day)` constructor rather than manual
// millisecond arithmetic, so month length, leap years and DST transitions
// are handled by the JS engine itself instead of being hand-rolled.
//
// All-day events are stored as plain "YYYY-MM-DD" strings and must always
// be parsed with parseLocalDate() below (never `new Date("YYYY-MM-DD")`,
// which parses as UTC midnight and can render as the previous day in
// negative-UTC-offset time zones — the single most common calendar bug).

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export { WEEKDAY_LABELS, MONTH_LABELS };

export function pad2(n) {
  return String(n).padStart(2, "0");
}

/** "YYYY-MM-DD" from a local Date, for all-day event keys and grid lookups. */
export function toDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Parses "YYYY-MM-DD" (or a full ISO datetime) as local time, never UTC. */
export function parseLocalDate(value) {
  if (value instanceof Date) return value;
  if (typeof value !== "string" || !value) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** The date-key an event should be filed under, using start (all-day-safe). */
export function eventDateKey(evt) {
  const d = parseLocalDate(evt.start);
  return d ? toDateKey(d) : null;
}

export function isSameDay(a, b) {
  return (
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

export function addMonths(date, n) {
  // Clamp to the 1st before adding months so e.g. Jan 31 + 1 month can't
  // silently overflow into March (a classic month-boundary bug).
  const d = new Date(date.getFullYear(), date.getMonth() + n, 1);
  return d;
}

export function startOfWeek(date, weekStartsOn = 0) {
  const d = startOfDay(date);
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  return addDays(d, -diff);
}

/** 42-cell (6x7) month grid, always full weeks, prev/next-month days flagged. */
export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const gridStart = addDays(first, -startWeekday);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    cells.push({
      date,
      key: toDateKey(date),
      inMonth: date.getMonth() === month,
      day: date.getDate(),
    });
  }
  // A month can need only 5 rows (35 cells); trim a trailing all-next-month
  // row so the grid doesn't show a wasted 6th row for short layouts.
  if (cells.length === 42) {
    const lastRowStart = 35;
    const lastRowAllOutside = cells.slice(lastRowStart).every((c) => !c.inMonth);
    const firstRowAllOutside = cells.slice(0, 7).every((c) => !c.inMonth);
    if (lastRowAllOutside && !firstRowAllOutside) return cells.slice(0, 35);
  }
  return cells;
}

export function buildWeekDays(anchorDate, weekStartsOn = 0) {
  const start = startOfWeek(anchorDate, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatMonthYear(date) {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWeekRange(anchorDate, weekStartsOn = 0) {
  const start = startOfWeek(anchorDate, weekStartsOn);
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = `${MONTH_LABELS[start.getMonth()].slice(0, 3)} ${start.getDate()}`;
  const endLabel = sameMonth
    ? `${end.getDate()}`
    : `${MONTH_LABELS[end.getMonth()].slice(0, 3)} ${end.getDate()}`;
  return `${startLabel}–${endLabel}, ${end.getFullYear()}`;
}

export function formatDayLabel(date) {
  return `${WEEKDAY_LABELS[date.getDay()]}, ${MONTH_LABELS[date.getMonth()]} ${date.getDate()}`;
}

export function formatTime(value) {
  const d = parseLocalDate(value);
  if (!d) return "";
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return minutes === 0 ? `${hours}:00 ${ampm}` : `${hours}:${pad2(minutes)} ${ampm}`;
}

/** Groups events by whether their start falls Today / Tomorrow / This Week / Later. */
export function groupForAgenda(events, today = new Date()) {
  const todayStart = startOfDay(today);
  const tomorrowStart = addDays(todayStart, 1);
  const weekEnd = addDays(todayStart, 7);

  const buckets = { today: [], tomorrow: [], thisWeek: [], later: [] };
  for (const evt of events) {
    const d = parseLocalDate(evt.start);
    if (!d) continue;
    const dayStart = startOfDay(d);
    if (isSameDay(dayStart, todayStart)) buckets.today.push(evt);
    else if (isSameDay(dayStart, tomorrowStart)) buckets.tomorrow.push(evt);
    else if (dayStart > tomorrowStart && dayStart < weekEnd) buckets.thisWeek.push(evt);
    else if (dayStart >= weekEnd) buckets.later.push(evt);
    // dayStart < todayStart (past events) are intentionally excluded from
    // the forward-looking agenda; callers filtering for "upcoming" already
    // exclude the past, this just documents the boundary explicitly.
  }
  const byStart = (a, b) => (parseLocalDate(a.start) - parseLocalDate(b.start));
  Object.values(buckets).forEach((list) => list.sort(byStart));
  return buckets;
}

export function isValidDateKey(key) {
  const d = parseLocalDate(key);
  return !!d && toDateKey(d) === key;
}

/** Groups events into a Map keyed by date-key, for month/week grid lookups. */
export function buildEventsByDay(events, dateKeyOf) {
  const map = new Map();
  for (const evt of events) {
    const key = dateKeyOf(evt);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(evt);
  }
  return map;
}
