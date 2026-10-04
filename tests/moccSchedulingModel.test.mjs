import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { projectMoccEvents, projectMoccTimelineEvents } from "../src/system/metaverse/operations/moccEventProjection.js";
import { buildMoccDependencyGraph } from "../src/system/metaverse/operations/moccDependencyGraph.js";
import { filterMoccSchedules, projectMoccSchedules } from "../src/system/metaverse/operations/moccSchedulingModel.js";

const componentSource = readFileSync(new URL("../src/pages/metaverse/operations/MetaverseOperationsCommandCenter.jsx", import.meta.url), "utf8");

function schedule(overrides = {}) {
  return {
    schedule_id: "schedule-1",
    title: "Planned mission window",
    schedule_type: "MISSION_START",
    domain: "MISSIONS",
    planned_start: "2026-11-02T14:00:00.000Z",
    planned_end: "2026-11-02T15:00:00.000Z",
    timezone: "UTC",
    target_reference: "mission-1",
    source_authority: "MET-7_MISSION_AUTHORITY",
    source_reference: "mission-schedule-1",
    approval_required: false,
    ...overrides,
  };
}

test("schedule projections preserve source provenance and remain separate from domain authority", () => {
  const source = schedule();
  const before = structuredClone(source);
  const [planned] = projectMoccSchedules([source]);
  assert.deepEqual(source, before);
  assert.equal(planned.source_authority, "MET-7_MISSION_AUTHORITY");
  assert.equal(planned.source_reference, "mission-schedule-1");
  assert.equal(planned.target_reference, "mission-1");
  assert.equal(planned.owning_system, "MET-7 Missions via MET-11 Orchestration");
  assert.equal(planned.required_authorities[0], planned.owning_system);
  assert.equal(planned.execution_readiness, "READY_FOR_FUTURE_EXECUTION");
});

test("pending integration keeps planning intent but prevents future execution", () => {
  const [planned] = projectMoccSchedules([schedule({ domain: "TRAFFIC" })]);
  assert.equal(planned.integration_status, "PENDING");
  assert.equal(planned.schedule_status, "PENDING_INTEGRATION");
  assert.equal(planned.execution_readiness, "PENDING_INTEGRATION");
});

test("not-connected, partial, and foundation domains cannot become executable", () => {
  for (const [domain, expected] of [["UTILITIES", "INTEGRATION_NOT_CONNECTED"], ["MARINE_AVIATION", "INTEGRATION_PARTIAL"]]) {
    const [planned] = projectMoccSchedules([schedule({ domain })]);
    assert.equal(planned.execution_readiness, "NOT_EXECUTABLE");
    assert.ok(planned.conflicts.some(({ code }) => code === expected));
  }
});

test("connected status and unverified approval fields do not bypass unconfigured approval", () => {
  const [planned] = projectMoccSchedules([schedule({ approval_required: true, approval_status: "APPROVED", approved_by: "operator-1" })]);
  assert.equal(planned.integration_status, "CONNECTED");
  assert.equal(planned.approval_status, "NOT_CONFIGURED");
  assert.equal(planned.schedule_status, "PENDING_APPROVAL");
  assert.equal(planned.execution_readiness, "PENDING_APPROVAL");
  assert.ok(planned.conflicts.some(({ code }) => code === "APPROVAL_NOT_CONFIGURED"));
});

test("planning DRAFT remains draft and SCHEDULED still means planning, not execution", () => {
  const [draft] = projectMoccSchedules([schedule({ status: "DRAFT" })]);
  assert.equal(draft.schedule_status, "DRAFT");
  assert.equal(draft.execution_readiness, "NOT_EXECUTABLE");
  const [scheduled] = projectMoccSchedules([schedule({ status: "SCHEDULED" })]);
  assert.equal(scheduled.schedule_status, "SCHEDULED");
  assert.equal(scheduled.execution_readiness, "READY_FOR_FUTURE_EXECUTION");
  assert.equal("executed_at" in scheduled, false);
});

test("time range, timezone, and required dependencies produce factual conflicts", () => {
  const graph = buildMoccDependencyGraph({ events: [] });
  const [badTime] = projectMoccSchedules([schedule({ planned_end: "2026-11-02T13:00:00.000Z", timezone: "Mars/Olympus" })], { dependencyGraph: graph });
  assert.ok(badTime.conflicts.some(({ code }) => code === "INVALID_TIME_RANGE"));
  assert.ok(badTime.conflicts.some(({ code }) => code === "INVALID_TIMEZONE"));
  const [unresolved] = projectMoccSchedules([schedule({ required_dependencies: ["facility:unknown"] })], { dependencyGraph: graph });
  assert.ok(unresolved.conflicts.some(({ code, reference }) => code === "DEPENDENCY_REFERENCE_UNRESOLVED" && reference === "facility:unknown"));
  assert.equal(unresolved.execution_readiness, "NOT_EXECUTABLE");
  const connectedGraph = buildMoccDependencyGraph({ events: [] });
  const [pendingDependency] = projectMoccSchedules([schedule({ required_dependencies: ["integration:TRAFFIC"] })], { dependencyGraph: connectedGraph });
  assert.ok(pendingDependency.conflicts.some(({ code, reference }) => code === "DEPENDENCY_NOT_READY" && reference === "integration:TRAFFIC"));
  const [naive] = projectMoccSchedules([schedule({ planned_start: "2026-11-02T14:00:00", planned_end: "2026-11-02T15:00:00" })]);
  assert.ok(naive.conflicts.some(({ code }) => code === "INVALID_TIME_RANGE"));
});

test("overlap detection uses only same-target source schedule intervals", () => {
  const records = projectMoccSchedules([
    schedule({ schedule_id: "one", target_reference: "city-hall", approval_required: false }),
    schedule({ schedule_id: "two", target_reference: "city-hall", planned_start: "2026-11-02T14:30:00.000Z", planned_end: "2026-11-02T15:30:00.000Z", approval_required: false }),
    schedule({ schedule_id: "separate", target_reference: "different-facility", approval_required: false }),
    schedule({ schedule_id: "unknown-a", target_reference: "unknown-target", approval_required: false }),
    schedule({ schedule_id: "unknown-b", target_reference: "unknown-target", approval_required: false }),
  ]);
  assert.ok(records[0].conflicts.some(({ code, related_schedule_id }) => code === "OVERLAPPING_TARGET_SCHEDULE" && related_schedule_id === "two"));
  assert.ok(records[1].conflicts.some(({ code, related_schedule_id }) => code === "OVERLAPPING_TARGET_SCHEDULE" && related_schedule_id === "one"));
  assert.equal(records[2].conflicts.some(({ code }) => code === "OVERLAPPING_TARGET_SCHEDULE"), false);
  assert.equal(records[3].conflicts.some(({ code }) => code === "OVERLAPPING_TARGET_SCHEDULE"), false);
  assert.equal(records[4].conflicts.some(({ code }) => code === "OVERLAPPING_TARGET_SCHEDULE"), false);
  assert.equal(records[0].execution_readiness, "NOT_EXECUTABLE");
});

test("schedule filters and deterministic start sorting do not mutate schedule records", () => {
  const schedules = projectMoccSchedules([
    schedule({ schedule_id: "later", planned_start: "2026-11-04T14:00:00.000Z", planned_end: "2026-11-04T15:00:00.000Z" }),
    schedule({ schedule_id: "earlier", planned_start: "2026-11-01T14:00:00.000Z" }),
  ]);
  const before = structuredClone(schedules);
  const filtered = filterMoccSchedules(schedules, { domain: "MISSIONS", status: "READY", readiness: "READY_FOR_FUTURE_EXECUTION" });
  assert.deepEqual(filtered.map(({ schedule_id }) => schedule_id), ["earlier", "later"]);
  assert.deepEqual(schedules, before);
});

test("date filtering uses a schedule's declared timezone", () => {
  const records = projectMoccSchedules([schedule({
    planned_start: "2026-11-02T01:00:00.000Z",
    planned_end: "2026-11-02T02:00:00.000Z",
    timezone: "America/Los_Angeles",
  })]);
  assert.equal(filterMoccSchedules(records, { date: "2026-11-01" }).length, 1);
});

test("planned schedule dates do not enter the operational event timeline", () => {
  const [planned] = projectMoccSchedules([schedule({ planned_start: "2026-11-02T14:00:00.000Z" })]);
  const normalized = projectMoccEvents([planned]);
  assert.deepEqual(projectMoccTimelineEvents(normalized, Date.parse("2026-11-02T15:00:00.000Z")), []);
});

test("schedule workspace is read-only and shows truthful empty planning state", () => {
  assert.match(componentSource, /ScheduleWorkspace/);
  assert.match(componentSource, /projectMoccSchedules\(\[\]/);
  assert.match(componentSource, /No source-backed schedule records/);
  assert.match(componentSource, /mocc__schedule-readiness/);
  assert.doesNotMatch(componentSource, /createSchedule|executeSchedule|dispatchSchedule|approveSchedule/i);
});
