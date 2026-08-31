// SHF Ecosystem Phase 12 — ICS builder unit tests. Pure, no DB/server.
import test from "node:test";
import assert from "node:assert/strict";
import { buildIcsFeed } from "../src/domain/calendar-feed/service/ics-builder.ts";
import { CalendarEventProjection } from "../src/domain/calendar/model/calendar-event.ts";

function event(overrides: Partial<CalendarEventProjection>): CalendarEventProjection {
  return {
    id: "assignment:1", sourceDomain: "assignment", sourceRecordId: "1", type: "ASSIGNMENT_DUE",
    title: "t", description: "", startsAt: "2026-01-01T14:00:00Z", endsAt: null, dueAt: null,
    allDay: false, sourceStatus: "x", status: "confirmed", priority: null, actionUrl: null,
    pathwayRelevant: null, metadata: {},
    ...overrides,
  };
}

test("1. deterministic UID from the stable projection id", () => {
  const ics = buildIcsFeed([event({ id: "assignment:abc123" })]);
  assert.match(ics, /UID:assignment:abc123@calendar\.siliconheartland\.org/);
});

test("2. repeated builds produce the identical UID for the same event", () => {
  const items = [event({ id: "assignment:abc123" })];
  const first = buildIcsFeed(items, new Date("2026-01-01T00:00:00Z"));
  const second = buildIcsFeed(items, new Date("2026-01-02T00:00:00Z"));
  const uidOf = (ics: string) => ics.match(/UID:([^\r\n]+)/)?.[1];
  assert.equal(uidOf(first), uidOf(second), "UID must be stable across separate fetches, only DTSTAMP may differ");
});

test("3. a timed event with no real end gets a zero-duration DTEND, never a fabricated block", () => {
  const ics = buildIcsFeed([event({ startsAt: "2026-01-01T14:00:00Z", endsAt: null })]);
  const dtstart = ics.match(/DTSTART:([^\r\n]+)/)?.[1];
  const dtend = ics.match(/DTEND:([^\r\n]+)/)?.[1];
  assert.equal(dtstart, dtend);
});

test("4. a real interval event preserves its own start/end", () => {
  const ics = buildIcsFeed([event({ startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" })]);
  assert.match(ics, /DTSTART:20260101T140000Z/);
  assert.match(ics, /DTEND:20260101T150000Z/);
});

test("5. an all-day event uses VALUE=DATE, not a timed instant", () => {
  const ics = buildIcsFeed([event({ allDay: true, startsAt: "2026-01-01T00:00:00Z", endsAt: null, type: "OPPORTUNITY_DEADLINE" })]);
  assert.match(ics, /DTSTART;VALUE=DATE:20260101/);
  assert.match(ics, /DTEND;VALUE=DATE:20260102/, "all-day DTEND is the exclusive next day per RFC 5545 convention");
});

test("6. special characters are escaped per RFC 5545 (comma, semicolon, backslash, newline)", () => {
  const ics = buildIcsFeed([event({ title: 'Quiz 2; Part A, B\\C\nline two' })]);
  assert.match(ics, /SUMMARY:Quiz 2\\; Part A\\, B\\\\C\\nline two/);
});

test("7. a cancelled source status maps to STATUS:CANCELLED", () => {
  const ics = buildIcsFeed([event({ status: "cancelled" })]);
  assert.match(ics, /STATUS:CANCELLED/);
});

test("8. no RRULE is ever emitted — every projection is a single instance", () => {
  const ics = buildIcsFeed([event({}), event({ id: "assignment:2" })]);
  assert.ok(!ics.includes("RRULE"));
});

test("9. every VEVENT is marked CLASS:PRIVATE", () => {
  const ics = buildIcsFeed([event({})]);
  const count = (ics.match(/CLASS:PRIVATE/g) || []).length;
  assert.equal(count, 1);
});

test("10. long summary lines are folded per RFC 5545 (CRLF + leading space continuation)", () => {
  const longTitle = "A".repeat(120);
  const ics = buildIcsFeed([event({ title: longTitle })]);
  assert.match(ics, /SUMMARY:A+\r\n [A]+/);
});

test("11. an empty projection list produces a valid, empty VCALENDAR", () => {
  const ics = buildIcsFeed([]);
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  assert.ok(!ics.includes("BEGIN:VEVENT"));
});

test("12. CRLF line endings throughout", () => {
  const ics = buildIcsFeed([event({})]);
  assert.ok(ics.includes("\r\n"));
  assert.ok(!ics.includes("\n\n"), "no bare LF-only sequences");
});
