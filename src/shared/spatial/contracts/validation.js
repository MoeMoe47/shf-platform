import {
  COORDINATE_FAMILY_VALUES,
  PUBLICATION_ELIGIBILITY_LEVELS,
  PUBLICATION_ELIGIBILITY_VALUES,
  SPATIAL_INTERACTION_TYPE_VALUES,
  SPATIAL_LAYER_LIFECYCLE_VALUES,
  SPATIAL_STATE_VALUES,
  TEMPORAL_STATE_VALUES,
  TRANSFORM_AVAILABILITY,
  VERIFICATION_STATE_VALUES,
} from "./constants.js";
import { isSpatialFeatureId } from "./featureIds.js";

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDateLike(value) {
  return hasText(value) && !Number.isNaN(Date.parse(value));
}

function result(errors) {
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

function requireText(errors, record, field) {
  if (!hasText(record?.[field])) errors.push(`${field} is required`);
}

function requireEnum(errors, record, field, values) {
  if (!values.includes(record?.[field])) errors.push(`${field} is invalid`);
}

export function validateSpatialProvenance(provenance) {
  const errors = [];
  if (!isObject(provenance)) return result(["provenance is required"]);
  for (const field of ["sourceAuthority", "sourceRecordId", "projectionAdapter", "projectionVersion", "updatedAt"]) {
    requireText(errors, provenance, field);
  }
  if (hasText(provenance.updatedAt) && !isIsoDateLike(provenance.updatedAt)) errors.push("updatedAt must be a valid timestamp");
  return result(errors);
}

export function validatePublicationEligibility(publicEligibility) {
  const errors = [];
  if (!isObject(publicEligibility)) return result(["publicEligibility is required"]);
  requireEnum(errors, publicEligibility, "level", PUBLICATION_ELIGIBILITY_VALUES);
  requireEnum(errors, publicEligibility, "publicationState", PUBLICATION_ELIGIBILITY_VALUES);
  return result(errors);
}

export function isPublicProjectionEligible(publicEligibility) {
  const validation = validatePublicationEligibility(publicEligibility);
  if (!validation.valid) return false;
  return publicEligibility.level === PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC && publicEligibility.publicationState === PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC;
}

export function validateCoordinateSpace(space) {
  const errors = [];
  if (!isObject(space)) return result(["coordinate space is required"]);
  for (const field of ["id", "family", "units", "origin", "axisOrientation", "boundsOrRange", "sourceAssetOrGeography", "transformAvailability", "version"]) {
    requireText(errors, space, field);
  }
  requireEnum(errors, space, "family", COORDINATE_FAMILY_VALUES);
  if (space.transformAvailability === TRANSFORM_AVAILABILITY.REGISTERED && !hasText(space.transformAuthority)) {
    errors.push("transformAuthority is required when transformAvailability is REGISTERED");
  }
  if (!isObject(space.provenance)) errors.push("provenance is required");
  return result(errors);
}

export function validateSpatialLayer(layer, coordinateRegistry) {
  const errors = [];
  if (!isObject(layer)) return result(["layer is required"]);
  for (const field of ["layerId", "name", "owningDomain", "sourceAuthority", "visibilityPolicy", "publicPrivateEligibility", "accessibilityBehavior", "lifecycleStatus"]) {
    requireText(errors, layer, field);
  }
  requireEnum(errors, layer, "lifecycleStatus", SPATIAL_LAYER_LIFECYCLE_VALUES);
  if (!Array.isArray(layer.supportedCoordinateSpaces) || layer.supportedCoordinateSpaces.length === 0) {
    errors.push("supportedCoordinateSpaces must contain at least one coordinate space id");
  } else if (coordinateRegistry) {
    for (const coordinateSpaceId of layer.supportedCoordinateSpaces) {
      if (!coordinateRegistry.has(coordinateSpaceId)) errors.push(`unsupported coordinate space: ${coordinateSpaceId}`);
    }
  }
  return result(errors);
}

export function validateTemporalProjection(temporalProjection) {
  const errors = [];
  if (!isObject(temporalProjection)) return result(["temporalProjection is required"]);
  requireEnum(errors, temporalProjection, "temporalState", TEMPORAL_STATE_VALUES);
  for (const field of ["sourceAuthority", "provenance"]) requireText(errors, temporalProjection, field);
  if (!isIsoDateLike(temporalProjection.sourceTimestamp)) errors.push("sourceTimestamp is required for temporal projection");
  for (const field of ["effectiveStart", "effectiveEnd"]) {
    if (temporalProjection[field] !== undefined && temporalProjection[field] !== null && !isIsoDateLike(temporalProjection[field])) {
      errors.push(`${field} must be a valid timestamp when provided`);
    }
  }
  return result(errors);
}

export function validateSpatialFeature(feature, { coordinateRegistry, layerRegistry } = {}) {
  const errors = [];
  if (!isObject(feature)) return result(["feature is required"]);
  for (const field of ["featureId", "featureType", "domain", "sourceAuthority", "sourceRecordId", "coordinateFamily", "coordinateSpaceId", "geometry", "layerId", "verificationState", "publicationState", "updatedAt"]) {
    requireText(errors, feature, field);
  }
  if (hasText(feature.featureId) && !isSpatialFeatureId(feature.featureId)) errors.push("featureId must use canonical spatial feature id format");
  requireEnum(errors, feature, "coordinateFamily", COORDINATE_FAMILY_VALUES);
  requireEnum(errors, feature, "verificationState", VERIFICATION_STATE_VALUES);
  requireEnum(errors, feature, "publicationState", PUBLICATION_ELIGIBILITY_VALUES);
  if (feature.state !== undefined) requireEnum(errors, feature, "state", SPATIAL_STATE_VALUES);
  if (!isIsoDateLike(feature.updatedAt)) errors.push("updatedAt must be a valid timestamp");
  if (!Array.isArray(feature.allowedInteractions)) errors.push("allowedInteractions must be an array");
  if (!Array.isArray(feature.authorizedActionReferences)) errors.push("authorizedActionReferences must be an array");

  const provenanceValidation = validateSpatialProvenance(feature.provenance);
  errors.push(...provenanceValidation.errors.map((error) => `provenance.${error}`));
  const publicationValidation = validatePublicationEligibility(feature.publicEligibility);
  errors.push(...publicationValidation.errors.map((error) => `publicEligibility.${error}`));

  if (coordinateRegistry && hasText(feature.coordinateSpaceId)) {
    const spaceResult = coordinateRegistry.get(feature.coordinateSpaceId, { expectedFamily: feature.coordinateFamily });
    if (!spaceResult.ok) errors.push(spaceResult.error);
  }
  if (layerRegistry && hasText(feature.layerId)) {
    const layerResult = layerRegistry.get(feature.layerId);
    if (!layerResult.ok) {
      errors.push(layerResult.error);
    } else if (!layerResult.layer.supportedCoordinateSpaces.includes(feature.coordinateSpaceId)) {
      errors.push(`layer ${feature.layerId} does not support coordinate space ${feature.coordinateSpaceId}`);
    }
  }

  return result(errors);
}

export function validateSpatialSelection(selection, { coordinateRegistry, layerRegistry } = {}) {
  const errors = [];
  if (!isObject(selection)) return result(["selection is required"]);
  for (const field of ["selectionId", "featureId", "domain", "sourceAuthority", "coordinateFamily", "coordinateSpaceId", "layerId", "selectionReason", "timestamp"]) {
    requireText(errors, selection, field);
  }
  requireEnum(errors, selection, "coordinateFamily", COORDINATE_FAMILY_VALUES);
  if (!isIsoDateLike(selection.timestamp)) errors.push("timestamp must be a valid timestamp");
  if (!Array.isArray(selection.eligibleActions)) errors.push("eligibleActions must be an array");
  if (coordinateRegistry && hasText(selection.coordinateSpaceId)) {
    const spaceResult = coordinateRegistry.get(selection.coordinateSpaceId, { expectedFamily: selection.coordinateFamily });
    if (!spaceResult.ok) errors.push(spaceResult.error);
  }
  if (layerRegistry && hasText(selection.layerId) && !layerRegistry.has(selection.layerId)) errors.push(`unknown layer: ${selection.layerId}`);
  return result(errors);
}

export function validateSpatialInteraction(interaction) {
  const errors = [];
  if (!isObject(interaction)) return result(["interaction is required"]);
  for (const field of ["interactionId", "type", "timestamp", "publisherId", "domain", "sourceAuthority", "correlationId"]) {
    requireText(errors, interaction, field);
  }
  requireEnum(errors, interaction, "type", SPATIAL_INTERACTION_TYPE_VALUES);
  if (!isIsoDateLike(interaction.timestamp)) errors.push("timestamp must be a valid timestamp");
  if (interaction.coordinateFamily !== undefined) requireEnum(errors, interaction, "coordinateFamily", COORDINATE_FAMILY_VALUES);
  return result(errors);
}
