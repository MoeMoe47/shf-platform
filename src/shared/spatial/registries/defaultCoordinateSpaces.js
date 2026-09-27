import { COORDINATE_FAMILIES, TRANSFORM_AVAILABILITY } from "../contracts/constants.js";
import { CoordinateSpaceRegistry } from "./CoordinateSpaceRegistry.js";

const registryProvenance = Object.freeze({
  source: "GEO-1B coordinate registry plan",
  updatedAt: "2026-09-27T00:00:00.000Z",
});

export const DEFAULT_COORDINATE_SPACES = Object.freeze([
  Object.freeze({
    id: "real-world.latlng",
    family: COORDINATE_FAMILIES.REAL_WORLD,
    units: "degrees",
    origin: "WGS84 geographic coordinate reference",
    axisOrientation: "longitude-east latitude-north",
    boundsOrRange: "longitude -180..180; latitude -90..90",
    sourceAssetOrGeography: "real-world coordinate producer",
    transformAvailability: TRANSFORM_AVAILABILITY.NONE,
    transformAuthority: null,
    provenance: registryProvenance,
    version: "1",
  }),
  Object.freeze({
    id: "real-world.county-geojson",
    family: COORDINATE_FAMILIES.REAL_WORLD,
    units: "GeoJSON geometry",
    origin: "source GeoJSON coordinate reference",
    axisOrientation: "source GeoJSON axis orientation",
    boundsOrRange: "source county geometry bounds",
    sourceAssetOrGeography: "registered county GeoJSON",
    transformAvailability: TRANSFORM_AVAILABILITY.NONE,
    transformAuthority: null,
    provenance: registryProvenance,
    version: "1",
  }),
  Object.freeze({
    id: "metaverse.quick-map",
    family: COORDINATE_FAMILIES.METAVERSE,
    units: "normalized percent",
    origin: "top-left of 1448x1086 Quick Map image",
    axisOrientation: "x-right y-down",
    boundsOrRange: "x 0..100; y 0..100",
    sourceAssetOrGeography: "public/assets/metaverse/minimap/silicon-heartland-metaverse-top-map.png",
    transformAvailability: TRANSFORM_AVAILABILITY.NONE,
    transformAuthority: null,
    provenance: registryProvenance,
    version: "1",
  }),
  Object.freeze({
    id: "metaverse.master-city",
    family: COORDINATE_FAMILIES.METAVERSE,
    units: "normalized percent",
    origin: "top-left of approximately 1672x941 master city plate",
    axisOrientation: "x-right y-down",
    boundsOrRange: "x 0..100; y 0..100",
    sourceAssetOrGeography: "public/assets/metaverse/city/silicon-heartland-city-master-overview.png",
    transformAvailability: TRANSFORM_AVAILABILITY.NONE,
    transformAuthority: null,
    provenance: registryProvenance,
    version: "1",
  }),
  Object.freeze({
    id: "metaverse.regional-scene",
    family: COORDINATE_FAMILIES.METAVERSE,
    units: "scene-local coordinates",
    origin: "regional scene local origin",
    axisOrientation: "scene-defined",
    boundsOrRange: "scene-defined",
    sourceAssetOrGeography: "Metaverse regional scene registry",
    transformAvailability: TRANSFORM_AVAILABILITY.NONE,
    transformAuthority: null,
    provenance: registryProvenance,
    version: "1",
  }),
  Object.freeze({
    id: "metaverse.camera-world",
    family: COORDINATE_FAMILIES.METAVERSE,
    units: "runtime camera/world units",
    origin: "runtime scene camera origin",
    axisOrientation: "runtime-defined",
    boundsOrRange: "runtime-defined",
    sourceAssetOrGeography: "Metaverse runtime camera state",
    transformAvailability: TRANSFORM_AVAILABILITY.NONE,
    transformAuthority: null,
    provenance: registryProvenance,
    version: "1",
  }),
]);

export function createDefaultCoordinateSpaceRegistry() {
  return new CoordinateSpaceRegistry(DEFAULT_COORDINATE_SPACES);
}

export const defaultCoordinateSpaceRegistry = createDefaultCoordinateSpaceRegistry();
