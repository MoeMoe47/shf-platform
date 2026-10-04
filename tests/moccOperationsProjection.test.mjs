import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { projectMoccEvents, projectMoccTimelineEvents } from "../src/system/metaverse/operations/moccEventProjection.js";
import { getMoccIntegrationStatus } from "../src/system/metaverse/operations/moccIntegrationStatusRegistry.js";
import { buildMoccDependencyGraph, getMoccDependencyNodeDetails } from "../src/system/metaverse/operations/moccDependencyGraph.js";
import { filterMoccOperations, isMoccIncidentEvent, projectMoccIncidents, projectMoccOperations } from "../src/system/metaverse/operations/moccOperationsProjection.js";

const componentSource = readFileSync(new URL("../src/pages/metaverse/operations/MetaverseOperationsCommandCenter.jsx", import.meta.url), "utf8");

test("operations read model wraps normalized events while retaining their identity and provenance", () => {
  const events = projectMoccEvents([
    { event_id: "civic-1", source: "CIVIC", source_ref: "civic-source-1", title: "Council session", starts_at: "2026-10-03T10:00:00.000Z", district_id: "civic-district", state: "ACTIVE", severity: "LOW", mission_id: "mission-2", audit_refs: ["audit-2"] },
  ]);
  const operations = projectMoccOperations(events);
  const record = operations[0];
  assert.equal(record.source_event, events[0]);
  assert.equal(record.operation_id, "civic-1");
  assert.equal(record.source_authority, "SHF_CIVIC");
  assert.equal(record.source_reference, "civic-source-1");
  assert.equal(record.location.district_id, "civic-district");
  assert.equal(record.mission_id, "mission-2");
  assert.deepEqual(record.audit_refs, ["audit-2"]);
  assert.equal(projectMoccTimelineEvents(events, Date.parse("2026-10-03T11:00:00.000Z"))[0].event_id, record.event_id);
});

test("incident eligibility uses event type semantics, never title or severity", () => {
  assert.equal(isMoccIncidentEvent({ event_type: "FIRE.STRUCTURE_FIRE" }), true);
  assert.equal(isMoccIncidentEvent({ event_type: "EMS.MEDICAL_CALL" }), true);
  assert.equal(isMoccIncidentEvent({ event_type: "TRAFFIC.INCIDENT" }), true);
  assert.equal(isMoccIncidentEvent({ event_type: "WEATHER.EMERGENCY.SEVERE_STORM" }), true);
  assert.equal(isMoccIncidentEvent({ event_type: "CIVIC.ACTIVITY", title: "Fire emergency", severity: "CRITICAL" }), false);
  assert.equal(isMoccIncidentEvent({ event_type: "SYSTEM.ACTIVITY", title: "Security incident", severity: "HIGH" }), false);
});

test("incident projection preserves provenance and leaves unavailable fields empty", () => {
  const events = projectMoccEvents([
    { event_id: "fire-4", event_type: "FIRE.STRUCTURE_FIRE", source_authority: "CITY_FIRE_AUTHORITY", source_event_ref: "fire-ref-4", severity: "HIGH", location: { facility_id: "city-hall" } },
  ]);
  const incidents = projectMoccIncidents(events);
  assert.equal(incidents.length, 1);
  assert.equal(incidents[0].source_authority, "CITY_FIRE_AUTHORITY");
  assert.equal(incidents[0].source_reference, "fire-ref-4");
  assert.equal(incidents[0].timestamp, null);
  assert.equal(incidents[0].state, null);
  assert.equal(incidents[0].integration_status, "PENDING");
  assert.equal(incidents[0].source_event, events[0]);
});

test("pending Fire/EMS integration is shown without creating incident records", () => {
  assert.equal(getMoccIntegrationStatus("FIRE_EMS_INCIDENTS").status, "PENDING");
  assert.deepEqual(projectMoccIncidents([]), []);
});

test("local filtering and timestamp ordering do not mutate normalized source records", () => {
  const events = projectMoccEvents([
    { event_id: "older", event_type: "CIVIC.ACTIVITY", source: "CIVIC", starts_at: "2026-10-03T09:00:00.000Z", status: "ACTIVE", severity: "LOW" },
    { event_id: "untimed", event_type: "SYSTEM.ACTIVITY", source: "SYSTEM", status: "OPEN", severity: "HIGH" },
    { event_id: "newer", event_type: "MISSION.ACTIVITY", source: "MISSION", starts_at: "2026-10-03T11:00:00.000Z", status: "ACTIVE", severity: "HIGH" },
  ]);
  const before = structuredClone(events);
  const filtered = filterMoccOperations(projectMoccOperations(events), { activeOnly: true, severity: "HIGH" });
  assert.deepEqual(filtered.map((record) => record.event_id), ["newer", "untimed"]);
  assert.deepEqual(events, before);
});

test("operations expose existing dependency graph relationships without rebuilding them", () => {
  const events = projectMoccEvents([
    { event_id: "evt-1", event_type: "FIRE.STRUCTURE_FIRE", source_authority: "FIRE_AUTH", source_event_ref: "fire-evt-1", dependencies: ["evt-2"] },
    { event_id: "evt-2", event_type: "SYSTEM.ACTIVITY", source_authority: "SYS_AUTH", source_event_ref: "sys-evt-2" },
  ]);
  const incidents = projectMoccIncidents(events);
  const graph = buildMoccDependencyGraph({ events });
  const details = getMoccDependencyNodeDetails(graph, `event:${incidents[0].event_id}`);
  assert.equal(incidents[0].dependencies[0], "evt-2");
  assert.ok(details.downstream.some((edge) => edge.relationship_type === "DEPENDS_ON" && edge.to_node === "event:evt-2"));
});

test("operations and incidents nav views remain read-only and Overview remains available", () => {
  assert.match(componentSource, /OperationsWorkspace/);
  assert.match(componentSource, /OperationsWorkspace records=\{incidentRecords\} graph=\{dependencyGraph\} incidentsOnly/);
  assert.match(componentSource, /projectMoccOperations\(projectedEvents\)/);
  assert.match(componentSource, /projectMoccIncidents\(projectedEvents\)/);
  assert.ok(componentSource.includes('["Overview", "Operations", "Incidents", "Scenarios", "What-If", "Schedule", "Dependencies"].includes(item)'));
  assert.doesNotMatch(componentSource, /dispatchIncident|acknowledgeIncident|resolveIncident|createIncident/i);
});
