import { hashRegionalSceneAssetFamily, hashRegionalSceneGeometry } from "./regionalSceneGeometryHash.js";
import {
  REGIONAL_SCENE_COORDINATE_FAMILY,
  REGIONAL_SCENE_COORDINATE_SPACE,
} from "./regionalSceneCoordinate.js";
import { validateRegionalSceneContractMetadata, validateRegionalScenePolygon } from "./regionalSceneGeometryValidator.js";

export const OIL_RIG_ALIGNMENT_STANDARD_ID = "GEO-1_WAVE6C_OIL_RIG_ALIGNMENT_REPORT";
export const OIL_RIG_GEOMETRY_SOURCE_AUTHORITY = "silicon-heartland-metaverse-regional-geometry-registry";
export const OIL_RIG_APPROVED_GEOMETRY_HASH = "201e189ef24d2adb";
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

export function prepareOilRigDraftExport(draft) {
  const payload = { ...draft, geometryHash: hashRegionalSceneGeometry(draft?.geometry), status: "DRAFT" };
  const validation = validateOilRigDraft(payload);
  return validation.valid ? { payload, errors: [] } : { payload: null, errors: validation.errors };
}

export function createOilRigReviewArtifact(draft, { reviewedAt = new Date().toISOString() } = {}) {
  const validation = validateOilRigDraft(draft);
  if (!validation.valid || draft?.status !== "DRAFT") {
    return {
      review: null,
      errors: [...validation.errors, ...(draft?.status === "DRAFT" ? [] : ["only a DRAFT may enter REVIEW"])],
    };
  }
  const review = {
    ...structuredClone(draft),
    status: "REVIEW",
    provenance: {
      sourceAuthority: OIL_RIG_GEOMETRY_SOURCE_AUTHORITY,
      sourceDraftStatus: "DRAFT",
      sourceDraftGeometryHash: draft.geometryHash,
      reviewedAt,
    },
  };
  return { review, errors: [] };
}

export function validateOilRigReviewArtifact(review) {
  const errors = [];
  const base = validateOilRigDraft(review);
  errors.push(...base.errors);
  if (review?.status !== "REVIEW") errors.push("review artifact status must be REVIEW");
  if (review?.provenance?.sourceAuthority !== OIL_RIG_GEOMETRY_SOURCE_AUTHORITY) errors.push("review provenance source authority is invalid");
  if (review?.provenance?.sourceDraftStatus !== "DRAFT") errors.push("review must reference a DRAFT source");
  if (review?.provenance?.sourceDraftGeometryHash !== review?.geometryHash) errors.push("review source geometry hash does not match geometry hash");
  if (!review?.provenance?.reviewedAt || Number.isNaN(Date.parse(review.provenance.reviewedAt))) errors.push("reviewedAt must be an ISO timestamp");
  for (const field of ["approvedAt", "approvalActorId", "publicationState", "navigationAuthority"]) {
    if (Object.hasOwn(review || {}, field) || Object.hasOwn(review?.provenance || {}, field)) errors.push(`review must not contain ${field}`);
  }
  return { valid: errors.length === 0, errors };
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export function validateOilRigApprovedArtifact(approved) {
  const errors = [];
  const base = validateOilRigDraft(approved);
  errors.push(...base.errors);
  if (approved?.status !== "APPROVED") errors.push("approved artifact status must be APPROVED");
  if (approved?.geometryHash !== OIL_RIG_APPROVED_GEOMETRY_HASH) errors.push("approved artifact geometry hash is not the human-approved Oil Rig hash");
  if (approved?.provenance?.sourceAuthority !== OIL_RIG_GEOMETRY_SOURCE_AUTHORITY) errors.push("approved provenance source authority is invalid");
  if (approved?.provenance?.reviewedGeometryHash !== OIL_RIG_APPROVED_GEOMETRY_HASH) errors.push("approved provenance must reference reviewed geometry hash 201e189ef24d2adb");
  if (approved?.provenance?.sourceReviewStatus !== "REVIEW") errors.push("approved provenance must reference REVIEW source status");
  if (approved?.canonicalRegistryWrite !== "NONE") errors.push("approved artifact must not carry a canonical registry write");
  if (approved?.spatialEligibility !== "NONE") errors.push("approved artifact must not create Spatial eligibility");
  if (approved?.adapterImplementation !== "NOT_IMPLEMENTED") errors.push("approved artifact must not implement the Regional Spatial adapter");
  for (const field of ["approvalActorId", "reviewerId", "navigationAuthority", "nextScene", "traffic", "water", "transit"]) {
    if (Object.hasOwn(approved || {}, field) || Object.hasOwn(approved?.provenance || {}, field)) errors.push(`approved artifact must not contain ${field}`);
  }
  return { valid: errors.length === 0, errors };
}

export function parseOilRigReviewArtifact(input) {
  let review;
  try {
    review = typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    return { review: null, errors: ["input is not valid JSON"] };
  }
  const validation = validateOilRigReviewArtifact(review);
  return validation.valid ? { review, errors: [] } : { review: null, errors: validation.errors };
}

export function parseOilRigApprovedArtifact(input) {
  let approved;
  try {
    approved = typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    return { approved: null, errors: ["input is not valid JSON"] };
  }
  const validation = validateOilRigApprovedArtifact(approved);
  return validation.valid ? { approved: deepFreeze(structuredClone(approved)), errors: [] } : { approved: null, errors: validation.errors };
}

export function createDraftFromOilRigReview(review) {
  const validation = validateOilRigReviewArtifact(review);
  if (!validation.valid) return { draft: null, errors: validation.errors };
  return {
    draft: createOilRigDraft({
      geometry: structuredClone(review.geometry),
      authoringMetadata: { derivedFromStatus: "REVIEW", sourceDraftGeometryHash: review.geometryHash },
    }),
    errors: [],
  };
}

export function prepareOilRigApprovedExport(approved) {
  const parsed = parseOilRigApprovedArtifact(approved);
  if (!parsed.approved) return { payload: null, errors: parsed.errors };
  return { payload: parsed.approved, errors: [] };
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
