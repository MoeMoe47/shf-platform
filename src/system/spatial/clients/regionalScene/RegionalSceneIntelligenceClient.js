import { resolveMetaverseDevModeEnabled } from "../../../metaverse/metaverseTimeOfDay.js";
import { getRegionalSceneBySlug } from "../../../metaverse/regionalSceneRegistry.js";
import { getRegionalGeometryRegistryEntry, getRegionalSpatialEligibility } from "../../../metaverse/regionalGeometry/regionalSceneGeometryRegistry.js";
import { createMetaverseRegionalSceneAdapter } from "../../adapters/metaverseRegionalSceneAdapter.js";
import { defaultCoordinateSpaceRegistry } from "../../../../shared/spatial/registries/defaultCoordinateSpaces.js";
import { createDefaultSpatialLayerRegistry } from "../../../../shared/spatial/registries/defaultLayers.js";
import { createProjectionAdapterRegistry, createSpatialProjectionPipeline } from "../../projection/index.js";
import { evaluateSpatialIntelligence, REASONING_CLASSES, sanitizeIntelligenceResult } from "../../intelligence/reasoning.js";

export const ALLOWED_CLIENT_REASONING_CLASSES = Object.freeze([
  "GEOMETRIC_FACT",
  "PRESENTATION_DERIVATION",
]);

const FIXTURE_NAME = "oil-rig-contains-point";
const OIL_RIG_SCENE_ID = "oil-rig";
const OIL_RIG_COORDINATE_SPACE = "metaverse.regional-scene";
const OIL_RIG_PROJECTED_AT = "2026-09-29T12:00:00.000Z";

function exactFixtureQuery(search) {
  const params = new URLSearchParams(search || "");
  return params.getAll("spatialIntelligenceFixture").length === 1
    && params.get("spatialIntelligenceFixture") === FIXTURE_NAME;
}

export function resolveRegionalSceneIntelligenceFixture({ isDev, sceneId, search } = {}) {
  if (!resolveMetaverseDevModeEnabled({ isDev, search })) return null;
  const params = new URLSearchParams(search || "");
  if (params.getAll("metaverseDev").length !== 1 || params.get("metaverseDev") !== "1") return null;
  if (sceneId !== OIL_RIG_SCENE_ID || !exactFixtureQuery(search)) return null;
  return Object.freeze({
    sceneId: OIL_RIG_SCENE_ID,
    geometryHash: "201e189ef24d2adb",
    coordinateSpace: OIL_RIG_COORDINATE_SPACE,
    fixture: FIXTURE_NAME,
  });
}

function createOilRigSourceRecord() {
  const scene = getRegionalSceneBySlug(OIL_RIG_SCENE_ID);
  const geometry = getRegionalGeometryRegistryEntry(OIL_RIG_SCENE_ID);
  if (!scene || !geometry || getRegionalSpatialEligibility(OIL_RIG_SCENE_ID) !== "ELIGIBLE") return null;
  return {
    domain: "metaverse-regional",
    featureType: "regional-scene",
    sourceAuthority: "silicon-heartland-metaverse-regional-scene-registry",
    sourceRecordId: scene.id,
    sceneId: scene.id,
    label: scene.title,
    coordinateFamily: "METAVERSE",
    coordinateSpaceId: OIL_RIG_COORDINATE_SPACE,
    implementationStatus: "IMPLEMENTED",
    publicationStatus: "PUBLIC_PRESENTATION",
    geometry: null,
    geometryType: geometry.geometryType,
    geometryHash: geometry.geometryHash,
    geometryLifecycle: geometry.lifecycle,
    compositionFamilyId: geometry.compositionFamilyId,
    assetFamilyHash: geometry.assetFamilyHash,
    geometryProvenance: geometry.provenance,
    provenance: {
      sourceAuthority: "silicon-heartland-metaverse-regional-scene-registry",
      sourceRecordId: scene.id,
      assetReference: scene.backgroundAsset.baseAsset,
      projectionVersion: "1",
    },
  };
}

function projectOilRigFeature() {
  const adapterRegistry = createProjectionAdapterRegistry();
  const adapter = createMetaverseRegionalSceneAdapter();
  if (!adapterRegistry.register(adapter).ok) return null;
  const pipeline = createSpatialProjectionPipeline({
    adapterRegistry,
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry: createDefaultSpatialLayerRegistry({ coordinateRegistry: defaultCoordinateSpaceRegistry }),
    clock: () => new Date(OIL_RIG_PROJECTED_AT),
  });
  const internal = pipeline.project(createOilRigSourceRecord(), { viewer: { grantedLevels: ["AUTHENTICATED"] } });
  return internal.status === "PROJECTED" || internal.status === "STALE" ? internal.feature : null;
}

function reasoningFeature(feature) {
  return {
    featureId: feature.featureId,
    sceneId: OIL_RIG_SCENE_ID,
    coordinateFamily: feature.coordinateFamily,
    coordinateSpace: feature.coordinateSpaceId,
    eligible: true,
    visibility: "PUBLIC",
    geometry: feature.geometry,
    provenance: {
      sourceRecordId: feature.sourceRecordId,
      geometryHash: feature.provenance?.geometryHash,
    },
  };
}

function oilRigReasoningRequest() {
  const feature = projectOilRigFeature();
  if (!feature) return null;
  return {
    operation: "RELATIONSHIP",
    reasoningClass: REASONING_CLASSES.GEOMETRIC_FACT,
    relationship: "CONTAINS",
    left: reasoningFeature(feature),
    right: {
      featureId: "spatial:metaverse-regional:point:fixture:scene-local-point",
      coordinateFamily: "METAVERSE",
      coordinateSpace: OIL_RIG_COORDINATE_SPACE,
      eligible: true,
      visibility: "PUBLIC",
      geometry: { type: "Point", coordinates: [50, 50] },
      provenance: { sourceRecordId: "scene-local-point" },
    },
    projectedAt: OIL_RIG_PROJECTED_AT,
    freshnessState: "CURRENT",
    evidenceReferences: [{
      sourceAuthority: "silicon-heartland-metaverse-regional-geometry-registry",
      sourceRecordId: OIL_RIG_SCENE_ID,
      projectionVersion: "1",
    }],
  };
}

export function requestRegionalSceneIntelligence(request = {}) {
  return evaluateSpatialIntelligence(request);
}

export function sanitizeRegionalSceneIntelligenceResult(result = {}) {
  const input = Array.isArray(result.evidenceSummary)
    ? { ...result, evidenceReferences: result.evidenceSummary }
    : result;
  const safe = sanitizeIntelligenceResult(input);
  if (safe.status === "RESTRICTED" || safe.status === "SUPPRESSED") return safe;
  return Object.freeze({
    ...safe,
    authorityBoundary: result.authorityBoundary,
  });
}

export function createRegionalSceneIntelligenceClient({ isDev, sceneId, search } = {}) {
  const fixture = resolveRegionalSceneIntelligenceFixture({ isDev, sceneId, search });
  return Object.freeze({
    getInspectionResult() {
      if (!fixture) return null;
      const request = oilRigReasoningRequest();
      if (!request) return null;
      return sanitizeRegionalSceneIntelligenceResult(requestRegionalSceneIntelligence(request));
    },
    activateInspection() {
      const result = this.getInspectionResult();
      return Object.freeze(result ? { ok: true, ...result } : { ok: false, status: "EMPTY" });
    },
  });
}
