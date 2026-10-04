import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildMoccDependencyGraph } from "../src/system/metaverse/operations/moccDependencyGraph.js";
import { projectMoccEvents, projectMoccTimelineEvents } from "../src/system/metaverse/operations/moccEventProjection.js";
import { createMoccScenarioDraft } from "../src/system/metaverse/operations/moccScenarioModel.js";
import { analyzeMoccScenario, createMoccWhatIfNotRun } from "../src/system/metaverse/operations/moccWhatIfModel.js";

const componentSource = readFileSync(new URL("../src/pages/metaverse/operations/MetaverseOperationsCommandCenter.jsx", import.meta.url), "utf8");

function graphWith(nodes = [], edges = []) {
  const base = buildMoccDependencyGraph({ events: [] });
  return { nodes: [...base.nodes, ...nodes], edges: [...base.edges, ...edges] };
}

function systemNode(node_id, label = node_id) {
  return { node_id, node_type: "SYSTEM", label, domain: "SIMULATIONS", source_authority: "SIMULATION_REGISTRY", source_reference: node_id };
}

function relation(from, to, relationship_type, source_reference = `${from}-${to}`) {
  return { edge_id: `${relationship_type}:${from}:${to}`, from_node: from, to_node: to, relationship_type, source_authority: "METAVERSE_DEPENDENCY_REGISTRY", source_reference };
}

function scenario(overrides = {}) {
  return {
    ...createMoccScenarioDraft("scenario-what-if-1"),
    title: "Deterministic analysis fixture",
    scenario_type: "TABLETOP_EXERCISE",
    mode: "TABLETOP",
    duration_minutes: 45,
    participating_domains: [{ domain: "SIMULATIONS", required: true }],
    initial_conditions: { SIMULATIONS: { exercise_state: "configured" } },
    ...overrides,
  };
}

test("What-If has an explicit NOT_RUN state and creates no timestamps", () => {
  const initial = createMoccWhatIfNotRun({ scenario_id: "scenario-1" });
  assert.equal(initial.analysis_status, "NOT_RUN");
  assert.equal(initial.created_at, null);
  assert.deepEqual(initial.affected_nodes, []);
  assert.deepEqual(initial.pending_integrations, []);
});

test("direct inputs and explicit AFFECTS/DEPENDS_ON relationships derive traceable impacts", () => {
  const graph = graphWith(
    [systemNode("system:dependent", "Dependent system"), systemNode("system:affected", "Affected system")],
    [
      relation("integration:SIMULATIONS", "system:affected", "AFFECTS", "rule-affects-1"),
      relation("system:dependent", "system:affected", "DEPENDS_ON", "rule-depends-1"),
    ],
  );
  const input = scenario();
  const before = structuredClone(input);
  const graphBefore = structuredClone(graph);
  const analysis = analyzeMoccScenario(input, { dependencyGraph: graph, analysisId: "local-analysis-1" });
  assert.equal(analysis.analysis_status, "COMPLETE");
  assert.deepEqual(analysis.derived_impacts.map(({ target, impact_type }) => [target.node_id, impact_type]), [
    ["integration:SIMULATIONS", "DIRECT"],
    ["system:affected", "DIRECT"],
    ["system:dependent", "DEPENDENCY_EXPOSED"],
  ]);
  const propagated = analysis.derived_impacts.find(({ target }) => target.node_id === "system:dependent");
  assert.equal(propagated.path[0].source_authority, "METAVERSE_DEPENDENCY_REGISTRY");
  assert.ok(propagated.path.some(({ source_reference }) => source_reference === "rule-depends-1"));
  assert.equal(propagated.path.find(({ source_reference }) => source_reference === "rule-depends-1").traversal_from, "system:affected");
  assert.equal(propagated.path.find(({ source_reference }) => source_reference === "rule-depends-1").traversal_to, "system:dependent");
  assert.ok(propagated.explanation.includes("no failure is asserted"));
  assert.deepEqual(input, before);
  assert.deepEqual(graph, graphBefore);
});

test("RELATED_TO, LOCATED_AT, and PART_OF remain contextual and do not propagate impacts", () => {
  const target = systemNode("system:context", "Context only");
  const graph = graphWith([target], [
    relation("integration:SIMULATIONS", target.node_id, "RELATED_TO"),
    relation("integration:SIMULATIONS", target.node_id, "LOCATED_AT"),
    relation("integration:SIMULATIONS", target.node_id, "PART_OF"),
  ]);
  const analysis = analyzeMoccScenario(scenario(), { dependencyGraph: graph });
  assert.equal(analysis.derived_impacts.some(({ target: item }) => item.node_id === target.node_id), false);
  assert.equal(analysis.analysis_status, "COMPLETE");
});

test("traversal is cycle-safe, deterministic, and bounded", () => {
  const nodes = [systemNode("system:a"), systemNode("system:b"), systemNode("system:c")];
  const graph = graphWith(nodes, [
    relation("integration:SIMULATIONS", "system:a", "AFFECTS", "edge-a"),
    relation("system:a", "system:b", "AFFECTS", "edge-b"),
    relation("system:b", "system:a", "AFFECTS", "edge-cycle"),
    relation("system:b", "system:c", "AFFECTS", "edge-c"),
  ]);
  const input = scenario({ initial_conditions: { SIMULATIONS: { cycle_check: true } } });
  const first = analyzeMoccScenario(input, { dependencyGraph: graph, maxDepth: 2 });
  const second = analyzeMoccScenario(input, { dependencyGraph: graph, maxDepth: 2 });
  assert.deepEqual(first, second);
  assert.ok(first.derived_impacts.some(({ target }) => target.node_id === "system:b"));
  assert.equal(first.derived_impacts.some(({ target }) => target.node_id === "system:c"), false);
  assert.ok(first.blocked_impacts.some(({ reason }) => reason.includes("depth limit")));
  assert.equal(first.analysis_status, "PARTIAL");
});

test("pending integrations produce visible partial output without downstream predictions", () => {
  const trafficSystem = { node_id: "system:traffic-feed", node_type: "SYSTEM", label: "Traffic feed", domain: "TRAFFIC", source_authority: "TRAFFIC_AUTHORITY", source_reference: "traffic-system" };
  const graph = graphWith([trafficSystem], [
    relation("integration:SIMULATIONS", "integration:TRAFFIC", "AFFECTS", "traffic-impact-rule"),
    relation("integration:SIMULATIONS", trafficSystem.node_id, "AFFECTS", "traffic-system-rule"),
  ]);
  const input = scenario({
    participating_domains: [{ domain: "SIMULATIONS", required: true }, { domain: "TRAFFIC", required: true }],
  });
  const analysis = analyzeMoccScenario(input, { dependencyGraph: graph });
  assert.equal(analysis.analysis_status, "PARTIAL");
  assert.ok(analysis.pending_integrations.some(({ domain, status }) => domain === "TRAFFIC" && status === "PENDING"));
  assert.ok(analysis.blocked_impacts.some(({ reference }) => reference === "integration:TRAFFIC"));
  assert.equal(analysis.derived_impacts.some(({ target }) => target.node_id === "integration:TRAFFIC"), false);
  assert.equal(analysis.derived_impacts.some(({ target }) => target.node_id === trafficSystem.node_id), false);
  assert.ok(analysis.limitations.some((item) => item.includes("Pending integrations")));
});

test("integration requirements reuse registry truth even when no participant row exists", () => {
  const analysis = analyzeMoccScenario(scenario({ integration_requirements: ["integration:TRAFFIC"] }), { dependencyGraph: graphWith() });
  assert.equal(analysis.analysis_status, "PARTIAL");
  assert.ok(analysis.pending_integrations.some(({ domain, status }) => domain === "TRAFFIC" && status === "PENDING"));
});

test("NOT_CONNECTED dependencies remain unresolved and block invalid scenarios", () => {
  const graph = graphWith();
  const input = scenario({ dependencies: ["integration:UTILITIES"] });
  const analysis = analyzeMoccScenario(input, { dependencyGraph: graph });
  assert.equal(analysis.analysis_status, "BLOCKED");
  assert.ok(analysis.blocking_dependencies.some(({ reference, status }) => reference === "integration:UTILITIES" && status === "NOT_CONNECTED"));
  assert.ok(analysis.blocked_impacts.some(({ reference }) => reference === "integration:UTILITIES"));
  assert.deepEqual(analysis.derived_impacts, []);
});

test("unresolved scenario inputs and pending approval are blocked by scenario validation", () => {
  const graph = graphWith();
  const invalid = scenario({ title: null });
  const analysis = analyzeMoccScenario(invalid, { dependencyGraph: graph });
  assert.equal(analysis.analysis_status, "BLOCKED");
  assert.ok(analysis.blocking_dependencies.some(({ reason }) => reason === "TITLE_REQUIRED"));

  const approval = scenario({ approval_required: true });
  assert.equal(analyzeMoccScenario(approval, { dependencyGraph: graph }).analysis_status, "BLOCKED");
  const approvalAndPending = scenario({ approval_required: true, participating_domains: [{ domain: "SIMULATIONS", required: true }, { domain: "TRAFFIC", required: true }] });
  assert.equal(analyzeMoccScenario(approvalAndPending, { dependencyGraph: graph }).analysis_status, "BLOCKED");

  const missingParticipant = scenario({ initial_conditions: { TRAFFIC: { state: "blocked" } } });
  const gated = analyzeMoccScenario(missingParticipant, { dependencyGraph: graph });
  assert.equal(gated.analysis_status, "BLOCKED");
  assert.ok(gated.blocking_dependencies.some(({ reason }) => reason === "INITIAL_CONDITION_DOMAIN_NOT_PARTICIPATING"));

  const unknownDomain = scenario({ participating_domains: [{ domain: "UNREGISTERED_DOMAIN", required: true }] });
  assert.equal(analyzeMoccScenario(unknownDomain, { dependencyGraph: graph }).analysis_status, "BLOCKED");
});

test("canonical location references remain spatial context and never imply causality", () => {
  const facility = { node_id: "facility:city-hall", node_type: "FACILITY", label: "City Hall", source_authority: "METAVERSE_CANONICAL_SPATIAL_REGISTRY", source_reference: "city-hall", spatial_reference: { facility_id: "city-hall", district_id: "civic-district" } };
  const graph = graphWith([facility], [relation("integration:SIMULATIONS", facility.node_id, "LOCATED_AT")]);
  const input = scenario({ spatial_references: ["facility:city-hall"] });
  const analysis = analyzeMoccScenario(input, { dependencyGraph: graph });
  assert.deepEqual(analysis.spatial_references.map(({ reference }) => reference), ["facility:city-hall"]);
  assert.equal(analysis.derived_impacts.some(({ target }) => target.node_id === facility.node_id), false);
});

test("analysis does not create probabilities, risk scores, or operational events", () => {
  const operationalSource = [{ event_id: "live-event-1", event_type: "CIVIC.EVENT", timestamp: "2026-10-03T12:00:00Z", source_authority: "SHF_CIVIC" }];
  const original = structuredClone(operationalSource);
  const graph = graphWith();
  const analysis = analyzeMoccScenario(scenario(), { dependencyGraph: graph });
  const projectedEvents = projectMoccEvents(operationalSource);
  const timeline = projectMoccTimelineEvents(projectedEvents, Date.parse("2026-10-03T12:00:00Z"));
  assert.deepEqual(operationalSource, original);
  assert.deepEqual(timeline.map(({ event_id }) => event_id), ["live-event-1"]);
  assert.equal("probability" in analysis, false);
  assert.equal("risk_score" in analysis, false);
  assert.equal("events" in analysis, false);
  assert.equal(analysis.created_at, null);
});

test("WHAT-IF UI runs only a local projection and does not add operational write paths", () => {
  assert.match(componentSource, /activeSection === "What-If" \? <WhatIfWorkspace/);
  assert.match(componentSource, /analyzeMoccScenario\(/);
  assert.match(componentSource, /ANALYZE SCENARIO/);
  assert.match(componentSource, /What-If results are not operational events/);
  assert.doesNotMatch(componentSource, /executeWhatIf|runSandbox|dispatchWhatIf|createOperationalEvent/i);
});
