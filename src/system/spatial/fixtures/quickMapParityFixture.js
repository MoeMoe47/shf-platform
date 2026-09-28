// NON-PRODUCTION Wave 4E fixture. This module exists only to exercise the
// production projection/client boundary from the development city route.
import { createSpatialFeatureId } from "../../../shared/spatial/contracts/featureIds.js";
import {
  COORDINATE_FAMILIES,
  PUBLICATION_ELIGIBILITY_LEVELS,
  SPATIAL_LAYER_LIFECYCLE_STATUS,
  VERIFICATION_STATES,
  createDefaultCoordinateSpaceRegistry,
  SpatialLayerRegistry,
} from "../../../shared/spatial/index.js";
import { createProjectionAdapterRegistry, createSpatialProjectionPipeline } from "../projection/index.js";
import { createQuickMapClientAdapter } from "../clients/quickMap/index.js";
import { DEFAULT_SPATIAL_LAYERS } from "../../../shared/spatial/registries/defaultLayers.js";

export const QUICK_MAP_FIXTURE_AUTHORITY = "test.spatial.quick-map-fixture";
const QUICK_MAP_FIXTURE_DOMAIN = "test-fixture";
const QUICK_MAP_FIXTURE_TYPE = "quick-map-location";
const QUICK_MAP_FIXTURE_LAYER = "test.spatial.quick-map-fixture";
const QUICK_MAP_SPACE = "metaverse.quick-map";
const FIXTURE_NOW = new Date("2026-09-28T12:00:00.000Z");

export const QUICK_MAP_PARITY_FIXTURE_RECORDS = Object.freeze([
  Object.freeze({ id: "fixture-normal", label: "Spatial Fixture Normal", x: 28, y: 32, domainState: null, verificationState: VERIFICATION_STATES.VERIFIED, publicationState: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC, updatedAt: FIXTURE_NOW.toISOString() }),
  Object.freeze({ id: "fixture-stale", label: "Spatial Fixture Stale", x: 44, y: 46, domainState: null, verificationState: VERIFICATION_STATES.UNKNOWN, publicationState: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC, updatedAt: "2026-09-28T08:00:00.000Z", freshness: "stale" }),
  Object.freeze({ id: "fixture-unavailable", label: "Spatial Fixture Unavailable", x: 62, y: 54, domainState: "UNAVAILABLE", verificationState: VERIFICATION_STATES.VERIFIED, publicationState: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC, updatedAt: FIXTURE_NOW.toISOString() }),
  Object.freeze({ id: "fixture-hidden", label: "Spatial Fixture Hidden", x: 75, y: 68, domainState: null, verificationState: VERIFICATION_STATES.VERIFIED, publicationState: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED, updatedAt: FIXTURE_NOW.toISOString(), hidden: true }),
]);

function createFixtureLayerRegistry(coordinateRegistry) {
  return new SpatialLayerRegistry([
    ...DEFAULT_SPATIAL_LAYERS,
    Object.freeze({
      layerId: QUICK_MAP_FIXTURE_LAYER,
      name: "Test-only Quick Map Fixture",
      owningDomain: QUICK_MAP_FIXTURE_DOMAIN,
      sourceAuthority: QUICK_MAP_FIXTURE_AUTHORITY,
      supportedCoordinateSpaces: Object.freeze([QUICK_MAP_SPACE]),
      visibilityPolicy: "fixture-only",
      publicPrivateEligibility: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC,
      requiredPermissions: Object.freeze([]),
      timeAwareCapability: false,
      selectionCapability: true,
      verificationCapability: true,
      accessibilityBehavior: "test-only semantic parity",
      lifecycleStatus: SPATIAL_LAYER_LIFECYCLE_STATUS.ACTIVE,
      maxSourceAge: "PT1H",
      freshnessAuthority: QUICK_MAP_FIXTURE_AUTHORITY,
      maskMode: "HIDE",
    }),
  ], { coordinateRegistry });
}

function createFixtureAdapter() {
  const adapter = {
    getDomain: () => QUICK_MAP_FIXTURE_DOMAIN,
    getSourceAuthority: () => QUICK_MAP_FIXTURE_AUTHORITY,
    getSupportedFeatureTypes: () => [QUICK_MAP_FIXTURE_TYPE],
    getSupportedCoordinateSpaces: () => [QUICK_MAP_SPACE],
    getProjectionVersion: () => "1",
    canProject: (record) => record?.sourceAuthority === QUICK_MAP_FIXTURE_AUTHORITY,
    project: (record) => {
      const featureId = createSpatialFeatureId({
        domain: QUICK_MAP_FIXTURE_DOMAIN,
        featureType: QUICK_MAP_FIXTURE_TYPE,
        sourceAuthority: QUICK_MAP_FIXTURE_AUTHORITY,
        sourceRecordId: record.id,
      });
      return Object.freeze({
        featureId,
        featureType: QUICK_MAP_FIXTURE_TYPE,
        domain: QUICK_MAP_FIXTURE_DOMAIN,
        sourceAuthority: QUICK_MAP_FIXTURE_AUTHORITY,
        sourceRecordId: record.id,
        coordinateFamily: COORDINATE_FAMILIES.METAVERSE,
        coordinateSpaceId: QUICK_MAP_SPACE,
        geometry: `point(${record.x},${record.y})`,
        position: Object.freeze({ x: record.x, y: record.y }),
        layerId: QUICK_MAP_FIXTURE_LAYER,
        title: record.label,
        label: record.label,
        ...(record.domainState ? { state: record.domainState } : {}),
        verificationState: record.verificationState,
        publicationState: record.publicationState,
        publicEligibility: Object.freeze({ level: record.publicationState, publicationState: record.publicationState }),
        provenance: Object.freeze({
          sourceAuthority: QUICK_MAP_FIXTURE_AUTHORITY,
          sourceRecordId: record.id,
          projectionAdapter: "quick-map-parity-fixture",
          projectionVersion: "1",
          updatedAt: record.updatedAt,
          coordinateProvenance: QUICK_MAP_SPACE,
        }),
        updatedAt: record.updatedAt,
        allowedInteractions: Object.freeze(["SELECT", "FOCUS", "HIGHLIGHT", "OPEN_RECORD"]),
        authorizedActionReferences: Object.freeze([]),
      });
    },
  };
  return Object.freeze(adapter);
}

function toSourceRecord(record) {
  return Object.freeze({
    domain: QUICK_MAP_FIXTURE_DOMAIN,
    featureType: QUICK_MAP_FIXTURE_TYPE,
    sourceAuthority: QUICK_MAP_FIXTURE_AUTHORITY,
    sourceRecordId: record.id,
    id: record.id,
    label: record.label,
    x: record.x,
    y: record.y,
    domainState: record.domainState,
    verificationState: record.verificationState,
    publicationState: record.publicationState,
    updatedAt: record.updatedAt,
    temporal: Object.freeze({ sourceTimestamp: record.updatedAt, freshness: record.freshness || "current" }),
  });
}

export function createQuickMapParityFixtureRuntime() {
  const coordinateRegistry = createDefaultCoordinateSpaceRegistry();
  const layerRegistry = createFixtureLayerRegistry(coordinateRegistry);
  const adapterRegistry = createProjectionAdapterRegistry();
  const adapter = createFixtureAdapter();
  const registration = adapterRegistry.register(adapter);
  if (!registration.ok) throw new Error("Wave 4E fixture adapter failed to register");
  const pipeline = createSpatialProjectionPipeline({
    adapterRegistry,
    coordinateRegistry,
    layerRegistry,
    clock: () => new Date(FIXTURE_NOW),
  });
  const records = Object.freeze(QUICK_MAP_PARITY_FIXTURE_RECORDS.map(toSourceRecord));
  const context = Object.freeze({ viewer: Object.freeze({ grantedLevels: Object.freeze([PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC]) }) });
  const clientResults = pipeline.projectForClient(records, context);
  const markerModels = createQuickMapClientAdapter().toMarkerModels(clientResults);
  const selectableFeatures = pipeline.clientSelectableFeatures(records, context);
  return Object.freeze({
    records,
    clientResults,
    markerModels,
    selectableFeatures,
    coordinateRegistry,
    layerRegistry,
    pipeline,
  });
}
