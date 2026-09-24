import {
  CANONICAL_DESTINATION_IDS,
  resolveDestinationId,
  isCanonicalDestinationId,
} from "./metaverseCanonicalDestinationRegistry.js";
import { METAVERSE_FACILITIES, METAVERSE_DISTRICT_MARKERS } from "./metaverseNavigationModel.js";
import {
  MINIMAP_COORDINATE_STATUSES,
  MINIMAP_LOCATION_REGISTRY,
  QUICK_MAP_COORDINATE_SPACE,
  isNormalizedQuickMapCoordinate,
} from "./metaverseMiniMapRegistry.js";
import { METAVERSE_PRODUCTION_BACKGROUND_SET, METAVERSE_REFERENCE_ASSETS, METAVERSE_VISUAL_ASSET_REGISTRY } from "./metaverseVisualAssets.js";
import { METAVERSE_LIVING_CITY_SCENES } from "./livingCityRegistry.js";
import { METAVERSE_ROAD_TRACES, METAVERSE_BUS_ROUTES } from "./metaverseRoadTraceRegistry.js";
import { METAVERSE_RIVER_FLOW_PATHS, METAVERSE_WATER_ZONES } from "./metaverseRiverFlowRegistry.js";
import { REGIONAL_SCENE_DESTINATION_REFS } from "./regionalSceneRegistry.js";

export const METAVERSE_RELATIONSHIP_ASSET_STATUSES = ["PRODUCTION", "REFERENCE_ONLY", "MISSING"];

export const MASTER_CITY_COORDINATE_SPACE = Object.freeze({
  id: "master-city",
  units: "normalized-percent",
  minX: 0,
  maxX: 100,
  minY: 0,
  maxY: 100,
});

export const DESTINATION_COORDINATE_STATUSES = Object.freeze(MINIMAP_COORDINATE_STATUSES);

const emptyRelationshipRefs = () => ({
  roadAccessRefs: [],
  waterAccessRefs: [],
  skyBridgeStopRefs: [],
  venueRefs: [],
});

function assetRelationship(facilityId) {
  const production = METAVERSE_PRODUCTION_BACKGROUND_SET.find((asset) => asset.facility === facilityId && asset.cameraLevel === "FACILITY_VIEW");
  if (production) return { status: "PRODUCTION", assetId: production.assetId, assetPath: production.targetPath };
  const reference = METAVERSE_REFERENCE_ASSETS.find((asset) => asset.facility === facilityId);
  if (reference) return { status: "REFERENCE_ONLY", assetId: reference.assetId, assetPath: reference.targetPath };
  return { status: "MISSING", assetId: null, assetPath: null };
}

function relationshipForFacility(facility) {
  const destinationId = facility.destinationId;
  const districtScene = METAVERSE_LIVING_CITY_SCENES.find((scene) => scene.sceneId === facility.districtId && scene.cameraLevel === "DISTRICT_VIEW");
  const facilityScene = METAVERSE_LIVING_CITY_SCENES.find((scene) => scene.sceneId === destinationId && scene.cameraLevel === "FACILITY_VIEW");
  const quickMap = MINIMAP_LOCATION_REGISTRY.find((location) => location.destinationId === destinationId) || null;

  return {
    destinationId,
    masterCity: {
      facilityId: facility.id,
      coordinateSpaceId: MASTER_CITY_COORDINATE_SPACE.id,
      position: { x: facility.x, y: facility.y },
      status: "VERIFIED",
    },
    quickMap: quickMap ? {
      markerId: quickMap.id,
      coordinateSpaceId: QUICK_MAP_COORDINATE_SPACE.id,
      position: { x: quickMap.x, y: quickMap.y },
      status: quickMap.status,
    } : null,
    quickMapStatus: quickMap?.status || "UNMAPPED",
    districtId: facility.districtId,
    facilityId: facility.id,
    districtSceneId: districtScene?.sceneId || null,
    facilitySceneId: facilityScene?.sceneId || null,
    backgroundAsset: assetRelationship(facility.id),
    ...emptyRelationshipRefs(),
  };
}

export const METAVERSE_DESTINATION_RELATIONSHIPS = Object.freeze(
  METAVERSE_FACILITIES.map(relationshipForFacility),
);

function normalizeDestinationId(id) {
  return resolveDestinationId(id);
}

export function getDestinationSpatialRelationship(id) {
  const destinationId = normalizeDestinationId(id);
  if (!destinationId) return null;
  return METAVERSE_DESTINATION_RELATIONSHIPS.find((relationship) => relationship.destinationId === destinationId) || null;
}

export function getMasterCityLocation(id) {
  const masterCity = getDestinationSpatialRelationship(id)?.masterCity;
  if (!masterCity) return null;
  // Preserve the Phase 1.3 caller shape; coordinate-space metadata is
  // available through getMasterCityProjection and the full relationship.
  return { facilityId: masterCity.facilityId, position: masterCity.position };
}

export function getMasterCityProjection(id) {
  return getDestinationSpatialRelationship(id)?.masterCity || null;
}

export function getQuickMapLocation(id) {
  return getDestinationSpatialRelationship(id)?.quickMap || null;
}

export function getQuickMapProjection(id) {
  return getDestinationSpatialRelationship(id)?.quickMap || null;
}

export function getDestinationScene(id) {
  const relationship = getDestinationSpatialRelationship(id);
  if (!relationship) return null;
  return {
    districtSceneId: relationship.districtSceneId,
    facilitySceneId: relationship.facilitySceneId,
    backgroundAsset: relationship.backgroundAsset,
  };
}

export function getDestinationRoadAccess(id) {
  return getDestinationSpatialRelationship(id)?.roadAccessRefs || [];
}

export function getDestinationWaterAccess(id) {
  return getDestinationSpatialRelationship(id)?.waterAccessRefs || [];
}

export function validateMetaverseDestinationRelationships(relationships = METAVERSE_DESTINATION_RELATIONSHIPS) {
  const errors = [];
  const destinationIds = new Set(CANONICAL_DESTINATION_IDS);
  const districtIds = new Set(METAVERSE_DISTRICT_MARKERS.map((district) => district.id));
  const facilityIds = new Set(METAVERSE_FACILITIES.map((facility) => facility.id));
  const sceneIds = new Set(METAVERSE_LIVING_CITY_SCENES.map((scene) => scene.sceneId));
  const assetIds = new Set(METAVERSE_VISUAL_ASSET_REGISTRY.map((asset) => asset.assetId));
  const roadIds = new Set([
    ...METAVERSE_ROAD_TRACES.map((path) => path.id),
    ...METAVERSE_BUS_ROUTES.map((route) => route.id),
  ]);
  const waterIds = new Set([
    ...METAVERSE_RIVER_FLOW_PATHS.map((path) => path.id),
    ...METAVERSE_WATER_ZONES.map((zone) => zone.id),
  ]);
  const seenDestinations = new Set();
  const seenMasterCoordinates = new Set();

  for (const relationship of relationships) {
    if (!destinationIds.has(relationship.destinationId) || !isCanonicalDestinationId(relationship.destinationId)) {
      errors.push(`unknown destinationId: ${relationship.destinationId}`);
    }
    if (seenDestinations.has(relationship.destinationId)) errors.push(`duplicate relationship ownership: ${relationship.destinationId}`);
    seenDestinations.add(relationship.destinationId);

    if (!districtIds.has(relationship.districtId)) errors.push(`${relationship.destinationId}: unknown districtId ${relationship.districtId}`);
    if (!facilityIds.has(relationship.facilityId)) errors.push(`${relationship.destinationId}: unknown facilityId ${relationship.facilityId}`);
    if (relationship.masterCity?.facilityId !== relationship.facilityId) errors.push(`${relationship.destinationId}: master-city facility mismatch`);
    if (relationship.masterCity?.coordinateSpaceId !== MASTER_CITY_COORDINATE_SPACE.id) errors.push(`${relationship.destinationId}: invalid master-city coordinate space`);
    if (relationship.masterCity?.status !== "VERIFIED") errors.push(`${relationship.destinationId}: invalid master-city coordinate status`);
    if (!isNormalizedQuickMapCoordinate(relationship.masterCity?.position?.x, relationship.masterCity?.position?.y)) errors.push(`${relationship.destinationId}: invalid master-city coordinates`);

    const coordinateKey = `${relationship.masterCity?.position?.x}:${relationship.masterCity?.position?.y}`;
    if (seenMasterCoordinates.has(coordinateKey)) errors.push(`${relationship.destinationId}: duplicate master-city coordinate ownership`);
    seenMasterCoordinates.add(coordinateKey);

    for (const sceneId of [relationship.districtSceneId, relationship.facilitySceneId].filter(Boolean)) {
      if (!sceneIds.has(sceneId)) errors.push(`${relationship.destinationId}: unknown scene ID ${sceneId}`);
    }
    if (!METAVERSE_RELATIONSHIP_ASSET_STATUSES.includes(relationship.backgroundAsset?.status)) {
      errors.push(`${relationship.destinationId}: invalid background asset status`);
    }
    if (relationship.backgroundAsset?.assetId && !assetIds.has(relationship.backgroundAsset.assetId)) {
      errors.push(`${relationship.destinationId}: unknown asset reference ${relationship.backgroundAsset.assetId}`);
    }
    if (relationship.quickMap && relationship.quickMap.markerId && !MINIMAP_LOCATION_REGISTRY.some((location) => location.id === relationship.quickMap.markerId)) {
      errors.push(`${relationship.destinationId}: unknown Quick Map marker ${relationship.quickMap.markerId}`);
    }
    if (!MINIMAP_COORDINATE_STATUSES.includes(relationship.quickMapStatus)) errors.push(`${relationship.destinationId}: invalid Quick Map coordinate status`);
    if (relationship.quickMap && !isNormalizedQuickMapCoordinate(relationship.quickMap.position?.x, relationship.quickMap.position?.y)) errors.push(`${relationship.destinationId}: invalid Quick Map coordinates`);
    for (const roadId of relationship.roadAccessRefs || []) if (!roadIds.has(roadId)) errors.push(`${relationship.destinationId}: unknown road access reference ${roadId}`);
    for (const waterId of relationship.waterAccessRefs || []) if (!waterIds.has(waterId)) errors.push(`${relationship.destinationId}: unknown water access reference ${waterId}`);
    if ((relationship.skyBridgeStopRefs || []).length) errors.push(`${relationship.destinationId}: Sky Bridge registry is not available`);
    if ((relationship.venueRefs || []).length) errors.push(`${relationship.destinationId}: Venue registry is not available`);
  }

  for (const marker of MINIMAP_LOCATION_REGISTRY) {
    if (marker.category === "INFRASTRUCTURE" && (marker.destinationId !== null || marker.markerClassification !== "PROVISIONAL_INFRASTRUCTURE")) {
      errors.push(`${marker.id}: provisional infrastructure marker must remain unclaimed`);
    }
  }

  for (const reference of REGIONAL_SCENE_DESTINATION_REFS) {
    if (reference.destinationId !== null && !destinationIds.has(reference.destinationId)) errors.push(`${reference.sceneId}: unknown regional destination reference`);
  }

  return errors;
}
