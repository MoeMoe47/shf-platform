import { hashRegionalSceneAssetFamily, hashRegionalSceneGeometry } from "./regionalSceneGeometryHash.js";
import {
  REGIONAL_SCENE_COORDINATE_FAMILY,
  REGIONAL_SCENE_COORDINATE_SPACE,
} from "./regionalSceneCoordinate.js";
import { validateRegionalSceneContractMetadata, validateRegionalScenePolygon } from "./regionalSceneGeometryValidator.js";

export const OIL_RIG_ALIGNMENT_STANDARD_ID = "GEO-1_WAVE6C_OIL_RIG_ALIGNMENT_REPORT";
export const OIL_RIG_ASSET_VARIANTS = Object.freeze({
  DAY: "3b5d111b624f365a26434f0bb99aebe82bdd0641ffece39992ca9b94b64d8608",
  DUSK: "882070509dac8430d61b6e82b9b52a9d679b80d8338c08069bf9509ec446d3f2",
  NIGHT: "f676c6c3dc430dcc80d078abd01358e7f9b8ad962da34da5ec1dd73c7dcc47f5",
});

export function createOilRigAssetFamily() {
  const assetFamilyHash = hashRegionalSceneAssetFamily({
    sceneId: "oil-rig",
    variants: OIL_RIG_ASSET_VARIANTS,
    alignmentStandard: OIL_RIG_ALIGNMENT_STANDARD_ID,
  });
  return {
    compositionFamilyId: `oil-rig-composition-family:${assetFamilyHash}`,
    assetFamilyHash,
    alignmentStatus: "ALIGNED_WITH_TOLERANCE",
    alignmentStandard: OIL_RIG_ALIGNMENT_STANDARD_ID,
    variants: OIL_RIG_ASSET_VARIANTS,
  };
}

export function createOilRigDraft({ geometry = { type: "Polygon", coordinates: [] }, authoringMetadata = {} } = {}) {
  const assetFamily = createOilRigAssetFamily();
  return {
    sceneId: "oil-rig",
    coordinateFamily: REGIONAL_SCENE_COORDINATE_FAMILY,
    coordinateSpace: REGIONAL_SCENE_COORDINATE_SPACE,
    geometryType: "Polygon",
    geometry,
    geometryHash: hashRegionalSceneGeometry(geometry),
    compositionFamilyId: assetFamily.compositionFamilyId,
    assetFamilyHash: assetFamily.assetFamilyHash,
    assetAlignment: assetFamily,
    authoringMetadata: { ...authoringMetadata },
    status: "DRAFT",
  };
}

export function validateOilRigDraft(draft) {
  const metadata = validateRegionalSceneContractMetadata(draft);
  const polygon = validateRegionalScenePolygon({ sceneId: draft?.sceneId, geometry: draft?.geometry });
  const errors = [...metadata.errors, ...polygon.errors];
  if (draft?.geometryHash !== hashRegionalSceneGeometry(draft?.geometry)) errors.push("geometryHash does not match geometry");
  if (draft?.status !== "DRAFT" && draft?.status !== "REVIEW" && draft?.status !== "APPROVED") errors.push("unsupported draft status");
  return { valid: errors.length === 0, errors };
}

export function parseOilRigDraft(input) {
  let draft;
  try {
    draft = typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    return { draft: null, errors: ["input is not valid JSON"] };
  }
  const result = validateOilRigDraft(draft);
  return result.valid ? { draft, errors: [] } : { draft: null, errors: result.errors };
}
