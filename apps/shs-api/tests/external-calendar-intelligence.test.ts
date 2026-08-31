// SHF Ecosystem Phase 12.2 — Calendar Intelligence external-busy
// integration unit tests. Pure, in-memory, matching calendar-intelligence.test.ts's
// own established pattern exactly — no DB, no HTTP server.
import test from "node:test";
import assert from "node:assert/strict";
import { computeCalendarIntelligence } from "../src/domain/calendar/service/calendar-intelligence-service.ts";
import { CalendarEventProjection } from "../src/domain/calendar/model/calendar-event.ts";
import { CalendarProjectionResult } from "../src/domain/calendar/service/calendar-projection-service.ts";

function event(overrides: Partial<CalendarEventProjection>): CalendarEventProjection {
  return {
    id: "fake:1", sourceDomain: "assignment", sourceRecordId: "1", type: "ASSIGNMENT_DUE",
    title: "t", description: "", startsAt: "2026-01-01T00:00:00Z", endsAt: null, dueAt: null,
    allDay: false, sourceStatus: "x", status: "confirmed", priority: null, actionUrl: null,
    pathwayRelevant: null, metadata: {},
    ...overrides,
  };
}

function projection(items: CalendarEventProjection[], overrides: Partial<CalendarProjectionResult> = {}): CalendarProjectionResult {
  return { items, unavailableSources: [], partial: false, generatedAt: "2026-01-01T00:00:00Z", ...overrides };
}

const NOW = new Date("2026-01-01T00:00:00Z");

// --- 42. SHF-vs-SHF hard conflict unchanged -----------------------------

test("42. two overlapping SHF scheduled events still produce exactly one HARD_CONFLICT and zero external conflicts", () => {
  const items = [
    event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" }),
    event({ id: "career-event:1", type: "CAREER_EVENT", startsAt: "2026-01-01T14:30:00Z", endsAt: "2026-01-01T15:30:00Z" }),
  ];
  const result = computeCalendarIntelligence(projection(items), null, NOW);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].type, "HARD_CONFLICT");
  assert.equal(result.externalConflicts.length, 0);
});

// --- 43. SHF-vs-external busy conflict is a new, distinct type ---------

test("43. an SHF scheduled event overlapping external busy produces an EXTERNAL_BUSY_CONFLICT, never a HARD_CONFLICT", () => {
  const items = [event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" })];
  const externalAvailability = {
    intervals: [{ provider: "google", startsAt: "2026-01-01T14:30:00Z", endsAt: "2026-01-01T16:00:00Z" }],
    complete: true,
    unavailableProviders: [],
  };
  const result = computeCalendarIntelligence(projection(items), null, NOW, externalAvailability);
  assert.equal(result.conflicts.length, 0, "must never be counted as a HARD_CONFLICT");
  assert.equal(result.externalConflicts.length, 1);
  assert.equal(result.externalConflicts[0].type, "EXTERNAL_BUSY_CONFLICT");
  assert.equal(result.externalConflicts[0].eventId, "live-learning:1");
  assert.equal(result.externalConflicts[0].provider, "google");
});

test("43b. computeCalendarIntelligence called with no 4th argument behaves exactly as Phase 10/11 did (zero external conflicts, unchanged window label)", () => {
  const items = [event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" })];
  const range = { from: new Date("2026-01-01T00:00:00Z"), to: new Date("2026-01-02T00:00:00Z") };
  const result = computeCalendarIntelligence(projection(items), range, NOW);
  assert.equal(result.externalConflicts.length, 0);
  assert.equal(result.externalAvailabilityComplete, true);
  assert.equal(result.unavailableExternalProviders.length, 0);
  assert.ok(result.planningWindows.every((w) => w.label === "No SHF-scheduled event is currently projected during this window."));
});

// --- 44. planning window avoids external busy ---------------------------

test("44. a planning window never spans a known external busy interval", () => {
  const range = { from: new Date("2026-01-01T00:00:00Z"), to: new Date("2026-01-01T20:00:00Z") };
  const externalAvailability = {
    intervals: [{ provider: "microsoft", startsAt: "2026-01-01T10:00:00Z", endsAt: "2026-01-01T12:00:00Z" }],
    complete: true,
    unavailableProviders: [],
  };
  const result = computeCalendarIntelligence(projection([]), range, NOW, externalAvailability);
  for (const window of result.planningWindows) {
    const start = new Date(window.start).getTime();
    const end = new Date(window.end).getTime();
    const busyStart = new Date("2026-01-01T10:00:00Z").getTime();
    const busyEnd = new Date("2026-01-01T12:00:00Z").getTime();
    assert.ok(end <= busyStart || start >= busyEnd, `window ${window.start}-${window.end} must not overlap the external busy interval`);
  }
  assert.ok(result.planningWindows.some((w) => w.label === "No known scheduled conflict is visible in your connected calendar data during this window."));
});

// --- 45. unavailable provider sets completeness false --------------------

test("45. externalAvailabilityComplete reflects a failed provider", () => {
  const externalAvailability = { intervals: [], complete: false, unavailableProviders: ["google"] };
  const result = computeCalendarIntelligence(projection([]), null, NOW, externalAvailability as any);
  assert.equal(result.externalAvailabilityComplete, false);
  assert.deepEqual(result.unavailableExternalProviders, ["google"]);
});

// --- 46. unavailable provider never produces a false all-clear ----------

test("46. an incomplete/empty external availability result falls back to the original, non-overclaiming window label", () => {
  const range = { from: new Date("2026-01-01T00:00:00Z"), to: new Date("2026-01-01T05:00:00Z") };
  const externalAvailability = { intervals: [], complete: false, unavailableProviders: ["google"] };
  const result = computeCalendarIntelligence(projection([]), range, NOW, externalAvailability as any);
  // No external interval data was actually usable, so the label must
  // never claim "connected calendar data" was checked — the original,
  // more conservative Phase 10 wording is used instead.
  assert.ok(result.planningWindows.every((w) => w.label === "No SHF-scheduled event is currently projected during this window."));
});

// --- 47. recommendation remains deterministic ----------------------------

test("47. identical inputs (including external availability) produce identical recommendations", () => {
  const items = [event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" })];
  const externalAvailability = { intervals: [{ provider: "google", startsAt: "2026-01-01T14:30:00Z", endsAt: "2026-01-01T16:00:00Z" }], complete: true, unavailableProviders: [] };
  const first = computeCalendarIntelligence(projection(items), null, NOW, externalAvailability);
  const second = computeCalendarIntelligence(projection(items), null, NOW, externalAvailability);
  assert.deepEqual(first.recommendations, second.recommendations);
  assert.deepEqual(first.externalConflicts, second.externalConflicts);
});

// --- 48. no personal event title in recommendation -----------------------

test("48. an EXTERNAL_BUSY_CONFLICT recommendation names only the real SHF event, never any provider-supplied string", () => {
  const items = [event({ id: "live-learning:1", type: "LIVE_SESSION", title: "SHF Live Session", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" })];
  const externalAvailability = { intervals: [{ provider: "google", startsAt: "2026-01-01T14:30:00Z", endsAt: "2026-01-01T16:00:00Z" }], complete: true, unavailableProviders: [] };
  const result = computeCalendarIntelligence(projection(items), null, NOW, externalAvailability);
  const rec = result.recommendations.find((r) => r.reasonCode === "EXTERNAL_BUSY_CONFLICT");
  assert.ok(rec);
  assert.match(rec!.message, /SHF Live Session/);
  assert.match(rec!.message, /connected calendar/i);
  // FreeBusyInterval carries no title field to leak in the first place —
  // this assertion documents that guarantee at the call-site level too.
  assert.equal("title" in externalAvailability.intervals[0], false);
});

// --- one conflict per event, never a flood for multiple overlaps --------

test("one EXTERNAL_BUSY_CONFLICT recommendation per event, even with multiple overlapping external intervals", () => {
  const items = [event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T16:00:00Z" })];
  const externalAvailability = {
    intervals: [
      { provider: "google", startsAt: "2026-01-01T14:15:00Z", endsAt: "2026-01-01T14:45:00Z" },
      { provider: "microsoft", startsAt: "2026-01-01T15:15:00Z", endsAt: "2026-01-01T15:45:00Z" },
    ],
    complete: true,
    unavailableProviders: [],
  };
  const result = computeCalendarIntelligence(projection(items), null, NOW, externalAvailability);
  assert.equal(result.externalConflicts.length, 2, "both raw overlaps are still recorded in externalConflicts");
  assert.equal(result.recommendations.filter((r) => r.reasonCode === "EXTERNAL_BUSY_CONFLICT").length, 1, "but only one recommendation per event");
});
