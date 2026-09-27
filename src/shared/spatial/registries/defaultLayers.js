import { PUBLICATION_ELIGIBILITY_LEVELS, SPATIAL_LAYER_LIFECYCLE_STATUS } from "../contracts/constants.js";
import { defaultCoordinateSpaceRegistry } from "./defaultCoordinateSpaces.js";
import { SpatialLayerRegistry } from "./SpatialLayerRegistry.js";

export const DEFAULT_SPATIAL_LAYERS = Object.freeze([
  Object.freeze({
    layerId: "real-world.counties",
    name: "Real-world Counties",
    owningDomain: "Spatial",
    sourceAuthority: "registered-geojson-source",
    supportedCoordinateSpaces: Object.freeze(["real-world.county-geojson"]),
    visibilityPolicy: "explicit",
    publicPrivateEligibility: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED,
    requiredPermissions: Object.freeze([]),
    timeAwareCapability: false,
    selectionCapability: true,
    verificationCapability: true,
    accessibilityBehavior: "text equivalent and keyboard selection required",
    lifecycleStatus: SPATIAL_LAYER_LIFECYCLE_STATUS.EXPERIMENTAL,
  }),
  Object.freeze({
    layerId: "metaverse.quick-map.locations",
    name: "Metaverse Quick Map Locations",
    owningDomain: "Metaverse",
    sourceAuthority: "metaverse-quick-map-registry",
    supportedCoordinateSpaces: Object.freeze(["metaverse.quick-map"]),
    visibilityPolicy: "client-controlled",
    publicPrivateEligibility: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
    requiredPermissions: Object.freeze([]),
    timeAwareCapability: false,
    selectionCapability: true,
    verificationCapability: false,
    accessibilityBehavior: "keyboard markers and text equivalents required",
    lifecycleStatus: SPATIAL_LAYER_LIFECYCLE_STATUS.EXPERIMENTAL,
  }),
  Object.freeze({
    layerId: "metaverse.master-city.traces",
    name: "Metaverse Master City Traces",
    owningDomain: "Metaverse",
    sourceAuthority: "metaverse-master-city-registries",
    supportedCoordinateSpaces: Object.freeze(["metaverse.master-city"]),
    visibilityPolicy: "client-controlled",
    publicPrivateEligibility: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
    requiredPermissions: Object.freeze([]),
    timeAwareCapability: false,
    selectionCapability: false,
    verificationCapability: false,
    accessibilityBehavior: "text route/path summary required",
    lifecycleStatus: SPATIAL_LAYER_LIFECYCLE_STATUS.EXPERIMENTAL,
  }),
]);

export function createDefaultSpatialLayerRegistry({ coordinateRegistry = defaultCoordinateSpaceRegistry } = {}) {
  return new SpatialLayerRegistry(DEFAULT_SPATIAL_LAYERS, { coordinateRegistry });
}

export const defaultSpatialLayerRegistry = createDefaultSpatialLayerRegistry();
