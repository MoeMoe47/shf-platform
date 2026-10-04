import { getMasterCityProjection } from "../metaverseDestinationRelationshipRegistry.js";
import { METAVERSE_FACILITIES, METAVERSE_ACTIVITY_PLACEHOLDERS } from "../metaverseNavigationModel.js";
import { MINIMAP_LOCATION_REGISTRY, QUICK_MAP_COORDINATE_SPACE } from "../metaverseMiniMapRegistry.js";
import {
  getMoccRenderableOverlayEntities,
  MOCC_OPERATIONAL_OVERLAY_BY_ID,
} from "./moccOperationalOverlayRegistry.js";

const INFRASTRUCTURE_CONTEXT_IDS = new Set([
  "main-data-center",
  "network-operations-center",
  "power-electrical-facility",
  "cooling-mechanical-plant",
  "security-operations-center",
  "ai-compute-facility",
]);

function entity({ id, overlayId, label, sourceAuthority, sourceReference, spatialReference, state = null, severity = null, timestamp = null, metadata = {} }) {
  if (!spatialReference || !sourceAuthority || !sourceReference) return null;
  return Object.freeze({
    entity_id: id,
    overlay_id: overlayId,
    label,
    source_authority: sourceAuthority,
    source_reference: sourceReference,
    spatial_reference: Object.freeze(spatialReference),
    state,
    severity,
    timestamp,
    metadata: Object.freeze(metadata),
  });
}

function resolveCitySpatialReference(location) {
  if (!location) return null;
  if (location.facility_id) {
    const masterCity = getMasterCityProjection(location.facility_id);
    if (masterCity) {
      return {
        coordinate_space_id: masterCity.coordinateSpaceId,
        district_id: location.district_id ?? null,
        facility_id: masterCity.facilityId,
        position: masterCity.position,
        status: masterCity.status,
      };
    }
  }
  return null;
}

function projectCityEvents(overlayId, events, acceptsEvent) {
  if (!MOCC_OPERATIONAL_OVERLAY_BY_ID[overlayId]?.status) return [];
  return getMoccRenderableOverlayEntities(overlayId, events)
    .filter(acceptsEvent)
    .map((event) => entity({
      id: `${overlayId}:${event.event_id || event.source_event_ref}`,
      overlayId,
      label: event.title || event.event_type || overlayId,
      sourceAuthority: event.source_authority,
      sourceReference: event.source_event_ref || event.event_id,
      spatialReference: resolveCitySpatialReference(event.location),
      state: event.state,
      severity: event.severity,
      timestamp: event.timestamp,
      metadata: { event_type: event.event_type },
    }))
    .filter(Boolean);
}

function projectSimulationContext() {
  return METAVERSE_ACTIVITY_PLACEHOLDERS
    .filter((activity) => activity.mountPoint === "simulation")
    .map((activity) => entity({
      id: `simulations:${activity.id}`,
      overlayId: "simulations",
      label: activity.label,
      sourceAuthority: "MET-2_METAVERSE_ACTIVITY_REGISTRY",
      sourceReference: activity.id,
      spatialReference: resolveCitySpatialReference({ district_id: activity.districtId, facility_id: activity.facilityId }),
      metadata: { activity_id: activity.id, context_only: true },
    }))
    .filter(Boolean);
}

function projectInfrastructureContext() {
  return METAVERSE_FACILITIES
    .filter((facility) => INFRASTRUCTURE_CONTEXT_IDS.has(facility.id) && facility.destinationId)
    .map((facility) => entity({
      id: `data-centers-infrastructure:${facility.destinationId}`,
      overlayId: "data-centers-infrastructure",
      label: facility.label,
      sourceAuthority: "MET-2_CANONICAL_CITY_REGISTRY",
      sourceReference: facility.destinationId,
      spatialReference: resolveCitySpatialReference({ district_id: facility.districtId, facility_id: facility.destinationId }),
      metadata: { destination_id: facility.destinationId, context_only: true },
    }))
    .filter(Boolean);
}

function projectQuickMapContext(overlayId, locationId) {
  const location = MINIMAP_LOCATION_REGISTRY.find((item) => item.id === locationId);
  if (!location || location.status !== "PROVISIONAL" || location.coordinateSpaceId !== QUICK_MAP_COORDINATE_SPACE.id) return null;
  return entity({
    id: `${overlayId}:${location.id}`,
    overlayId,
    label: location.label,
    sourceAuthority: "QUICK_MAP_CANONICAL_SPATIAL_REGISTRY",
    sourceReference: location.id,
    spatialReference: {
      coordinate_space_id: location.coordinateSpaceId,
      location_id: location.id,
      position: { x: location.x, y: location.y },
      status: location.status,
    },
    metadata: { context_only: true, provisional: true },
  });
}

export function projectMoccOperationalOverlayEntities({ events = [], visibility = {} } = {}) {
  const projected = [];
  const addIfVisible = (overlayId, entities) => {
    if (visibility[overlayId]) projected.push(...entities);
  };

  addIfVisible("missions", projectCityEvents("missions", events, (event) => event.event_type?.startsWith("MISSION.")));
  addIfVisible("civic", projectCityEvents("civic", events, (event) => event.event_type?.startsWith("CIVIC.")));
  addIfVisible("simulations", projectSimulationContext());
  addIfVisible("data-centers-infrastructure", projectInfrastructureContext());
  if (visibility["port-logistics"] || visibility.marine) {
    const harbor = projectQuickMapContext(visibility["port-logistics"] ? "port-logistics" : "marine", "marina-harbor");
    if (harbor) projected.push(harbor);
  }
  if (visibility.aviation) {
    const airport = projectQuickMapContext("aviation", "airport");
    if (airport) projected.push(airport);
  }
  return projected;
}
