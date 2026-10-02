// Phase 4F.5 — MOL World State projection.
//
// MOL World State is a projection, not a universal source of truth. It is a
// pure function of the accepted event log, so replay reconstructs it exactly.
// Each category has one owning authority; an event from any other authority
// cannot change it. Nothing transitions without an authoritative event: when a
// source is degraded or unavailable, last-known values are retained and marked
// (the spatial MARK_STALE policy), never refreshed or invented.

import { SPATIAL_LAYER_STALE_POLICIES } from "../../../shared/spatial/contracts/constants.js";
import { MOL_EVENT_TYPES as T } from "./molEventContract.js";
import { deriveMolSystemHealth } from "./molEventBus.js";
import { MOL_WORLD_STATE_OWNERS, listMolSystems } from "./molSystemRegistry.js";

export const MOL_WORLD_STATE_VERSION = 1;
export const MOL_STALE_POLICY = SPATIAL_LAYER_STALE_POLICIES.MARK_STALE;
export const MOL_FRESHNESS = Object.freeze(["CURRENT", "STALE", "SOURCE_UNAVAILABLE"]);
export const MOL_DEFAULT_STALE_AFTER_MS = 15 * 60 * 1000;

function subjectRef(event) {
  return event.entities.find((entity) => entity.role === "SUBJECT")?.entityRef ?? null;
}

// eventType → [category, key resolver, state resolver]
const REDUCERS = Object.freeze({
  [T.ROAD_CLOSED]: ["traffic", (event) => event.location?.featureId, () => "CLOSED"],
  [T.ROAD_REOPENED]: ["traffic", (event) => event.location?.featureId, () => "OPEN"],
  [T.VEHICLE_COLLISION]: ["traffic", (event) => event.location?.featureId, (event) => (event.status === "RESOLVED" ? "OPEN" : "COLLISION_REPORTED")],
  [T.WATERWAY_RESTRICTED]: ["water", (event) => event.location?.featureId, () => "RESTRICTED"],
  [T.WATERWAY_RESTRICTION_LIFTED]: ["water", (event) => event.location?.featureId, () => "OPEN"],
  [T.STORM_STARTED]: ["environment", () => "weather", (event) => String(event.payload.weatherPreset || "STORM")],
  [T.STORM_ENDED]: ["environment", () => "weather", () => "CLEAR"],
  [T.POWER_FAILURE]: ["infrastructure", (event) => event.location?.destinationId, () => "FAILED"],
  [T.POWER_RESTORED]: ["infrastructure", (event) => event.location?.destinationId, () => "ONLINE"],
  [T.INCIDENT_OPENED]: ["incidents", subjectRef, () => "OPEN"],
  [T.INCIDENT_CLOSED]: ["incidents", subjectRef, () => "CLOSED"],
});

export function projectMolWorldState(events, { now = Date.now(), staleAfterMs = MOL_DEFAULT_STALE_AFTER_MS } = {}) {
  const categories = Object.fromEntries(Object.keys(MOL_WORLD_STATE_OWNERS).map((category) => [category, {}]));
  const violations = [];
  for (const event of events) {
    const reducer = REDUCERS[event.eventType];
    if (!reducer) continue;
    const [category, keyOf, stateOf] = reducer;
    // Defense in depth: even a forged log cannot let one authority write another's category.
    if (MOL_WORLD_STATE_OWNERS[category] !== event.authority) {
      violations.push({ eventId: event.eventId, category, authority: event.authority, reason: "CATEGORY_OWNED_BY_OTHER_AUTHORITY" });
      continue;
    }
    const key = keyOf(event);
    if (!key) {
      violations.push({ eventId: event.eventId, category, authority: event.authority, reason: "MISSING_PROJECTION_KEY" });
      continue;
    }
    categories[category][key] = {
      key,
      state: stateOf(event),
      severity: event.severity,
      sourceSystem: event.sourceSystem,
      authority: event.authority,
      providerMode: event.providerMode,
      simulated: event.providerMode !== "LIVE",
      lastEventId: event.eventId,
      correlationId: event.correlationId,
      updatedAt: event.occurredAt,
    };
  }

  const health = deriveMolSystemHealth(events.map((event) => ({ event })));
  for (const entries of Object.values(categories)) {
    for (const entry of Object.values(entries)) {
      const sourceHealth = health[entry.sourceSystem];
      entry.freshness = sourceHealth === "UNAVAILABLE" ? "SOURCE_UNAVAILABLE"
        : sourceHealth === "DEGRADED" || now - Date.parse(entry.updatedAt) > staleAfterMs ? "STALE" : "CURRENT";
    }
  }
  const systems = listMolSystems().map((system) => ({
    systemId: system.systemId,
    authorityDomain: system.authorityDomain,
    mode: system.mode,
    maturity: system.maturity,
    health: health[system.systemId],
    // Unavailable systems contribute no current state; their absence is shown, not filled in.
    projectionAvailable: health[system.systemId] !== "UNAVAILABLE",
  }));
  return {
    worldStateVersion: MOL_WORLD_STATE_VERSION,
    stalePolicy: MOL_STALE_POLICY,
    projectedAt: new Date(now).toISOString(),
    eventCount: events.length,
    categories,
    systems,
    violations,
    authorityStatement: "Projection only. Each value is owned by its source system; MOL never sets domain facts.",
  };
}
