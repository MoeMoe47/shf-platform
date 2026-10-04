import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { projectMoccEvents } from "../src/system/metaverse/operations/moccEventProjection.js";
import { MOCC_INTEGRATION_REGISTRY } from "../src/system/metaverse/operations/moccIntegrationStatusRegistry.js";
import { buildMoccDependencyGraph, filterMoccDependencyGraph, getMoccDependencyNodeDetails } from "../src/system/metaverse/operations/moccDependencyGraph.js";

const componentSource = readFileSync(new URL("../src/pages/metaverse/operations/MetaverseOperationsCommandCenter.jsx", import.meta.url), "utf8");

test("dependency projection preserves explicit event provenance and references", () => {
  const events = projectMoccEvents([
    { event_id: "parent", source: "CIVIC", source_ref: "civic-ref-parent", title: "Civic session" },
    { event_id: "child", source: "PROGRAM", source_ref: "mission-event-9", title: "Mission task", parent_event: "parent", mission_id: "mission-9", scenario_id: "scenario-3", location: { facility_id: "city-hall" } },
  ]);
  const graph = buildMoccDependencyGraph({ events });
  const child = graph.nodes.find((node) => node.node_id === "event:child");
  assert.equal(child.source_authority, "MET-7_PROGRAM_MISSION");
  assert.equal(child.source_reference, "mission-event-9");
  assert.ok(graph.nodes.some((node) => node.node_id === "mission:mission-9" && node.source_reference === "mission-9"));
  assert.ok(graph.nodes.some((node) => node.node_id === "simulation:scenario-3"));
  assert.ok(graph.edges.some((edge) => edge.relationship_type === "PART_OF" && edge.from_node === "event:child" && edge.to_node === "event:parent"));
  assert.ok(graph.edges.some((edge) => edge.relationship_type === "RELATED_TO" && edge.to_node === "mission:mission-9"));
  assert.ok(graph.edges.some((edge) => edge.relationship_type === "LOCATED_AT" && edge.to_node === "facility:city-hall"));
  assert.ok(graph.edges.some((edge) => edge.relationship_type === "PART_OF" && edge.from_node === "facility:city-hall" && edge.to_node === "district:civic-district"));
});

test("explicit dependency and child references connect only resolvable source events", () => {
  const events = projectMoccEvents([
    { event_id: "a", source: "SYSTEM", source_ref: "sys-a", dependencies: ["b", "unknown"], child_events: ["b"] },
    { event_id: "b", source: "SYSTEM", source_ref: "sys-b", parent_event: "a" },
  ]);
  const graph = buildMoccDependencyGraph({ events });
  assert.ok(graph.edges.some((edge) => edge.relationship_type === "DEPENDS_ON" && edge.from_node === "event:a" && edge.to_node === "event:b"));
  assert.ok(graph.edges.some((edge) => edge.relationship_type === "PART_OF" && edge.from_node === "event:b" && edge.to_node === "event:a"));
  assert.equal(graph.edges.some((edge) => edge.to_node.includes("unknown")), false);
});

test("pending integration records retain registry provenance without creating fake operational events", () => {
  const traffic = MOCC_INTEGRATION_REGISTRY.find((entry) => entry.domain === "TRAFFIC");
  const graph = buildMoccDependencyGraph({ events: [], integrations: [traffic] });
  assert.deepEqual(graph.nodes, [{
    node_id: "integration:TRAFFIC", node_type: "INTEGRATION", label: "TRAFFIC", domain: "TRAFFIC",
    source_authority: "MOCC_INTEGRATION_STATUS_REGISTRY", source_reference: "TRAFFIC", status: "PENDING",
    metadata: {
      owning_system: traffic.owning_system,
      expected_interface: traffic.expected_interface,
      mocc_ready_for: traffic.mocc_ready_for,
      missing_dependency: traffic.missing_dependency,
      impact: traffic.impact,
      completion_step: traffic.completion_step,
    },
  }]);
  assert.deepEqual(graph.edges, []);
  assert.equal(graph.nodes.some((node) => node.node_type === "EVENT"), false);
});

test("unsupported relationships are not inferred and missing provenance stays absent", () => {
  const events = projectMoccEvents([
    { event_id: "plain-1", title: "Power outage", event_type: "POWER.OUTAGE" },
    { event_id: "plain-2", title: "Nearby substation", event_type: "INFRASTRUCTURE.FACILITY" },
  ]);
  const graph = buildMoccDependencyGraph({ events });
  assert.equal(graph.edges.length, 0);
  assert.equal(graph.nodes.find((node) => node.node_id === "event:plain-1").source_authority, null);
});

test("graph filters are immutable and selected details retain edge provenance", () => {
  const graph = buildMoccDependencyGraph({ events: projectMoccEvents([
    { event_id: "one", source: "CIVIC", source_ref: "civic-one", affected_entities: ["two"] },
    { event_id: "two", source: "SYSTEM", source_ref: "sys-two" },
  ]) });
  const before = structuredClone(graph);
  const filtered = filterMoccDependencyGraph(graph, { EVENT: true, INTEGRATION: false });
  const detail = getMoccDependencyNodeDetails(graph, "event:one");
  assert.deepEqual(graph, before);
  assert.equal(filtered.nodes.length, 2);
  assert.equal(detail.downstream[0].source_authority, "SHF_CIVIC");
  assert.equal(detail.downstream[0].source_reference, "civic-one");
});

test("Dependencies is an alternate read-only workspace; Overview remains the default", () => {
  assert.match(componentSource, /useState\("Overview"\)/);
  assert.ok(componentSource.includes('["Overview", "Operations", "Incidents", "Scenarios", "What-If", "Schedule", "Dependencies"].includes(item)'));
  assert.match(componentSource, /DependenciesWorkspace graph=\{dependencyGraph\}/);
  assert.match(componentSource, /READ ONLY/);
  assert.doesNotMatch(componentSource, /fetch\([^)]*(?:POST|PUT|PATCH|DELETE)/i);
});
