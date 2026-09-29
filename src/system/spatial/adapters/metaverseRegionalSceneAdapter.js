import {
  COORDINATE_FAMILIES,
  PUBLICATION_ELIGIBILITY_LEVELS,
  VERIFICATION_STATES,
} from "../../../shared/spatial/index.js";
import { createSpatialFeatureId } from "../../../shared/spatial/contracts/featureIds.js";
import { getRegionalSceneBySlug } from "../../metaverse/regionalSceneRegistry.js";
import {
  OIL_RIG_APPROVED_REGIONAL_GEOMETRY,
  REGIONAL_GEOMETRY_APPROVED,
  REGIONAL_GEOMETRY_ELIGIBLE,
  REGIONAL_GEOMETRY_QUALIFIED,
  REGIONAL_GEOMETRY_REGISTRY_SOURCE_AUTHORITY,
  getRegionalGeometryQualification,
  getRegionalGeometryRegistryEntry,
  getRegionalSpatialEligibility,
} from "../../metaverse/regionalGeometry/regionalSceneGeometryRegistry.js";
import { hashRegionalSceneGeometry } from "../../metaverse/regionalGeometry/regionalSceneGeometryHash.js";

export const METAVERSE_REGIONAL_SCENE_DOMAIN = "metaverse-regional";
export const METAVERSE_REGIONAL_SCENE_FEATURE_TYPE = "regional-scene";
export const METAVERSE_REGIONAL_SCENE_SOURCE_AUTHORITY = "silicon-heartland-metaverse-regional-scene-registry";
export const METAVERSE_REGIONAL_SCENE_COORDINATE_SPACE = "metaverse.regional-scene";
export const METAVERSE_REGIONAL_SCENE_LAYER_ID = "metaverse.regional-scenes";
export const METAVERSE_REGIONAL_SCENE_PROJECTION_VERSION = "1";
export const METAVERSE_REGIONAL_SCENE_ADAPTER_ID = "metaverse-regional-scene";

const APPROVED_GEOMETRY_HASH = OIL_RIG_APPROVED_REGIONAL_GEOMETRY.geometryHash;
const UPDATED_AT = OIL_RIG_APPROVED_REGIONAL_GEOMETRY.provenance.reviewedAt;

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function clone(value) {
  return structuredClone(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sameOrAbsent(value, expected) {
  return value === undefined || value === null || value === expected;
}

function sceneIdFrom(record) {
  return hasText(record?.sceneId) ? record.sceneId : record?.sourceRecordId;
}

function implementedScene(record) {
  const sceneId = sceneIdFrom(record);
  const scene = hasText(sceneId) ? getRegionalSceneBySlug(sceneId) : null;
  if (!scene || scene.id !== sceneId) return null;
  if (record?.implementationStatus !== undefined && record.implementationStatus !== "IMPLEMENTED") return null;
  return scene;
}

function validSceneProvenance(record, scene) {
  const provenance = record?.provenance;
  return Boolean(
    provenance
    && provenance.sourceAuthority === METAVERSE_REGIONAL_SCENE_SOURCE_AUTHORITY
    && provenance.sourceRecordId === scene.id
    && provenance.projectionVersion === METAVERSE_REGIONAL_SCENE_PROJECTION_VERSION,
  );
}

function validRegistryEntry(entry) {
  return Boolean(
    entry
    && entry.sceneId === "oil-rig"
    && entry.sourceAuthority === REGIONAL_GEOMETRY_REGISTRY_SOURCE_AUTHORITY
    && entry.coordinateFamily === COORDINATE_FAMILIES.METAVERSE
    && entry.coordinateSpace === METAVERSE_REGIONAL_SCENE_COORDINATE_SPACE
    && entry.geometryType === "Polygon"
    && entry.lifecycle === REGIONAL_GEOMETRY_APPROVED
    && entry.status === REGIONAL_GEOMETRY_APPROVED
    && entry.approval === REGIONAL_GEOMETRY_APPROVED
    && entry.geometryHash === APPROVED_GEOMETRY_HASH
    && entry.geometryHash === hashRegionalSceneGeometry(entry.geometry)
    && getRegionalGeometryQualification(entry.sceneId) === REGIONAL_GEOMETRY_QUALIFIED
    && getRegionalSpatialEligibility(entry.sceneId) === REGIONAL_GEOMETRY_ELIGIBLE
    && entry.compositionFamilyId === OIL_RIG_APPROVED_REGIONAL_GEOMETRY.compositionFamilyId
    && entry.assetFamilyHash === OIL_RIG_APPROVED_REGIONAL_GEOMETRY.assetFamilyHash
    && JSON.stringify(entry.assetAlignment) === JSON.stringify(OIL_RIG_APPROVED_REGIONAL_GEOMETRY.assetAlignment)
    && entry.provenance?.sourceAuthority === REGIONAL_GEOMETRY_REGISTRY_SOURCE_AUTHORITY
    && entry.provenance?.sourceDraftGeometryHash === entry.geometryHash
    && entry.provenance?.reviewedGeometryHash === entry.geometryHash
    && entry.provenance?.approvedGeometryHash === entry.geometryHash
    && entry.provenance?.sourceReviewStatus === "REVIEW"
    && entry.provenance?.sourceApprovedStatus === REGIONAL_GEOMETRY_APPROVED
  );
}

function recordMatchesApprovedGeometry(record, entry) {
  return Boolean(
    record?.geometry === undefined || record.geometry === null,
  )
    && sameOrAbsent(record?.geometryHash, entry.geometryHash)
    && sameOrAbsent(record?.geometryType, entry.geometryType)
    && sameOrAbsent(record?.geometryLifecycle, REGIONAL_GEOMETRY_APPROVED)
    && sameOrAbsent(record?.lifecycle, REGIONAL_GEOMETRY_APPROVED)
    && sameOrAbsent(record?.status, REGIONAL_GEOMETRY_APPROVED)
    && sameOrAbsent(record?.approval, REGIONAL_GEOMETRY_APPROVED)
    && sameOrAbsent(record?.coordinateFamily, COORDINATE_FAMILIES.METAVERSE)
    && sameOrAbsent(record?.coordinateSpaceId, METAVERSE_REGIONAL_SCENE_COORDINATE_SPACE)
    && sameOrAbsent(record?.coordinateSpace, METAVERSE_REGIONAL_SCENE_COORDINATE_SPACE)
    && sameOrAbsent(record?.compositionFamilyId, entry.compositionFamilyId)
    && sameOrAbsent(record?.assetFamilyHash, entry.assetFamilyHash)
    && sameOrAbsent(record?.geometryProvenance?.sourceAuthority, entry.provenance.sourceAuthority)
    && sameOrAbsent(record?.geometryProvenance?.reviewedGeometryHash, entry.geometryHash)
    && sameOrAbsent(record?.geometryProvenance?.approvedGeometryHash, entry.geometryHash);
}

function sourceRecordIsEligible(record) {
  const scene = implementedScene(record);
  if (!scene) return false;
  if (record?.domain !== undefined && record.domain !== METAVERSE_REGIONAL_SCENE_DOMAIN) return false;
  if (record?.featureType !== undefined && record.featureType !== METAVERSE_REGIONAL_SCENE_FEATURE_TYPE) return false;
  if (record?.sourceAuthority !== undefined && record.sourceAuthority !== METAVERSE_REGIONAL_SCENE_SOURCE_AUTHORITY) return false;
  if (record?.sourceRecordId !== undefined && record.sourceRecordId !== scene.id) return false;
  if (!validSceneProvenance(record, scene)) return false;
  const entry = getRegionalGeometryRegistryEntry(scene.id);
  return validRegistryEntry(entry) && recordMatchesApprovedGeometry(record, entry);
}

export function createMetaverseRegionalSceneAdapter() {
  return Object.freeze({
    getDomain: () => METAVERSE_REGIONAL_SCENE_DOMAIN,
    getSourceAuthority: () => METAVERSE_REGIONAL_SCENE_SOURCE_AUTHORITY,
    getSupportedFeatureTypes: () => [METAVERSE_REGIONAL_SCENE_FEATURE_TYPE],
    getSupportedCoordinateFamilies: () => [COORDINATE_FAMILIES.METAVERSE],
    getSupportedCoordinateSpaces: () => [METAVERSE_REGIONAL_SCENE_COORDINATE_SPACE],
    getProjectionVersion: () => METAVERSE_REGIONAL_SCENE_PROJECTION_VERSION,
    sourceRecordId(record) {
      const scene = implementedScene(record);
      return scene?.id || null;
    },
    featureId(sceneId) {
      return createSpatialFeatureId({
        domain: METAVERSE_REGIONAL_SCENE_DOMAIN,
        featureType: METAVERSE_REGIONAL_SCENE_FEATURE_TYPE,
        sourceAuthority: METAVERSE_REGIONAL_SCENE_SOURCE_AUTHORITY,
        sourceRecordId: sceneId,
      });
    },
    isEligible(record) {
      return sourceRecordIsEligible(record);
    },
    canProject(record) {
      return sourceRecordIsEligible(record);
    },
    project(record) {
      if (!sourceRecordIsEligible(record)) {
        throw new Error("Metaverse regional scene record is not eligible for Spatial projection");
      }

      const scene = implementedScene(record);
      const entry = getRegionalGeometryRegistryEntry(scene.id);
      const sourceRecordId = scene.id;
      const featureId = this.featureId(sourceRecordId);
      const provenance = {
        sourceAuthority: METAVERSE_REGIONAL_SCENE_SOURCE_AUTHORITY,
        sourceRecordId,
        projectionAdapter: METAVERSE_REGIONAL_SCENE_ADAPTER_ID,
        projectionVersion: METAVERSE_REGIONAL_SCENE_PROJECTION_VERSION,
        updatedAt: UPDATED_AT,
        verificationState: VERIFICATION_STATES.VERIFIED,
        publicationState: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
        geometryAuthority: REGIONAL_GEOMETRY_REGISTRY_SOURCE_AUTHORITY,
        geometryHash: entry.geometryHash,
        geometryQualification: REGIONAL_GEOMETRY_QUALIFIED,
        spatialEligibility: REGIONAL_GEOMETRY_ELIGIBLE,
        coordinateProvenance: METAVERSE_REGIONAL_SCENE_COORDINATE_SPACE,
      };

      return deepFreeze({
        featureId,
        featureType: METAVERSE_REGIONAL_SCENE_FEATURE_TYPE,
        domain: METAVERSE_REGIONAL_SCENE_DOMAIN,
        sourceAuthority: METAVERSE_REGIONAL_SCENE_SOURCE_AUTHORITY,
        sourceRecordId,
        coordinateFamily: COORDINATE_FAMILIES.METAVERSE,
        coordinateSpaceId: METAVERSE_REGIONAL_SCENE_COORDINATE_SPACE,
        geometry: clone(entry.geometry),
        layerId: METAVERSE_REGIONAL_SCENE_LAYER_ID,
        title: scene.title,
        label: scene.title,
        description: scene.educationalContext?.summary || scene.description,
        verificationState: VERIFICATION_STATES.VERIFIED,
        publicationState: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
        publicEligibility: {
          level: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
          publicationState: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
        },
        provenance,
        updatedAt: UPDATED_AT,
        allowedInteractions: ["SELECT", "FOCUS", "HIGHLIGHT"],
        authorizedActionReferences: [],
        accessibility: {
          label: `${scene.title} regional scene`,
          stateText: "Available",
          keyboardInteractions: ["SELECT"],
        },
      });
    },
  });
}
