import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildMoccDependencyGraph } from "../src/system/metaverse/operations/moccDependencyGraph.js";
import { MOCC_INTEGRATION_REGISTRY } from "../src/system/metaverse/operations/moccIntegrationStatusRegistry.js";
import {
  createMoccScenarioDraft,
  filterMoccScenarios,
  MOCC_SCENARIO_MODES,
  MOCC_SCENARIO_READINESS,
  MOCC_SCENARIO_STATUSES,
  projectMoccScenario,
} from "../src/system/metaverse/operations/moccScenarioModel.js";
import { projectMoccEvents } from "../src/system/metaverse/operations/moccEventProjection.js";

const componentSource = readFileSync(new URL("../src/pages/metaverse/operations/MetaverseOperationsCommandCenter.jsx", import.meta.url), "utf8");

const validScenario = (overrides = {}) => ({
  ...createMoccScenarioDraft("scenario-local-1"),
  title: "Grid resilience exercise",
  scenario_type: "TRAINING_EXERCISE",
  mode: "TRAINING",
  duration_minutes: 90,
  participating_domains: [{ domain: "SIMULATIONS", required: true }],
  ...overrides,
});

test("scenario contract has planning-only statuses, modes, and readiness", () => {
  assert.deepEqual(MOCC_SCENARIO_MODES, ["SIMULATION", "TRAINING", "TABLETOP"]);
  assert.ok(MOCC_SCENARIO_STATUSES.includes("DRAFT"));
  assert.equal(MOCC_SCENARIO_STATUSES.includes("RUNNING"), false);
  assert.ok(MOCC_SCENARIO_READINESS.includes("READY_FOR_SIMULATION"));
  assert.equal(MOCC_SCENARIO_READINESS.includes("RUNNING"), false);
  assert.equal(createMoccScenarioDraft("draft-1").created_at, null);
  assert.equal(createMoccScenarioDraft("draft-1").created_by, null);
});

test("valid scenario definitions become ready for simulation without becoming executed", () => {
  const projected = projectMoccScenario(validScenario());
  assert.equal(projected.status, "READY");
  assert.equal(projected.simulation_readiness, "READY_FOR_SIMULATION");
  assert.equal(projected.execution_state, "NOT_EXECUTED");
});

test("required pending integrations block simulation readiness; optional pending does not", () => {
  const required = projectMoccScenario(validScenario({ participating_domains: [{ domain: "TRAFFIC", required: true }] }));
  assert.equal(required.status, "PENDING_INTEGRATION");
  assert.equal(required.simulation_readiness, "PENDING_INTEGRATION");

  const optional = projectMoccScenario(validScenario({ participating_domains: [{ domain: "TRAFFIC", required: false }] }));
  assert.equal(optional.status, "READY");
  assert.equal(optional.participating_domains[0].integration_status, "PENDING");
});

test("required disconnected domains block readiness and integration truth comes from registry", () => {
  const projected = projectMoccScenario(validScenario({ participating_domains: [{ domain: "UTILITIES", required: true }] }));
  assert.equal(projected.status, "BLOCKED");
  assert.equal(projected.participating_domains[0].integration_status, "NOT_CONNECTED");
  assert.equal(MOCC_INTEGRATION_REGISTRY.find(({ domain }) => domain === "UTILITIES").status, "NOT_CONNECTED");
});

test("optional approval cannot be fabricated and unsupported production mode is rejected", () => {
  const pendingApproval = projectMoccScenario(validScenario({ approval_required: true, approval_status: "APPROVED", approved_by: "fake-user" }));
  assert.equal(pendingApproval.status, "PENDING_APPROVAL");
  assert.equal(pendingApproval.approval_status, "NOT_CONFIGURED");
  assert.equal(pendingApproval.approved_by, null);

  const productionMode = projectMoccScenario(validScenario({ mode: "PRODUCTION" }));
  assert.equal(productionMode.simulation_readiness, "NOT_READY");
  assert.ok(productionMode.validation_issues.some(({ code }) => code === "UNSUPPORTED_OR_MISSING_MODE"));
});

test("canonical spatial references resolve without copying coordinates; unknown references stay unresolved", () => {
  const resolved = projectMoccScenario(validScenario({ spatial_references: ["facility:city-hall", "quick-map:hospital"] }));
  assert.deepEqual(resolved.spatial_references.map(({ reference }) => reference), ["facility:city-hall", "quick-map:hospital"]);
  assert.equal(resolved.spatial_references.some((reference) => "x" in reference || "y" in reference), false);
  assert.equal(resolved.spatial_references.find(({ reference }) => reference === "quick-map:hospital").status, "PROVISIONAL");

  const unresolved = projectMoccScenario(validScenario({ spatial_references: ["facility:unknown"] }));
  assert.ok(unresolved.validation_issues.some(({ code }) => code === "SPATIAL_REFERENCE_UNRESOLVED"));
  assert.equal(unresolved.simulation_readiness, "NOT_READY");
});

test("dependency graph and schedule links remain references and unresolved refs stay explicit", () => {
  const graph = buildMoccDependencyGraph({ events: [] });
  const record = validScenario({ dependencies: ["integration:SIMULATIONS", "integration:unknown"], schedule_references: ["schedule-missing"] });
  const projected = projectMoccScenario(record, { dependencyGraph: graph, schedules: [] });
  assert.ok(projected.validation_issues.some(({ code, reference }) => code === "DEPENDENCY_UNRESOLVED" && reference === "integration:unknown"));
  assert.ok(projected.validation_issues.some(({ code }) => code === "SCHEDULE_REFERENCE_UNRESOLVED"));
  assert.deepEqual(projected.dependencies, record.dependencies);
});

test("required integration graph dependencies affect readiness even without a participant row", () => {
  const graph = buildMoccDependencyGraph({ events: [] });
  const pending = projectMoccScenario(validScenario({ dependencies: ["integration:TRAFFIC"] }), { dependencyGraph: graph });
  assert.equal(pending.simulation_readiness, "PENDING_INTEGRATION");
  const disconnected = projectMoccScenario(validScenario({ dependencies: ["integration:UTILITIES"] }), { dependencyGraph: graph });
  assert.equal(disconnected.status, "BLOCKED");
});

test("mission references resolve only against existing MOCC-7 mission nodes", () => {
  const graph = buildMoccDependencyGraph({ events: projectMoccEvents([{ event_id: "event-1", source: "CIVIC", mission_id: "mission-9" }]) });
  const valid = projectMoccScenario(validScenario({ mission_references: ["mission-9"] }), { dependencyGraph: graph });
  assert.equal(valid.validation_issues.some(({ code }) => code === "MISSION_REFERENCE_UNRESOLVED"), false);
  const unresolved = projectMoccScenario(validScenario({ mission_references: ["mission-unknown"] }), { dependencyGraph: graph });
  assert.ok(unresolved.validation_issues.some(({ code, reference }) => code === "MISSION_REFERENCE_UNRESOLVED" && reference === "mission-unknown"));
});

test("scenario-only planned events validate timing and stay out of operational event projection", () => {
  const sourceEvents = [{ event_id: "operational-1", event_type: "CIVIC.EVENT", timestamp: "2026-09-01T12:00:00Z", source_authority: "CIVIC" }];
  const scenario = validScenario({
    planned_events: [{ scenario_event_id: "planned-1", event_type: "TRAINING.DRILL", domain: "SIMULATIONS", relative_time_minutes: 95 }],
  });
  const projected = projectMoccScenario(scenario);
  assert.ok(projected.validation_issues.some(({ code }) => code === "SCENARIO_EVENT_TIME_INVALID"));
  assert.deepEqual(projectMoccEvents(sourceEvents).map(({ event_id }) => event_id), ["operational-1"]);
  assert.equal(sourceEvents.length, 1);
});

test("duration is required and scenario filtering does not mutate input", () => {
  const incomplete = projectMoccScenario(validScenario({ duration_minutes: 0 }));
  assert.ok(incomplete.validation_issues.some(({ code }) => code === "INVALID_DURATION"));
  const records = [projectMoccScenario(validScenario()), projectMoccScenario(validScenario({ scenario_id: "scenario-2", participating_domains: [{ domain: "TRAFFIC", required: false }] }))];
  const before = structuredClone(records);
  const filtered = filterMoccScenarios(records, { domain: "TRAFFIC" });
  assert.equal(filtered.length, 1);
  assert.deepEqual(records, before);
});

test("scenario projection does not mutate source definition", () => {
  const source = validScenario({ initial_conditions: { SIMULATIONS: { scenario_only: { wind: "high" } } } });
  const before = structuredClone(source);
  projectMoccScenario(source);
  assert.deepEqual(source, before);
});

test("SCENARIOS opens a local-only composer and stays isolated from operational views", () => {
  assert.match(componentSource, /\["Overview", "Operations", "Incidents", "Scenarios", "What-If", "Schedule", "Dependencies"\]\.includes\(item\)/);
  assert.match(componentSource, /activeSection === "Scenarios" \? <ScenarioWorkspace/);
  assert.match(componentSource, /LOCAL PLANNING ONLY · NOT PERSISTED · NOT EXECUTABLE/);
  assert.match(componentSource, /No source-backed or persisted scenarios are available/);
  assert.match(componentSource, /scenarioEvents|planned_events/);
  assert.doesNotMatch(componentSource, /executeScenario|runScenario|createProductionScenario|dispatchScenario/i);
});
