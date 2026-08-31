// SHF Ecosystem Phase 12 — RFC 5545 (iCalendar) builder.
//
// Pure, stateless: converts an already-entitled, already-canonical
// CalendarEventProjection[] (Phase 9's Calendar Projection Service — the
// same array GET /calendar/events/me returns) into standards-compliant
// ICS text. This module owns no truth of its own — it is a presentation
// format, exactly like the frontend's own calendar views. No recurrence
// is invented (no RRULE — every SHF projection event is one instance),
// no all-day status is invented for a timed deadline (§65 of the phase
// brief), and no event is skipped or added beyond what the Projection
// Service already returned for this actor.
import { CalendarEventProjection } from "../../calendar/model/calendar-event.js";

const ICS_LINE_LIMIT = 75; // RFC 5545 §3.1 recommends folding at 75 octets

function escapeIcsText(value: string): string {
  // Order matters: backslash first, so later escapes' own backslashes are
  // never re-escaped.
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// Folds a single unfolded content line per RFC 5545 §3.1 — a CRLF
// followed by a single leading space starts a continuation.
function foldLine(line: string): string {
  if (line.length <= ICS_LINE_LIMIT) return line;
  const parts: string[] = [];
  let rest = line;
  let first = true;
  while (rest.length > 0) {
    const width = first ? ICS_LINE_LIMIT : ICS_LINE_LIMIT - 1;
    parts.push(rest.slice(0, width));
    rest = rest.slice(width);
    first = false;
  }
  return parts.join("\r\n ");
}

function formatUtcDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function formatUtcDate(iso: string, addDays = 0): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + addDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

// Deterministic UID from the same stable projection id Phase 9 already
// guarantees never changes for the same source record — an external
// calendar client updates this same event on re-sync rather than
// duplicating it (phase brief §23/§24/§67).
function uidFor(projection: CalendarEventProjection): string {
  return `${projection.id}@calendar.siliconheartland.org`;
}

const STATUS_MAP: Record<CalendarEventProjection["status"], string> = {
  confirmed: "CONFIRMED",
  cancelled: "CANCELLED",
  tentative: "TENTATIVE",
};

function buildEvent(projection: CalendarEventProjection, dtstamp: string): string[] {
  const lines: string[] = [];
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${uidFor(projection)}`);
  lines.push(`DTSTAMP:${dtstamp}`);
  if (projection.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatUtcDate(projection.startsAt)}`);
    lines.push(`DTEND;VALUE=DATE:${formatUtcDate(projection.endsAt || projection.startsAt, 1)}`);
  } else {
    lines.push(`DTSTART:${formatUtcDateTime(projection.startsAt)}`);
    // No fabricated duration: an event with no real end (every deadline-
    // shaped projection) gets a zero-duration DTEND at the same instant,
    // never an invented block of time.
    lines.push(`DTEND:${formatUtcDateTime(projection.endsAt || projection.startsAt)}`);
  }
  lines.push(`SUMMARY:${escapeIcsText(projection.title)}`);
  if (projection.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(projection.description)}`);
  }
  lines.push(`STATUS:${STATUS_MAP[projection.status] || "CONFIRMED"}`);
  // CLASS:PRIVATE — this is one learner's own personal SHF schedule, never
  // intended for calendar-level public/shared visibility once subscribed.
  lines.push("CLASS:PRIVATE");
  lines.push("END:VEVENT");
  return lines;
}

export function buildIcsFeed(projections: CalendarEventProjection[], now: Date = new Date()): string {
  const dtstamp = formatUtcDateTime(now.toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Silicon Heartland Foundation//SHF Learning Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:SHF Learning Calendar",
  ];
  for (const projection of projections) {
    lines.push(...buildEvent(projection, dtstamp));
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
