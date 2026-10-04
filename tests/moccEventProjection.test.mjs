import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  MOCC_INTEGRATION_REGISTRY,
  MOCC_INTEGRATION_STATUSES,
  MOCC_PENDING_INTEGRATIONS,
  getMoccIntegrationStatus,
} from "../src/system/metaverse/operations/moccIntegrationStatusRegistry.js";
import {
  filterMoccTimelineEvents,
  MOCC_TIMELINE_CATEGORIES,
  moccTimelineCategory,
  normalizeMoccEvent,
  projectMoccEvents,
  projectMoccTimelineEvents,
} from "../src/system/metaverse/operations/moccEventProjection.js";

const componentSource = readFileSync(new URL("../src/pages/metaverse/operations/MetaverseOperationsCommandCenter.jsx", import.meta.url), "utf8");

test("MOCC-3 contract exposes normalized fields and retains source provenance", () => {
  const event = normalizeMoccEvent({
    event_id: "program:mission-1",
    source: "PROGRAM",
    source_ref: "mission-1",
    title: "Program mission",
    starts_at: "2026-10-03T14:00:00.000Z",
    district_id: "civic-district",
    status: "ACTIVE",
  });

  assert.deepEqual(Object.keys(event), [
    "event_id", "event_type", "title", "timestamp", "source_authority", "source_event_ref",
    "location", "affected_entities", "severity", "state", "dependencies", "parent_event",
    "child_events", "scenario_id", "mission_id", "initiated_by", "approved_by", "evidence_refs", "audit_refs",
  ]);
  assert.equal(event.source_authority, "MET-7_PROGRAM_MISSION");
  assert.equal(event.source_event_ref, "mission-1");
  assert.equal(event.event_type, "MISSION.PROGRAM_ACTIVITY");
  assert.equal(event.timestamp, "2026-10-03T14:00:00.000Z");
});

test("MOCC-3 leaves unavailable source fields empty instead of inventing event facts", () => {
  const event = normalizeMoccEvent({ source: "UNREGISTERED_SOURCE" });

  assert.equal(event.event_id, null);
  assert.equal(event.event_type, null);
  assert.equal(event.timestamp, null);
  assert.equal(event.source_authority, "UNREGISTERED_SOURCE");
  assert.equal(event.source_event_ref, null);
  assert.equal(event.location, null);
  assert.deepEqual(event.affected_entities, []);
  assert.equal(event.severity, null);
  assert.equal(event.state, null);
  assert.deepEqual(event.dependencies, []);
  assert.equal(event.scenario_id, null);
  assert.equal(event.mission_id, null);
  assert.equal(event.initiated_by, null);
  assert.equal(event.approved_by, null);
  assert.deepEqual(event.evidence_refs, []);
  assert.deepEqual(event.audit_refs, []);
});

test("MOCC-3 combines distinct domain authorities into one read projection", () => {
  const projection = projectMoccEvents([
    { event_id: "program:1", source: "PROGRAM", source_ref: "mission-1", title: "Mission" },
    { event_id: "event:2", source: "OPPORTUNITY", source_ref: "opportunity-2", title: "City event" },
    { event_id: "civic:3", source: "CIVIC", source_ref: "shf_civic_hall", title: "Civic session" },
  ]);

  assert.equal(projection.length, 3);
  assert.deepEqual(projection.map((event) => event.source_authority), [
    "MET-7_PROGRAM_MISSION",
    "MET-8_OPPORTUNITY_EXCHANGE",
    "SHF_CIVIC",
  ]);
  assert.deepEqual(projection.map((event) => event.source_event_ref), ["mission-1", "opportunity-2", "shf_civic_hall"]);
});

test("MOCC-3 normalization does not mutate source events", () => {
  const source = Object.freeze({
    event_id: "event:1",
    source: "OPPORTUNITY",
    source_ref: "opportunity-1",
    district_id: "downtown",
    affected_entities: Object.freeze(["facility-1"]),
  });
  const before = structuredClone(source);

  const projected = projectMoccEvents([source]);

  assert.deepEqual(source, before);
  assert.notEqual(projected[0], source);
  assert.notEqual(projected[0].affected_entities, source.affected_entities);
});

test("MOCC-6 timeline positions only timestamped events in the preceding 24-hour window", () => {
  const windowEnd = Date.parse("2026-10-03T12:00:00.000Z");
  const projected = projectMoccEvents([
    { event_id: "start", source: "MISSION", starts_at: "2026-10-02T12:00:00.000Z" },
    { event_id: "now", source: "MISSION", starts_at: "2026-10-03T12:00:00.000Z" },
    { event_id: "before", source: "CIVIC", starts_at: "2026-10-02T11:59:59.999Z" },
    { event_id: "future", source: "OPPORTUNITY", starts_at: "2026-10-03T12:00:00.001Z" },
    { event_id: "undated", source: "PROGRAM", starts_at: null },
  ]);
  const timeline = projectMoccTimelineEvents(projected, windowEnd);

  assert.deepEqual(timeline.map((event) => event.event_id), ["start", "now"]);
  assert.deepEqual(timeline.map((event) => event.timelinePosition), [0, 100]);
  assert.ok(timeline.every((event) => event.timestamp && Number.isFinite(Date.parse(event.timestamp))));
  assert.equal(moccTimelineCategory(timeline[0]), "mission");
});

test("MOCC-6 uses deterministic category rules instead of severity/text inference", () => {
  assert.deepEqual(MOCC_TIMELINE_CATEGORIES.map(({ id }) => id), ["event", "mission", "incident", "system", "simulation", "uncategorized"]);
  assert.equal(moccTimelineCategory({ event_type: "CIVIC.ACTIVITY", severity: "CRITICAL" }), "event");
  assert.equal(moccTimelineCategory({ event_type: "INCIDENT.STRUCTURE_FIRE" }), "incident");
  assert.equal(moccTimelineCategory({ event_type: "MISSION.PROGRAM_ACTIVITY" }), "mission");
  assert.equal(moccTimelineCategory({ event_type: "SIMULATION.SESSION_STARTED" }), "simulation");
  assert.equal(moccTimelineCategory({ event_type: "SYSTEM.ACTIVITY" }), "system");
  assert.equal(moccTimelineCategory({ event_type: "UNKNOWN.TEXT_MATCH_ONLY" }), "uncategorized");
  assert.equal(moccTimelineCategory({ title: "Mission Incident", severity: "CRITICAL" }), "uncategorized");
});

test("MOCC-6 category filtering is local and does not mutate normalized events", () => {
  const events = projectMoccEvents([
    { event_id: "mission", source: "MISSION", starts_at: "2026-10-03T11:00:00.000Z" },
    { event_id: "civic", source: "CIVIC", starts_at: "2026-10-03T11:30:00.000Z" },
  ]);
  const before = structuredClone(events);
  const visible = projectMoccTimelineEvents(events, Date.parse("2026-10-03T12:00:00.000Z"));
  const filtered = filterMoccTimelineEvents(visible, { mission: true, event: false });

  assert.deepEqual(filtered.map(({ event_id }) => event_id), ["mission"]);
  assert.deepEqual(events, before);
});

test("MOCC-6 pending domains contribute no placeholder timeline activity", () => {
  for (const domain of ["TRAFFIC", "WEATHER_OBSERVATIONS", "FIRE_EMS_INCIDENTS", "AGENT_ACTIONS", "STUDENT_MISSION_ENTRY_EVENTS", "UTILITIES", "SHNN"]) {
    assert.ok(["PENDING", "NOT_CONNECTED"].includes(getMoccIntegrationStatus(domain).status));
  }
  assert.deepEqual(projectMoccTimelineEvents(projectMoccEvents([]), Date.parse("2026-10-03T12:00:00.000Z")), []);
  assert.match(componentSource, /projectMoccTimelineEvents\(projectedEvents, timelineWindowEnd\)/);
});

test("MOCC-6 overlapping timestamps receive deterministic visual lanes without changing time positions", () => {
  const at = "2026-10-03T12:00:00.000Z";
  const events = projectMoccTimelineEvents(projectMoccEvents([
    { event_id: "b", source: "MISSION", starts_at: at },
    { event_id: "a", source: "CIVIC", starts_at: at },
  ]), Date.parse(at));

  assert.deepEqual(events.map(({ event_id }) => event_id), ["a", "b"]);
  assert.deepEqual(events.map(({ timelinePosition }) => timelinePosition), [100, 100]);
  assert.deepEqual(events.map(({ timelineLane }) => timelineLane), [0, 1]);
  assert.ok(events.every(({ timelineLaneCount }) => timelineLaneCount === 2));
});

test("MOCC-3 Live Operations and MOCC-6 Timeline consume the common projection with truthful empty state", () => {
  assert.match(componentSource, /const projectedEvents = projectMoccEvents\(sourceCityEvents\);/);
  assert.match(componentSource, /projectedEvents\.slice\(0, 5\)\.map/);
  assert.match(componentSource, /source_authority/);
  assert.match(componentSource, /projectMoccTimelineEvents\(projectedEvents, timelineWindowEnd\)/);
  assert.match(componentSource, /timelineEvents\.map\(\(event\) =>/);
  assert.match(componentSource, /No source events are currently available\./);
  assert.match(componentSource, /events=\{sourceCityEvents\}/);
});

test("MOCC-6 provides truthful Now/window navigation, category filters, and provenance-preserving event details", () => {
  assert.match(componentSource, /onClick=\{goToNow\}/);
  assert.match(componentSource, /moveTimelineWindow\(-1\)/);
  assert.match(componentSource, /moveTimelineWindow\(1\)/);
  assert.match(componentSource, /type="date"[\s\S]*?onChange=\{\(event\) => chooseTimelineDate/);
  assert.match(componentSource, /aria-pressed=\{timelineFilters\[id\]\}/);
  assert.match(componentSource, /setSelectedTimelineKey\(event\.timeline_key\)/);
  assert.match(componentSource, /selectedTimelineEvent\.source_authority/);
  assert.match(componentSource, /selectedTimelineEvent\.source_event_ref/);
  assert.match(componentSource, /timelineLive \? "LIVE"/);
  assert.match(componentSource, /if \(activeSection !== "Replay" \|\| !replay\.isPlaying\) return undefined;/);
  assert.match(componentSource, /timelineWindowEvents = projectMoccTimelineEvents\(projectedEvents, timelineWindowEnd\)/);
});

test("MOCC-3 projection introduces no operational command or write path", () => {
  assert.doesNotMatch(componentSource, /fastTravel|executeCommand|dispatchCommand|mutate|method:\s*["'](?:POST|PUT|PATCH|DELETE)/i);
  assert.doesNotMatch(readFileSync(new URL("../src/system/metaverse/operations/moccEventProjection.js", import.meta.url), "utf8"), /fetch\(|localStorage|\.post\(|\.put\(|\.delete\(/i);
});

test("MOCC-4B supports canonical readiness states and treats PENDING as deferred, not failure", () => {
  assert.deepEqual(MOCC_INTEGRATION_STATUSES, ["CONNECTED", "PARTIAL", "FOUNDATION", "PENDING", "NOT_CONNECTED", "UNAVAILABLE"]);
  const traffic = getMoccIntegrationStatus("TRAFFIC");
  const incidents = getMoccIntegrationStatus("FIRE_EMS_INCIDENTS");

  for (const integration of [traffic, incidents]) {
    assert.equal(integration.status, "PENDING");
    assert.notEqual(integration.status, "CONNECTED");
    assert.ok(!["NOT_CONNECTED", "UNAVAILABLE"].includes(integration.status));
  }
  assert.equal(MOCC_PENDING_INTEGRATIONS.length, MOCC_INTEGRATION_REGISTRY.filter((entry) => entry.status === "PENDING").length);
});

test("MOCC-4B pending records preserve owner, interface, dependency, impact, and completion metadata", () => {
  for (const domain of ["TRAFFIC", "WEATHER_OBSERVATIONS", "FIRE_EMS_INCIDENTS", "AGENT_ACTIONS", "STUDENT_MISSION_ENTRY_EVENTS", "SIMULATION_RUNTIME_TELEMETRY"]) {
    const integration = getMoccIntegrationStatus(domain);
    for (const field of ["owning_system", "expected_interface", "mocc_ready_for", "missing_dependency", "impact", "completion_step"]) {
      assert.equal(typeof integration[field], "string", `${domain}.${field}`);
      assert.ok(integration[field].length > 0, `${domain}.${field}`);
    }
  }
});

test("MOCC-4B preserves established connected systems and does not fabricate pending source events", () => {
  for (const domain of ["LIVING_CITY", "MISSIONS", "SIMULATIONS", "CIVIC"]) {
    assert.equal(getMoccIntegrationStatus(domain).status, "CONNECTED");
  }
  assert.equal(getMoccIntegrationStatus("UTILITIES").status, "NOT_CONNECTED");
  assert.equal(getMoccIntegrationStatus("SHNN").status, "NOT_CONNECTED");
  assert.equal(getMoccIntegrationStatus("MARINE_AVIATION").status, "PARTIAL");
  assert.ok(MOCC_PENDING_INTEGRATIONS.every((entry) => !Object.hasOwn(entry, "events")));
  assert.deepEqual(projectMoccEvents([]), []);
  assert.match(componentSource, /const projectedEvents = projectMoccEvents\(sourceCityEvents\);/);
});

test("MOCC-4B System Layers render canonical PENDING status with restrained amber treatment", () => {
  assert.match(componentSource, /statusLabel\(system\.status\)/);
  assert.match(componentSource, /replaceAll\("_", "-"\)/);
  assert.match(componentSource, /getMoccIntegrationStatus\("TRAFFIC"\)\.status/);
  assert.match(componentSource, /getMoccIntegrationStatus\("FIRE_EMS_INCIDENTS"\)\.status/);
  const css = readFileSync(new URL("../src/pages/metaverse/operations/metaverse-operations-command-center.css", import.meta.url), "utf8");
  assert.match(css, /\.mocc__status--pending\s*\{?[^}]*color:\s*var\(--mocc-amber\)/s);
  assert.match(componentSource, /Traffic State", "—", "Traffic foundation available"/);
  assert.match(componentSource, /Fire \/ EMS Incidents", "—", "Pending integration"/);
  assert.match(componentSource, /title="Weather integration pending"/);
});

test("MOCC-4A introduces no dispatch or traffic write controls", () => {
  assert.doesNotMatch(componentSource, /dispatchCommand|dispatchUnit|acknowledgeIncident|closeIncident|setIncidentPriority|createIncident/i);
  assert.doesNotMatch(componentSource, /method:\s*["'](?:POST|PUT|PATCH|DELETE)/i);
});
