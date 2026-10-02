// Phase 9 — Core MOCC: Silicon Heartland Metaverse Operations & Orchestration Command Center (pure view model).
//
// The MOCC coordinates authorities; it does not replace them. It is an operational view, digital twin, system-health
// surface, timeline, simulation/scenario control surface, dependency view, incident awareness, replay and audit
// surface. It owns only presentation state (which overlays are visible). It holds no learner identity, accommodation,
// medical, credential, financial or identity-token data: every input is an aggregate or a reference.
//
// The Quick Map / Mini Map remains the canonical Digital Twin spatial surface. No competing map or coordinate system
// is introduced: overlays are registered canonical spatial layers on metaverse.quick-map, and features are placed
// only through calibrated Quick Map locations. Unmapped features are listed, never placed.

import { MINIMAP_ASSET, MINIMAP_LOCATION_REGISTRY, QUICK_MAP_COORDINATE_SPACE } from "../metaverseMiniMapRegistry.js";
import { getMolEventDefinition } from "../mol/molEventRegistry.js";
import { listMolSystems } from "../mol/molSystemRegistry.js";
import { MOCC_CONTROLS, MOCC_PERMISSIONS } from "./moccOperatorActions.js";

export const MOCC_NAME = "Silicon Heartland Metaverse Operations & Orchestration Command Center";
export const MOCC_ROUTE = "/metaverse/dev/mocc";
export const MOCC_CONTRACT = Object.freeze({
  ownsDomainTruth: false, ownsWorkforceActivation: false, ownsMissionExecution: false, ownsEvidence: false,
  ownsOnly: Object.freeze(["presentation state (overlay visibility)", "operator audit records"]),
  coordinatesWith: Object.freeze(["Regional Simulation Authority", "MOL", "Mission Runtime (read-only)", "Arcade Integration Fabric (read-only)", "Workforce ProgramPackage registry (read-only)"]),
});
// Progressive disclosure: only the essentials open by default.
export const MOCC_SECTIONS = Object.freeze([
  { id: "digital-twin", title: "Digital twin", defaultExpanded: true },
  { id: "system-health", title: "System health", defaultExpanded: true },
  { id: "timeline", title: "Event timeline", defaultExpanded: true },
  { id: "scenarios", title: "Active scenarios", defaultExpanded: false },
  { id: "incidents", title: "Incidents", defaultExpanded: false },
  { id: "dependencies", title: "Dependencies", defaultExpanded: false },
  { id: "program-impact", title: "Program / Mission impact", defaultExpanded: false },
  { id: "replay", title: "Replay", defaultExpanded: false },
  { id: "operator-actions", title: "Operator actions", defaultExpanded: false },
  { id: "audit", title: "Audit", defaultExpanded: false },
]);

// Overlay architecture: implemented overlays are canonical spatial layers; planned overlays are declared only.
export const MOCC_OVERLAYS = Object.freeze([
  { overlayId: "infrastructure", layerId: "metaverse.mocc.infrastructure", status: "IMPLEMENTED", title: "Power / data center / infrastructure" },
  { overlayId: "incidents", layerId: "metaverse.mocc.incidents", status: "IMPLEMENTED", title: "Incidents" },
  { overlayId: "mobility", layerId: "metaverse.mocc.mobility", status: "IMPLEMENTED", title: "Road and waterway mobility" },
  ...["rail-sky-bridge", "aviation", "port-logistics", "fire-ems", "dispatch", "hospital", "public-works", "water-utility", "telecom-fiber", "weather",
    "missions-aggregate", "teams-aggregate", "ai-agents", "civic-events"].map((overlayId) => ({ overlayId, layerId: null, status: "PLANNED", title: overlayId })),
].map((item) => Object.freeze(item)));

export const MOCC_TIMELINE_LABELS = Object.freeze(["CURRENT", "SIMULATION", "REPLAY", "TEST", "WHAT_IF"]);
export const MOCC_HEALTH_STATES = Object.freeze(["HEALTHY", "DEGRADED", "UNAVAILABLE", "PAUSED", "UNKNOWN"]);

export function createMoccPresentationState({ visibleOverlayIds = ["infrastructure", "incidents"] } = {}) {
  const visible = new Set(visibleOverlayIds);
  return Object.freeze({
    toggleOverlay(overlayId) {
      const overlay = MOCC_OVERLAYS.find((item) => item.overlayId === overlayId);
      if (!overlay) return { ok: false, reason: "UNKNOWN_OVERLAY" };
      if (overlay.status !== "IMPLEMENTED") return { ok: false, reason: "OVERLAY_NOT_IMPLEMENTED" };
      if (visible.has(overlayId)) visible.delete(overlayId); else visible.add(overlayId);
      return { ok: true, overlayId, visible: visible.has(overlayId) };
    },
    isVisible: (overlayId) => visible.has(overlayId),
    visibleOverlayIds: () => [...visible].sort(),
  });
}

// Canonical id → calibrated Quick Map location. Only locations whose registry entry names the canonical destination
// are placed; nothing is inferred from labels or geometry.
function quickMapPosition(destinationId) {
  const location = MINIMAP_LOCATION_REGISTRY.find((item) => item.destinationId && item.destinationId === destinationId && item.calibrated && item.x !== null);
  return location ? { locationId: location.id, x: location.x, y: location.y, status: location.status } : null;
}

function timelineLabel(event, label) {
  if (label === "REPLAY" || label === "WHAT_IF") return label;
  if (event.providerMode === "TEST") return "TEST";
  return event.providerMode === "LIVE" ? "CURRENT" : "SIMULATION";
}

export function filterMoccTimeline(entries, filters = {}) {
  return entries.filter((entry) => (!filters.system || entry.sourceSystem === filters.system)
    && (!filters.category || entry.category === filters.category)
    && (!filters.severity || entry.severity === filters.severity)
    && (!filters.scenario || entry.scenarioId === filters.scenario)
    && (!filters.correlationId || entry.correlationId === filters.correlationId)
    && (!filters.from || Date.parse(entry.simulationTime) >= Date.parse(filters.from))
    && (!filters.to || Date.parse(entry.simulationTime) <= Date.parse(filters.to))
    && (!filters.region || entry.destinationId === filters.region));
}

export function buildMoccViewModel({ simulation, auditLog, presentation, operator = null, programImpact = null, missionObservability = null, replay = null, whatIf = null, timelineFilters = {} }) {
  const state = simulation.getState();
  const log = simulation.getLog();
  const events = log.map((entry) => entry.event);
  const health = simulation.getHealth();
  const lastEventBySystem = {};
  for (const entry of log) lastEventBySystem[entry.event.sourceSystem] = { eventId: entry.event.eventId, eventType: entry.event.eventType, sequence: entry.sequence };

  const timeline = log.map((entry) => ({
    sequence: entry.sequence, eventId: entry.event.eventId, eventType: entry.event.eventType, category: getMolEventDefinition(entry.event.eventType)?.category ?? "UNKNOWN",
    sourceSystem: entry.event.sourceSystem, authority: entry.event.authority, severity: entry.event.severity, status: entry.event.status,
    correlationId: entry.event.correlationId, causationId: entry.event.causationId, scenarioId: entry.event.payload?.scenarioId ?? null,
    destinationId: entry.event.location?.destinationId ?? null, simulationTime: entry.event.simulationTime ?? entry.event.occurredAt,
    label: timelineLabel(entry.event, state.label),
  }));
  const impactsBySystem = Object.fromEntries(state.activeScenarios.flatMap((run) => run.participants.map((item) => [item.systemId, `${run.regionalScenarioId}:${item.status}`])));

  // Health comes from the MOL event log (SYSTEM_HEALTH_CHANGED) and registered provider modes — never from whether a
  // frontend happens to be rendering.
  const systemHealth = listMolSystems().map((system) => ({
    systemId: system.systemId, authority: system.authorityDomain, mode: system.mode, maturity: system.maturity,
    health: state.status === "PAUSED" && system.systemId === "regional-simulation" ? "PAUSED" : health[system.systemId] ?? "UNKNOWN",
    lastEvent: lastEventBySystem[system.systemId] ?? null, dependencies: [...system.dependsOn],
    activeWarnings: timeline.filter((entry) => entry.sourceSystem === system.systemId && ["MAJOR", "CRITICAL"].includes(entry.severity) && entry.status !== "RESOLVED").map((entry) => entry.eventType),
    currentScenarioImpact: impactsBySystem[system.systemId] ?? null,
    simulationStatus: system.systemId === "regional-simulation" ? state.status : null,
  }));

  const world = simulation.getWorldState();
  const featureFor = (category, entry) => {
    const position = quickMapPosition(entry.key.replace(/^destination:/, ""));
    return { featureId: `${category}:${entry.key}`, key: entry.key, state: entry.state, sourceSystem: entry.sourceSystem, sourceEventId: entry.lastEventId, simulated: entry.simulated,
      mapStatus: position ? "MAPPED" : "UNMAPPED", position };
  };
  const overlayFeatures = {
    infrastructure: [...Object.values(world.categories.infrastructure), ...Object.values(world.categories.regionalImpacts).filter((entry) => entry.state !== "CLEARED")].map((entry) => featureFor("infrastructure", entry)),
    incidents: Object.values(world.categories.incidents).filter((entry) => entry.state === "OPEN").map((entry) => featureFor("incidents", entry)),
    mobility: [...Object.values(world.categories.traffic), ...Object.values(world.categories.water)].map((entry) => featureFor("mobility", entry)),
  };
  const permissions = operator?.permissions ?? [];

  return {
    name: MOCC_NAME, route: MOCC_ROUTE, contract: MOCC_CONTRACT, sections: MOCC_SECTIONS,
    boundary: "The MOCC coordinates authorities; it does not replace them. Simulated regional state is not real-world civic truth.",
    topBar: {
      simulationMode: state.environmentMode, label: state.label, simulationStatus: state.status, worldClock: state.clock.simulationTime,
      healthSummary: Object.fromEntries(MOCC_HEALTH_STATES.map((status) => [status, systemHealth.filter((item) => item.health === status).length])),
      scenario: state.activeScenarios.find((run) => run.state === "RUNNING")?.regionalScenarioId ?? null,
      activeAlerts: timeline.filter((entry) => ["MAJOR", "CRITICAL"].includes(entry.severity) && entry.status !== "RESOLVED").length,
      realWorld: false,
    },
    digitalTwin: {
      baseMap: { asset: MINIMAP_ASSET, coordinateSpaceId: "metaverse.quick-map", quickMapCoordinateSpace: QUICK_MAP_COORDINATE_SPACE.id, reused: true },
      overlays: MOCC_OVERLAYS.map((overlay) => ({ ...overlay, visible: presentation.isVisible(overlay.overlayId), features: overlayFeatures[overlay.overlayId] ?? [] })),
    },
    systemHealth,
    timeline: { labels: MOCC_TIMELINE_LABELS, entries: filterMoccTimeline(timeline, timelineFilters).slice(-100) },
    scenarios: state.activeScenarios,
    incidents: state.activeIncidents,
    dependencies: simulation.getDependencyProjection(),
    programImpact: programImpact ? { readOnly: true, programs: programImpact } : { readOnly: true, programs: [], note: "Program impact is supplied by the workforce registry (read-only)." },
    missionObservability: missionObservability ?? { readOnly: true, activeMissions: null, note: "Mission/Arcade observability is supplied read-only by their authorities." },
    replay: replay ? { label: "REPLAY", state: replay.getState(), range: replay.range, timeline: replay.getTimeline() } : null,
    whatIf: whatIf ? { label: "WHAT_IF", writesCanonical: false, changedFlags: whatIf.changedFlags } : null,
    operatorActions: MOCC_CONTROLS.map((item) => ({
      controlId: item.controlId, targetSystem: item.targetSystem, owningAuthority: item.owningAuthority, simulationOnly: item.simulationOnly,
      liveAllowed: item.liveAllowed, confirmationRequired: item.confirmationRequired, authorized: permissions.includes(item.requiredPermission),
    })),
    audit: auditLog.list().slice(-50),
    permissions: MOCC_PERMISSIONS,
  };
}
