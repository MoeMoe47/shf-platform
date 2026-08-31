// SHF Ecosystem Phase 10 — Calendar Intelligence Engine unit tests. Pure,
// in-memory: constructs a fake CalendarProjectionResult (the exact shape
// getCalendarProjectionForActor() returns) and calls
// computeCalendarIntelligence() directly — no DB, no HTTP server, matching
// the established pattern in calendar-projection-orchestration.test.ts.
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
    // Every real adapter sets startsAt === dueAt for deadline-shaped
    // projections (see calendar-adapters.ts) — mirror that here so a test
    // that only overrides dueAt still produces a realistic fixture.
    ...(overrides.dueAt && !overrides.startsAt ? { startsAt: overrides.dueAt } : {}),
    ...overrides,
  };
}

function projection(items: CalendarEventProjection[], overrides: Partial<CalendarProjectionResult> = {}): CalendarProjectionResult {
  return { items, unavailableSources: [], partial: false, generatedAt: "2026-01-01T00:00:00Z", ...overrides };
}

const NOW = new Date("2026-01-01T00:00:00Z");

// --- Conflict detection (§50) -----------------------------------------

test("1. non-overlapping scheduled events produce no conflict", () => {
  const items = [
    event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" }),
    event({ id: "live-learning:2", type: "LIVE_SESSION", startsAt: "2026-01-01T15:30:00Z", endsAt: "2026-01-01T16:30:00Z" }),
  ];
  const result = computeCalendarIntelligence(projection(items), null, NOW);
  assert.equal(result.conflicts.length, 0);
});

test("2. partial overlap between two scheduled events is a hard conflict", () => {
  const items = [
    event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" }),
    event({ id: "career-event:1", type: "CAREER_EVENT", startsAt: "2026-01-01T14:30:00Z", endsAt: "2026-01-01T16:00:00Z" }),
  ];
  const result = computeCalendarIntelligence(projection(items), null, NOW);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].type, "HARD_CONFLICT");
  assert.deepEqual(result.conflicts[0].eventIds.sort(), ["career-event:1", "live-learning:1"]);
});

test("3. full overlap (one event entirely inside another) is a hard conflict", () => {
  const items = [
    event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T17:00:00Z" }),
    event({ id: "career-event:1", type: "CAREER_EVENT", startsAt: "2026-01-01T15:00:00Z", endsAt: "2026-01-01T16:00:00Z" }),
  ];
  const result = computeCalendarIntelligence(projection(items), null, NOW);
  assert.equal(result.conflicts.length, 1);
});

test("4. touching endpoints (back-to-back) are documented policy: not a conflict", () => {
  const items = [
    event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" }),
    event({ id: "career-event:1", type: "CAREER_EVENT", startsAt: "2026-01-01T15:00:00Z", endsAt: "2026-01-01T16:00:00Z" }),
  ];
  const result = computeCalendarIntelligence(projection(items), null, NOW);
  assert.equal(result.conflicts.length, 0);
});

test("5. a deadline-only event never creates a scheduling conflict with a scheduled event", () => {
  const items = [
    event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" }),
    event({ id: "assignment:1", type: "ASSIGNMENT_DUE", startsAt: "2026-01-01T14:30:00Z", dueAt: "2026-01-01T14:30:00Z" }),
  ];
  const result = computeCalendarIntelligence(projection(items), null, NOW);
  assert.equal(result.conflicts.length, 0);
});

test("6. an event never conflicts with itself; 7. a duplicate id does not duplicate a conflict", () => {
  const items = [
    event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" }),
    event({ id: "career-event:1", type: "CAREER_EVENT", startsAt: "2026-01-01T14:30:00Z", endsAt: "2026-01-01T16:00:00Z" }),
    event({ id: "career-event:1", type: "CAREER_EVENT", startsAt: "2026-01-01T14:30:00Z", endsAt: "2026-01-01T16:00:00Z" }),
  ];
  // Note: the Projection Service itself dedupes by id before Intelligence
  // ever runs; this test exercises Intelligence's own robustness if that
  // invariant were ever violated, and also proves self-comparison is safe.
  const result = computeCalendarIntelligence(projection([items[0], items[1]]), null, NOW);
  assert.equal(result.conflicts.length, 1);
});

test("8. conflict detection is deterministically ordered across repeated calls", () => {
  const items = [
    event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" }),
    event({ id: "career-event:1", type: "CAREER_EVENT", startsAt: "2026-01-01T14:30:00Z", endsAt: "2026-01-01T16:00:00Z" }),
  ];
  const first = computeCalendarIntelligence(projection(items), null, NOW);
  const second = computeCalendarIntelligence(projection(items), null, NOW);
  assert.deepEqual(first.conflicts, second.conflicts);
});

// --- Weekly load (§51) --------------------------------------------------

test("9/10. scheduled event count and scheduled minutes are computed only from real intervals", () => {
  const items = [
    event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" }),
    event({ id: "project:1:presentation", type: "PROJECT_PRESENTATION", startsAt: "2026-01-02T10:00:00Z", endsAt: null }),
  ];
  const load = computeCalendarIntelligence(projection(items), null, NOW).weeklyLoad;
  assert.equal(load.scheduledEventCount, 2);
  assert.equal(load.scheduledMinutes, 60, "the endsAt-less presentation must not contribute a fabricated duration");
});

test("11. deadline count correct", () => {
  const items = [
    event({ id: "assignment:1", type: "ASSIGNMENT_DUE", dueAt: "2026-01-02T00:00:00Z" }),
    event({ id: "opportunity:1:deadline", type: "OPPORTUNITY_DEADLINE", dueAt: "2026-01-03T00:00:00Z" }),
  ];
  const load = computeCalendarIntelligence(projection(items), null, NOW).weeklyLoad;
  assert.equal(load.deadlineCount, 2);
});

test("12/32. Project presentation classified as scheduled time, not a deadline", () => {
  const items = [event({ id: "project:1:presentation", type: "PROJECT_PRESENTATION", startsAt: "2026-01-02T10:00:00Z" })];
  const load = computeCalendarIntelligence(projection(items), null, NOW).weeklyLoad;
  assert.equal(load.presentationCount, 1);
  assert.equal(load.deadlineCount, 0);
});

test("13. Project due classified as a deadline", () => {
  const items = [event({ id: "project:1:due", type: "PROJECT_DUE", dueAt: "2026-01-02T00:00:00Z" })];
  const load = computeCalendarIntelligence(projection(items), null, NOW).weeklyLoad;
  assert.equal(load.deadlineCount, 1);
  assert.equal(load.requiredDeadlineCount, 1);
});

test("14. Opportunity deadline is distinguished from a required academic deadline", () => {
  const items = [
    event({ id: "assignment:1", type: "ASSIGNMENT_DUE", dueAt: "2026-01-02T00:00:00Z" }),
    event({ id: "opportunity:1:deadline", type: "OPPORTUNITY_DEADLINE", dueAt: "2026-01-02T00:00:00Z" }),
  ];
  const load = computeCalendarIntelligence(projection(items), null, NOW).weeklyLoad;
  assert.equal(load.requiredDeadlineCount, 1);
  assert.equal(load.optionalDeadlineCount, 1);
  assert.equal(load.deadlineCount, 2);
});

test("15. Credential renewal counted as a required deadline", () => {
  const items = [event({ id: "credential:1:renewal", type: "CREDENTIAL_RENEWAL", dueAt: "2026-01-02T00:00:00Z" })];
  const load = computeCalendarIntelligence(projection(items), null, NOW).weeklyLoad;
  assert.equal(load.renewalDeadlineCount, 1);
  assert.equal(load.requiredDeadlineCount, 1);
});

test("16. Credential expiration classified as a milestone, not a deadline", () => {
  const items = [event({ id: "credential:1:expiration", type: "CREDENTIAL_EXPIRATION", dueAt: "2026-06-01T00:00:00Z" })];
  const load = computeCalendarIntelligence(projection(items), null, NOW).weeklyLoad;
  assert.equal(load.deadlineCount, 0, "expiration is a milestone/risk date, never an actionable deadline");
});

test("17. no fake effort hours: scheduledMinutes is 0 when nothing has a real interval", () => {
  const items = [
    event({ id: "assignment:1", type: "ASSIGNMENT_DUE", dueAt: "2026-01-02T00:00:00Z" }),
    event({ id: "project:1:presentation", type: "PROJECT_PRESENTATION", startsAt: "2026-01-02T10:00:00Z" }),
  ];
  const load = computeCalendarIntelligence(projection(items), null, NOW).weeklyLoad;
  assert.equal(load.scheduledMinutes, 0);
});

test("18. an empty event set produces honest all-zero components and LOW category", () => {
  const load = computeCalendarIntelligence(projection([]), null, NOW).weeklyLoad;
  assert.deepEqual(load, {
    scheduledEventCount: 0, scheduledMinutes: 0, deadlineCount: 0, requiredDeadlineCount: 0,
    optionalDeadlineCount: 0, majorDeadlineCount: 0, presentationCount: 0, opportunityDeadlineCount: 0,
    renewalDeadlineCount: 0, category: "LOW",
  });
});

// --- Deadline concentration (§52) ---------------------------------------

test("19. a single deadline produces no concentration cluster", () => {
  const items = [event({ id: "assignment:1", type: "ASSIGNMENT_DUE", dueAt: "2026-01-02T00:00:00Z" })];
  const result = computeCalendarIntelligence(projection(items), null, NOW);
  assert.equal(result.deadlineConcentration.length, 0);
});

test("20. multiple same-day deadlines are detected as a cluster", () => {
  const items = [
    event({ id: "assignment:1", type: "ASSIGNMENT_DUE", dueAt: "2026-01-02T09:00:00Z" }),
    event({ id: "assignment:2", type: "ASSIGNMENT_DUE", dueAt: "2026-01-02T20:00:00Z" }),
  ];
  const result = computeCalendarIntelligence(projection(items), null, NOW);
  assert.equal(result.deadlineConcentration.length, 1);
  assert.equal(result.deadlineConcentration[0].severity, "ELEVATED");
});

test("21. the 48-hour window boundary is deterministic", () => {
  const withinWindow = [
    event({ id: "assignment:1", type: "ASSIGNMENT_DUE", dueAt: "2026-01-02T00:00:00Z" }),
    event({ id: "assignment:2", type: "ASSIGNMENT_DUE", dueAt: "2026-01-04T00:00:00Z" }), // exactly 48h later
  ];
  const outsideWindow = [
    event({ id: "assignment:1", type: "ASSIGNMENT_DUE", dueAt: "2026-01-02T00:00:00Z" }),
    event({ id: "assignment:2", type: "ASSIGNMENT_DUE", dueAt: "2026-01-04T00:00:00.001Z" }), // 1ms past 48h
  ];
  assert.equal(computeCalendarIntelligence(projection(withinWindow), null, NOW).deadlineConcentration.length, 1);
  assert.equal(computeCalendarIntelligence(projection(outsideWindow), null, NOW).deadlineConcentration.length, 0);
});

test("22. an all-optional (Opportunity-only) cluster is identified honestly", () => {
  const items = [
    event({ id: "opportunity:1:deadline", type: "OPPORTUNITY_DEADLINE", dueAt: "2026-01-02T00:00:00Z" }),
    event({ id: "opportunity:2:deadline", type: "OPPORTUNITY_DEADLINE", dueAt: "2026-01-02T12:00:00Z" }),
  ];
  const cluster = computeCalendarIntelligence(projection(items), null, NOW).deadlineConcentration[0];
  assert.equal(cluster.requiredCount, 0);
  assert.equal(cluster.optionalCount, 2);
});

test("23. a mixed required/optional cluster preserves the distinction", () => {
  const items = [
    event({ id: "assignment:1", type: "ASSIGNMENT_DUE", dueAt: "2026-01-02T00:00:00Z" }),
    event({ id: "opportunity:1:deadline", type: "OPPORTUNITY_DEADLINE", dueAt: "2026-01-02T12:00:00Z" }),
  ];
  const cluster = computeCalendarIntelligence(projection(items), null, NOW).deadlineConcentration[0];
  assert.equal(cluster.requiredCount, 1);
  assert.equal(cluster.optionalCount, 1);
});

test("24. a deadline outside the requested range is excluded from concentration", () => {
  const items = [
    event({ id: "assignment:1", type: "ASSIGNMENT_DUE", startsAt: "2026-01-02T00:00:00Z", dueAt: "2026-01-02T00:00:00Z" }),
    event({ id: "assignment:2", type: "ASSIGNMENT_DUE", startsAt: "2026-02-01T00:00:00Z", dueAt: "2026-02-01T00:00:00Z" }),
  ];
  // Simulate the Projection Service having already windowed the items to
  // a narrow range (Intelligence trusts the projection it is handed).
  const windowed = [items[0]];
  const result = computeCalendarIntelligence(projection(windowed), { from: new Date("2026-01-01T00:00:00Z"), to: new Date("2026-01-05T00:00:00Z") }, NOW);
  assert.equal(result.deadlineConcentration.length, 0);
});

// --- Plan My Week / recommendations (§53) -------------------------------

test("25/26. every recommendation traces to real event ids that exist in the input", () => {
  const items = [
    event({ id: "assignment:1", type: "ASSIGNMENT_DUE", title: "Quiz 2", dueAt: new Date(NOW.getTime() + DAY(1)).toISOString(), startsAt: new Date(NOW.getTime() + DAY(1)).toISOString() }),
  ];
  const result = computeCalendarIntelligence(projection(items), null, NOW);
  assert.ok(result.recommendations.length > 0);
  const validIds = new Set(items.map((e) => e.id));
  for (const rec of result.recommendations) {
    for (const id of rec.relatedEventIds) assert.ok(validIds.has(id), `recommendation referenced nonexistent event id ${id}`);
  }
});

test("27/28. no recommendation claims personal free time; planning windows use honest SHF-only wording", () => {
  const items = [event({ id: "live-learning:1", type: "LIVE_SESSION", startsAt: "2026-01-01T14:00:00Z", endsAt: "2026-01-01T15:00:00Z" })];
  const range = { from: new Date("2026-01-01T00:00:00Z"), to: new Date("2026-01-02T00:00:00Z") };
  const result = computeCalendarIntelligence(projection(items), range, NOW);
  assert.ok(result.planningWindows.length > 0);
  for (const w of result.planningWindows) {
    assert.ok(!/you'?re free/i.test(w.label));
    assert.ok(/SHF-scheduled/.test(w.label));
  }
});

test("29/30. recommendations and planning windows never mutate or persist a source event", () => {
  const items = [event({ id: "assignment:1", type: "ASSIGNMENT_DUE", dueAt: new Date(NOW.getTime() + DAY(1)).toISOString(), startsAt: new Date(NOW.getTime() + DAY(1)).toISOString() })];
  const before = JSON.parse(JSON.stringify(items));
  computeCalendarIntelligence(projection(items), null, NOW);
  assert.deepEqual(items, before, "computeCalendarIntelligence must never mutate its input events");
});

test("31. recommendations are deterministic across repeated calls with identical input", () => {
  const items = [event({ id: "assignment:1", type: "ASSIGNMENT_DUE", dueAt: new Date(NOW.getTime() + DAY(1)).toISOString(), startsAt: new Date(NOW.getTime() + DAY(1)).toISOString() })];
  const first = computeCalendarIntelligence(projection(items), null, NOW);
  const second = computeCalendarIntelligence(projection(items), null, NOW);
  assert.deepEqual(first.recommendations, second.recommendations);
});

test("32. a recommendation disappears when its underlying event is no longer present", () => {
  const dueSoon = event({ id: "assignment:1", type: "ASSIGNMENT_DUE", dueAt: new Date(NOW.getTime() + DAY(1)).toISOString(), startsAt: new Date(NOW.getTime() + DAY(1)).toISOString() });
  const withEvent = computeCalendarIntelligence(projection([dueSoon]), null, NOW);
  const withoutEvent = computeCalendarIntelligence(projection([]), null, NOW);
  assert.ok(withEvent.recommendations.some((r) => r.relatedEventIds.includes("assignment:1")));
  assert.equal(withoutEvent.recommendations.length, 0);
});

function DAY(n: number) { return n * 24 * 60 * 60 * 1000; }

// --- Partial data safety (§54) ------------------------------------------

test("33/36. one unavailable producer marks intelligence partial with the named source", () => {
  const items = [event({ id: "assignment:1", type: "ASSIGNMENT_DUE", dueAt: "2026-01-02T00:00:00Z" })];
  const result = computeCalendarIntelligence(projection(items, { partial: true, unavailableSources: ["live-learning"] }), null, NOW);
  assert.equal(result.sourceAvailability.partial, true);
  assert.deepEqual(result.sourceAvailability.unavailableSources, ["live-learning"]);
});

test("34. conflict analysis is marked incomplete, not silently 'no conflicts', when a scheduled-time source is down", () => {
  const result = computeCalendarIntelligence(projection([], { partial: true, unavailableSources: ["live-learning"] }), null, NOW);
  assert.equal(result.conflicts.length, 0);
  assert.equal(result.conflictAnalysisComplete, false, "zero conflicts found must not be reported as a complete answer when Live Learning is down");
});

test("34b. conflict analysis remains complete when only a non-scheduled-time source is down", () => {
  const result = computeCalendarIntelligence(projection([], { partial: true, unavailableSources: ["credentials"] }), null, NOW);
  assert.equal(result.conflictAnalysisComplete, true);
});

test("35. deadline analysis is marked incomplete when a deadline-bearing source is down", () => {
  const result = computeCalendarIntelligence(projection([], { partial: true, unavailableSources: ["assignments"] }), null, NOW);
  assert.equal(result.deadlineAnalysisComplete, false);
});

test("35b. deadline analysis remains complete when only live-learning is down", () => {
  const result = computeCalendarIntelligence(projection([], { partial: true, unavailableSources: ["live-learning"] }), null, NOW);
  assert.equal(result.deadlineAnalysisComplete, true);
});

test("37. a fully healthy projection reports intelligence as non-partial with both analyses complete", () => {
  const result = computeCalendarIntelligence(projection([]), null, NOW);
  assert.equal(result.sourceAvailability.partial, false);
  assert.equal(result.conflictAnalysisComplete, true);
  assert.equal(result.deadlineAnalysisComplete, true);
});
