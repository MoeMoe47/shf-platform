import { getRegionalSceneBySlug } from "../regionalSceneRegistry.js";
import {
  createOilRigAssetFamily,
  OIL_RIG_APPROVED_GEOMETRY_HASH,
  OIL_RIG_GEOMETRY_SOURCE_AUTHORITY,
} from "./regionalSceneGeometryDraft.js";
import { hashRegionalSceneGeometry } from "./regionalSceneGeometryHash.js";
import {
  validateRegionalSceneContractMetadata,
  validateRegionalScenePolygon,
} from "./regionalSceneGeometryValidator.js";

export const REGIONAL_GEOMETRY_REGISTRY_SOURCE_AUTHORITY = OIL_RIG_GEOMETRY_SOURCE_AUTHORITY;
export const REGIONAL_GEOMETRY_APPROVED = "APPROVED";
export const REGIONAL_GEOMETRY_QUALIFIED = "QUALIFIED";
export const REGIONAL_GEOMETRY_ELIGIBLE = "ELIGIBLE";
export const REGIONAL_GEOMETRY_NOT_QUALIFIED = "NOT_QUALIFIED";
export const REGIONAL_GEOMETRY_NOT_ELIGIBLE = "NOT_ELIGIBLE";

export const OIL_RIG_APPROVED_REGIONAL_GEOMETRY = Object.freeze({
  sceneId: "oil-rig",
  sourceAuthority: REGIONAL_GEOMETRY_REGISTRY_SOURCE_AUTHORITY,
  coordinateFamily: "METAVERSE",
  coordinateSpace: "metaverse.regional-scene",
  geometryType: "Polygon",
  geometry: Object.freeze({
    type: "Polygon",
    coordinates: Object.freeze([
      Object.freeze([
        Object.freeze([95.52457739934192, 20.389571245573055]),
        Object.freeze([10.71207896918092, 20.775374877552558]),
        Object.freeze([9.104563835932987, 89.83422500188381]),
        Object.freeze([95.52457739934192, 89.73777409388893]),
        Object.freeze([95.52457739934192, 20.389571245573055]),
      ]),
    ]),
  }),
  geometryHash: OIL_RIG_APPROVED_GEOMETRY_HASH,
  compositionFamilyId: "oil-rig-composition-family:2088948cdc7ddcf6",
  assetFamilyHash: "2088948cdc7ddcf6",
  assetAlignment: Object.freeze({
    compositionFamilyId: "oil-rig-composition-family:2088948cdc7ddcf6",
    assetFamilyHash: "2088948cdc7ddcf6",
    alignmentStatus: "ALIGNED_WITH_TOLERANCE",
    alignmentStandard: "GEO-1_WAVE6C_OIL_RIG_ALIGNMENT_REPORT",
    variants: Object.freeze({
      DAY: "3b5d111b624f365a26434f0bb99aebe82bdd0641ffece39992ca9b94b64d8608",
      DUSK: "882070509dac8430d61b6e82b9b52a9d679b80d8338c08069bf9509ec446d3f2",
      NIGHT: "f676c6c3dc430dcc80d078abd01358e7f9b8ad962da34da5ec1dd73c7dcc47f5",
    }),
  }),
  lifecycle: REGIONAL_GEOMETRY_APPROVED,
  status: REGIONAL_GEOMETRY_APPROVED,
  approval: REGIONAL_GEOMETRY_APPROVED,
  provenance: Object.freeze({
    sourceAuthority: REGIONAL_GEOMETRY_REGISTRY_SOURCE_AUTHORITY,
    sourceDraftStatus: "DRAFT",
    sourceDraftGeometryHash: OIL_RIG_APPROVED_GEOMETRY_HASH,
    sourceReviewStatus: "REVIEW",
    reviewedGeometryHash: OIL_RIG_APPROVED_GEOMETRY_HASH,
    sourceApprovedStatus: REGIONAL_GEOMETRY_APPROVED,
    approvedGeometryHash: OIL_RIG_APPROVED_GEOMETRY_HASH,
    reviewedAt: "2026-09-29T12:00:00.000Z",
  }),
});

export const REGIONAL_GEOMETRY_REGISTRY = Object.freeze([
  OIL_RIG_APPROVED_REGIONAL_GEOMETRY,
]);

function clone(value) {
  return structuredClone(value);
}

function validateRegionalGeometryRegistryEntry(entry) {
  const errors = [];
  const scene = getRegionalSceneBySlug(entry?.sceneId);
  const assetFamily = createOilRigAssetFamily();
  const metadata = validateRegionalSceneContractMetadata(entry);
  const polygon = validateRegionalScenePolygon({
    sceneId: entry?.sceneId,
    geometry: entry?.geometry,
    implemented: Boolean(scene),
    publishable: Boolean(scene),
  });

  errors.push(...metadata.errors, ...polygon.errors);
  if (!scene) errors.push("sceneId is unknown or unimplemented");
  if (entry?.sourceAuthority !== REGIONAL_GEOMETRY_REGISTRY_SOURCE_AUTHORITY) errors.push("source authority mismatch");
  if (entry?.status !== REGIONAL_GEOMETRY_APPROVED || entry?.lifecycle !== REGIONAL_GEOMETRY_APPROVED || entry?.approval !== REGIONAL_GEOMETRY_APPROVED) {
    errors.push("registry geometry must be APPROVED");
  }
  if (entry?.geometryHash !== hashRegionalSceneGeometry(entry?.geometry)) errors.push("geometryHash does not match geometry");
  if (entry?.geometryHash !== OIL_RIG_APPROVED_GEOMETRY_HASH) errors.push("geometryHash is not the approved Oil Rig hash");
  if (entry?.compositionFamilyId !== assetFamily.compositionFamilyId) errors.push("compositionFamilyId mismatch");
  if (entry?.assetFamilyHash !== assetFamily.assetFamilyHash) errors.push("assetFamilyHash mismatch");
  if (entry?.assetAlignment?.alignmentStatus !== assetFamily.alignmentStatus) errors.push("alignmentStatus mismatch");
  if (entry?.assetAlignment?.alignmentStandard !== assetFamily.alignmentStandard) errors.push("alignmentStandard mismatch");
  if (JSON.stringify(entry?.assetAlignment?.variants) !== JSON.stringify(assetFamily.variants)) errors.push("asset variants mismatch");
  if (entry?.provenance?.sourceAuthority !== REGIONAL_GEOMETRY_REGISTRY_SOURCE_AUTHORITY) errors.push("provenance source authority mismatch");
  if (entry?.provenance?.reviewedGeometryHash !== OIL_RIG_APPROVED_GEOMETRY_HASH) errors.push("provenance reviewed geometry hash mismatch");
  if (entry?.provenance?.approvedGeometryHash !== OIL_RIG_APPROVED_GEOMETRY_HASH) errors.push("provenance approved geometry hash mismatch");
  if (entry?.provenance?.sourceReviewStatus !== "REVIEW") errors.push("provenance must reference REVIEW source status");
  for (const field of ["navigationAuthority", "nextScene", "previousScene", "traffic", "water", "transit", "emergencyGeometry", "publicationState"]) {
    if (Object.hasOwn(entry || {}, field) || Object.hasOwn(entry?.provenance || {}, field)) errors.push(`registry entry must not contain ${field}`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateRegionalGeometryRegistry(entries = REGIONAL_GEOMETRY_REGISTRY) {
  const errors = [];
  const seen = new Set();
  if (!Array.isArray(entries)) return { valid: false, errors: ["registry must be an array"] };
  for (const entry of entries) {
    const key = entry?.sceneId;
    if (seen.has(key)) errors.push(`duplicate regional geometry sceneId ${key}`);
    seen.add(key);
    errors.push(...validateRegionalGeometryRegistryEntry(entry).errors.map((error) => `${key || "unknown"}: ${error}`));
  }
  return { valid: errors.length === 0, errors };
}

export function getRegionalGeometryRegistryEntry(sceneId) {
  const entry = REGIONAL_GEOMETRY_REGISTRY.find((candidate) => candidate.sceneId === sceneId);
  return entry ? clone(entry) : null;
}

export function getRegionalGeometryQualification(sceneId) {
  const entry = getRegionalGeometryRegistryEntry(sceneId);
  if (!entry) return REGIONAL_GEOMETRY_NOT_QUALIFIED;
  return validateRegionalGeometryRegistryEntry(entry).valid ? REGIONAL_GEOMETRY_QUALIFIED : REGIONAL_GEOMETRY_NOT_QUALIFIED;
}

export function getRegionalSpatialEligibility(sceneId) {
  return getRegionalGeometryQualification(sceneId) === REGIONAL_GEOMETRY_QUALIFIED
    ? REGIONAL_GEOMETRY_ELIGIBLE
    : REGIONAL_GEOMETRY_NOT_ELIGIBLE;
}

export function isRegionalGeometryQualified(sceneId) {
  return getRegionalGeometryQualification(sceneId) === REGIONAL_GEOMETRY_QUALIFIED;
}

export function isRegionalSpatialEligible(sceneId) {
  return getRegionalSpatialEligibility(sceneId) === REGIONAL_GEOMETRY_ELIGIBLE;
}

export const __test__ = Object.freeze({
  validateRegionalGeometryRegistryEntry,
});
