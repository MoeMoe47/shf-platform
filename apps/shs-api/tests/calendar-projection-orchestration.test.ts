// SHF Ecosystem Phase 9 — Canonical Calendar Projection Service:
// orchestration algorithm unit tests. These use hand-crafted in-memory
// fake adapters (never touching any real domain or database) to exercise
// dedup, ordering, partial-failure isolation, and hard-failure semantics
// deterministically — behaviors that are impractical to force through
// real source-domain data without corrupting it.
import test from "node:test";
import assert from "node:assert/strict";
import {
  getCalendarProjectionForActor, parseCalendarRange, CalendarRangeError, CalendarHardFailureError,
} from "../src/domain/calendar/service/calendar-projection-service.ts";
import { CalendarEventProjection } from "../src/domain/calendar/model/calendar-event.ts";

const ACTOR = { user_id: "u1", organization_id: "org1", roles: ["student"], permissions: [] };

function event(overrides: Partial<CalendarEventProjection>): CalendarEventProjection {
  return {
    id: "fake:1", sourceDomain: "assignment", sourceRecordId: "1", type: "ASSIGNMENT_DUE",
    title: "t", description: "", startsAt: "2026-01-01T00:00:00Z", endsAt: null, dueAt: null,
    allDay: false, sourceStatus: "x", status: "confirmed", priority: null, actionUrl: null,
    pathwayRelevant: null, metadata: {},
    ...overrides,
  };
}

function fakeAdapter(name: string, result: CalendarEventProjection[] | Error) {
  return { name, fn: async () => { if (result instanceof Error) throw result; return result; } };
}

test("13. stable IDs are deterministic across repeated calls", async () => {
  const adapters = [fakeAdapter("a", [event({ id: "assignment:1" })])];
  const first = await getCalendarProjectionForActor(ACTOR, null, adapters);
  const second = await getCalendarProjectionForActor(ACTOR, null, adapters);
  assert.equal(first.items[0].id, second.items[0].id);
});

test("14/32. a duplicate stable ID across sources dedupes; different kinds from the same record do not", async () => {
  const adapters = [
    fakeAdapter("a", [event({ id: "project:1:due" }), event({ id: "project:1:due" })]),
    fakeAdapter("b", [event({ id: "project:1:presentation" })]),
  ];
  const result = await getCalendarProjectionForActor(ACTOR, null, adapters);
  assert.equal(result.items.filter((e) => e.id === "project:1:due").length, 1, "identical id must dedupe");
  assert.ok(result.items.some((e) => e.id === "project:1:presentation"), "a distinct kind from the same source record must not be dropped");
});

test("34. same title/date from different domains remain distinct (no fuzzy dedupe)", async () => {
  const adapters = [
    fakeAdapter("a", [event({ id: "assignment:1", title: "Quiz", startsAt: "2026-01-01T00:00:00Z" })]),
    fakeAdapter("b", [event({ id: "career-event:1", title: "Quiz", startsAt: "2026-01-01T00:00:00Z" })]),
  ];
  const result = await getCalendarProjectionForActor(ACTOR, null, adapters);
  assert.equal(result.items.length, 2, "identical title/date from two different domains must never be merged");
});

test("24/25/26/27/28/29. one producer failing still returns the others, and unavailableSources names exactly which", async () => {
  const adapters = [
    fakeAdapter("assignments", [event({ id: "assignment:1" })]),
    fakeAdapter("live-learning", new Error("db timeout")),
    fakeAdapter("projects", [event({ id: "project:1:due" })]),
  ];
  const result = await getCalendarProjectionForActor(ACTOR, null, adapters);
  assert.equal(result.items.length, 2, "the two healthy producers' events must still be returned");
  assert.deepEqual(result.unavailableSources, ["live-learning"]);
  assert.equal(result.partial, true);
});

test("31. a total outage across every producer is a hard failure, not a silent empty success", async () => {
  const adapters = [
    fakeAdapter("a", new Error("boom")),
    fakeAdapter("b", new Error("boom")),
  ];
  await assert.rejects(() => getCalendarProjectionForActor(ACTOR, null, adapters), CalendarHardFailureError);
});

test("35. output is deterministic across repeated calls with identical input", async () => {
  const adapters = [
    fakeAdapter("a", [
      event({ id: "assignment:2", startsAt: "2026-01-02T00:00:00Z" }),
      event({ id: "assignment:1", startsAt: "2026-01-01T00:00:00Z" }),
    ]),
  ];
  const first = await getCalendarProjectionForActor(ACTOR, null, adapters);
  const second = await getCalendarProjectionForActor(ACTOR, null, adapters);
  assert.deepEqual(first.items.map((e) => e.id), second.items.map((e) => e.id));
});

test("27. deterministic ordering: primary date ascending, then type, then stable id", async () => {
  const adapters = [
    fakeAdapter("a", [
      event({ id: "z:1", type: "PROJECT_DUE", startsAt: "2026-01-01T00:00:00Z" }),
      event({ id: "a:1", type: "ASSIGNMENT_DUE", startsAt: "2026-01-01T00:00:00Z" }),
      event({ id: "b:1", type: "ASSIGNMENT_DUE", startsAt: "2025-12-01T00:00:00Z" }),
    ]),
  ];
  const result = await getCalendarProjectionForActor(ACTOR, null, adapters);
  assert.deepEqual(result.items.map((e) => e.id), ["b:1", "a:1", "z:1"]);
});

test("36/40/41. valid range accepted and correctly filters by overlap; a timed event intersecting the window is included", async () => {
  const range = parseCalendarRange("2026-01-01T00:00:00Z", "2026-01-31T00:00:00Z")!;
  const adapters = [
    fakeAdapter("a", [
      event({ id: "in-range", startsAt: "2026-01-15T00:00:00Z" }),
      event({ id: "out-of-range", startsAt: "2026-03-01T00:00:00Z" }),
      event({ id: "overlapping-timed", startsAt: "2025-12-31T23:00:00Z", endsAt: "2026-01-01T01:00:00Z" }),
    ]),
  ];
  const result = await getCalendarProjectionForActor(ACTOR, range, adapters);
  const ids = result.items.map((e) => e.id).sort();
  assert.deepEqual(ids, ["in-range", "overlapping-timed"]);
});

test("37/38/39. invalid or excessive ranges are rejected", () => {
  assert.throws(() => parseCalendarRange("not-a-date", "2026-01-01T00:00:00Z"), CalendarRangeError);
  assert.throws(() => parseCalendarRange("2026-01-31T00:00:00Z", "2026-01-01T00:00:00Z"), CalendarRangeError);
  assert.throws(() => parseCalendarRange("1900-01-01T00:00:00Z", "3000-01-01T00:00:00Z"), CalendarRangeError);
  assert.equal(parseCalendarRange(undefined, undefined), null, "no range params means no filtering");
});
