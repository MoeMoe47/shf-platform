// Phase 4F.5 — /metaverse/dev/orchestration command-center view model (pure).
//
// Diagnostic, developer/operator surface only. It renders MOL's in-memory
// session; it has no production-admin powers and cannot reach any domain
// authority. Every status carries a text label and symbol (never color only).

import { createMolEventBus } from "./molEventBus.js";
import { MOL_AUTHORITY_MATRIX, listMolSystems } from "./molSystemRegistry.js";
import { projectMolWorldState } from "./molWorldState.js";
import { buildMolRegionalTwinGraph } from "./molRegionalGraph.js";
import { attachMolCoordinator, getMolObservability } from "./molCoordination.js";
import { listMolScenarios } from "./molScenarios.js";

export const MOL_COMMAND_CENTER_ROUTE = "/metaverse/dev/orchestration";
export const MOL_COMMAND_CENTER_SECTIONS = Object.freeze([
  { id: "world-status", title: "World status" },
  { id: "system-registry", title: "System registry" },
  { id: "event-stream", title: "Live event stream" },
  { id: "dependency-graph", title: "Dependency graph" },
  { id: "world-state", title: "World state" },
  { id: "scenario-replay", title: "Scenario and replay" },
  { id: "diagnostics", title: "Diagnostics" },
]);
export const MOL_EVENT_STREAM_LIMIT = 50;

const STATUS_LABELS = Object.freeze({
  HEALTHY: { symbol: "✓", label: "Healthy" },
  DEGRADED: { symbol: "!", label: "Degraded" },
  UNAVAILABLE: { symbol: "✕", label: "Unavailable" },
  CURRENT: { symbol: "✓", label: "Current" },
  STALE: { symbol: "!", label: "Stale" },
  SOURCE_UNAVAILABLE: { symbol: "✕", label: "Source unavailable" },
  ACCEPTED: { symbol: "✓", label: "Accepted" },
  REJECTED: { symbol: "✕", label: "Rejected" },
  FAILED_PROCESSING: { symbol: "!", label: "Failed processing" },
});

export function molStatusLabel(status) {
  const known = STATUS_LABELS[status];
  return known ? `${known.symbol} ${known.label}` : String(status);
}

export function createMolSession({ trafficRoutes = [], now = () => Date.now() } = {}) {
  const bus = createMolEventBus({ now });
  const graph = buildMolRegionalTwinGraph({ trafficRoutes });
  const coordinator = attachMolCoordinator(bus, { graph });
  return { bus, graph, coordinator, trafficRoutes, now };
}

export function buildMolCommandCenterViewModel(session, { scenarioRun = null, replay = null } = {}) {
  const nowMs = session.now();
  const events = session.bus.getEvents();
  const worldState = projectMolWorldState(events, { now: nowMs });
  const observability = getMolObservability({ bus: session.bus, worldState, coordinator: session.coordinator });
  const log = session.bus.getLog();
  const activeIncidents = Object.values(worldState.categories.incidents).filter((entry) => entry.state === "OPEN");
  const health = session.bus.getHealth();

  return {
    route: MOL_COMMAND_CENTER_ROUTE,
    sections: MOL_COMMAND_CENTER_SECTIONS,
    boundary: "MOL coordinates. Domain systems remain authoritative. Simulated events are not institutional truth or evidence.",
    worldStatus: {
      // Only provider-backed systems can degrade orchestration; planned systems with no provider are listed, not counted.
      orchestrationState: worldState.systems.some((system) => system.mode !== "UNAVAILABLE" && system.health !== "HEALTHY") ? "DEGRADED" : "HEALTHY",
      activeSystems: worldState.systems.filter((system) => system.health === "HEALTHY").length,
      degradedSystems: observability.degradedSystems,
      unavailableSystems: observability.unavailableSystems,
      activeEvents: events.filter((event) => event.status === "ACTIVE" || event.status === "REPORTED").length,
      activeIncidents: activeIncidents.length,
      activeMissions: null,
      activeMissionsNote: "Mission Runtime is contract-only in 4F.5; MOL does not read learner Missions.",
      eventThroughput: { accepted: observability.metrics.accepted, rejected: observability.metrics.rejected, duplicates: observability.metrics.duplicates },
    },
    systemRegistry: listMolSystems().map((system) => ({
      systemId: system.systemId, displayName: system.displayName, authorityDomain: system.authorityDomain, mode: system.mode,
      maturity: system.maturity, integrationMode: system.integrationMode, health: health[system.systemId], healthLabel: molStatusLabel(health[system.systemId]),
      simulated: system.mode === "SIMULATED", capabilities: [...system.capabilities], publishes: [...system.publishes],
    })),
    authorityMatrix: MOL_AUTHORITY_MATRIX,
    eventStream: log.slice(-MOL_EVENT_STREAM_LIMIT).reverse().map((entry) => ({
      sequence: entry.sequence, occurredAt: entry.event.occurredAt, eventType: entry.event.eventType, sourceSystem: entry.event.sourceSystem,
      severity: entry.event.severity, correlationId: entry.event.correlationId, causationId: entry.event.causationId, status: entry.event.status,
      simulated: entry.event.providerMode !== "LIVE", processing: entry.deliveries.some((item) => item.status === "FAILED") ? "FAILED_PROCESSING" : "ACCEPTED",
    })),
    dependencyGraph: {
      nodeCount: session.graph.nodes.length,
      edges: session.graph.edges.filter((edge) => edge.type === "DEPENDS_ON").map((edge) => ({ ...edge })),
      impacts: observability.dependencyImpacts,
    },
    worldState: Object.entries(worldState.categories).flatMap(([category, entries]) => Object.values(entries).map((entry) => ({
      category, key: entry.key, state: entry.state, sourceSystem: entry.sourceSystem, authority: entry.authority, updatedAt: entry.updatedAt,
      freshness: entry.freshness, freshnessLabel: molStatusLabel(entry.freshness), simulated: entry.simulated,
    }))),
    scenario: {
      approved: listMolScenarios().map((scenario) => ({ scenarioId: scenario.scenarioId, title: scenario.title, steps: scenario.steps.length })),
      active: scenarioRun ? { scenarioId: scenarioRun.scenarioId, state: scenarioRun.getState(), timeline: scenarioRun.getTimeline() } : null,
      replay: replay ? { timeline: replay.timeline, matchesLive: replay.matchesLive } : null,
      actionRequests: observability.actionRequests,
    },
    diagnostics: {
      validationFailures: observability.validationFailures,
      processingFailures: observability.processingFailures,
      unavailableSystems: observability.unavailableSystems,
      staleProjections: observability.staleProjections,
      projectionViolations: observability.projectionViolations,
      deadLettersDropped: observability.metrics.deadLettersDropped,
    },
  };
}
