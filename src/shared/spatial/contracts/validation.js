import {
  COORDINATE_FAMILY_VALUES,
  PUBLICATION_ELIGIBILITY_LEVELS,
  PUBLICATION_ELIGIBILITY_VALUES,
  SPATIAL_INTERACTION_TYPE_VALUES,
  SPATIAL_LAYER_LIFECYCLE_VALUES,
  SPATIAL_LAYER_MASK_MODE_VALUES,
  SPATIAL_LAYER_STALE_POLICY_VALUES,
  SPATIAL_STATE_VALUES,
  TEMPORAL_STATE_VALUES,
  TRANSFORM_AVAILABILITY,
  VALIDATION_ISSUE_CODES as CODES,
  VERIFICATION_STATE_VALUES,
} from "./constants.js";
import { parseSpatialDurationMs } from "./duration.js";
import { isSpatialFeatureId } from "./featureIds.js";

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function finitePosition(position) {
  return Array.isArray(position)
    && position.length >= 2
    && Number.isFinite(position[0])
    && Number.isFinite(position[1])
    && position[0] >= -180
    && position[0] <= 180
    && position[1] >= -90
    && position[1] <= 90;
}

function validRing(ring) {
  return Array.isArray(ring) && ring.length >= 4 && ring.every(finitePosition);
}

function validGeometryObject(value) {
  if (!isObject(value)) return false;
  if (value.type === "Polygon") return Array.isArray(value.coordinates) && value.coordinates.length > 0 && value.coordinates.every(validRing);
  if (value.type === "MultiPolygon") {
    return Array.isArray(value.coordinates)
      && value.coordinates.length > 0
      && value.coordinates.every((polygon) => Array.isArray(polygon) && polygon.length > 0 && polygon.every(validRing));
  }
  return false;
}

function hasGeometry(value) {
  return hasText(value) || validGeometryObject(value);
}

function isIsoDateLike(value) {
  return hasText(value) && !Number.isNaN(Date.parse(value));
}

// Structured issue (GEO1-WAVE3B-DEC-010). `message` is the legacy error string, unchanged.
function issue(code, field, message, details) {
  return Object.freeze(details ? { code, field, message, details: Object.freeze({ ...details }) } : { code, field, message });
}

// `errors` is derived from `issues`, so the two are always the same length and order.
function result(issues) {
  return Object.freeze({
    valid: issues.length === 0,
    errors: Object.freeze(issues.map((entry) => entry.message)),
    issues: Object.freeze([...issues]),
  });
}

function requireText(issues, record, field, code = CODES.FIELD_REQUIRED) {
  if (!hasText(record?.[field])) issues.push(issue(code, field, `${field} is required`));
}

function requireEnum(issues, record, field, values, code = CODES.FIELD_INVALID_ENUM) {
  if (!values.includes(record?.[field])) issues.push(issue(code, field, `${field} is invalid`));
}

// Re-homes a nested validator's issues under `prefix`, preserving the legacy `${prefix}.${error}` message.
function nestIssues(prefix, nestedIssues) {
  return nestedIssues.map((entry) =>
    issue(entry.code, entry.field ? `${prefix}.${entry.field}` : prefix, `${prefix}.${entry.message}`, entry.details),
  );
}

function coordinateSpaceIssue(coordinateRegistry, record) {
  const spaceResult = coordinateRegistry.get(record.coordinateSpaceId, { expectedFamily: record.coordinateFamily });
  if (spaceResult.ok) return null;
  const known = coordinateRegistry.has(record.coordinateSpaceId);
  if (!known) return issue(CODES.UNKNOWN_COORDINATE_SPACE, "coordinateSpaceId", spaceResult.error);
  const received = coordinateRegistry.get(record.coordinateSpaceId).space?.family;
  return issue(CODES.COORDINATE_FAMILY_MISMATCH, "coordinateSpaceId", spaceResult.error, {
    expectedCoordinateFamily: record.coordinateFamily,
    receivedCoordinateFamily: received,
  });
}

export function validateSpatialProvenance(provenance) {
  const issues = [];
  if (!isObject(provenance)) return result([issue(CODES.PROVENANCE_REQUIRED, null, "provenance is required")]);
  for (const field of ["sourceAuthority", "sourceRecordId", "projectionAdapter", "projectionVersion", "updatedAt"]) {
    requireText(issues, provenance, field, CODES.PROVENANCE_FIELD_REQUIRED);
  }
  if (hasText(provenance.updatedAt) && !isIsoDateLike(provenance.updatedAt)) {
    issues.push(issue(CODES.PROVENANCE_TIMESTAMP_INVALID, "updatedAt", "updatedAt must be a valid timestamp"));
  }
  return result(issues);
}

export function validatePublicationEligibility(publicEligibility) {
  const issues = [];
  if (!isObject(publicEligibility)) return result([issue(CODES.PUBLICATION_ELIGIBILITY_REQUIRED, null, "publicEligibility is required")]);
  requireEnum(issues, publicEligibility, "level", PUBLICATION_ELIGIBILITY_VALUES, CODES.PUBLICATION_ELIGIBILITY_INVALID);
  requireEnum(issues, publicEligibility, "publicationState", PUBLICATION_ELIGIBILITY_VALUES, CODES.PUBLICATION_ELIGIBILITY_INVALID);
  return result(issues);
}

export function isPublicProjectionEligible(publicEligibility) {
  const validation = validatePublicationEligibility(publicEligibility);
  if (!validation.valid) return false;
  return publicEligibility.level === PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC && publicEligibility.publicationState === PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC;
}

export function validateCoordinateSpace(space) {
  const issues = [];
  if (!isObject(space)) return result([issue(CODES.OBJECT_REQUIRED, null, "coordinate space is required")]);
  for (const field of ["id", "family", "units", "origin", "axisOrientation", "boundsOrRange", "sourceAssetOrGeography", "transformAvailability", "version"]) {
    requireText(issues, space, field);
  }
  requireEnum(issues, space, "family", COORDINATE_FAMILY_VALUES);
  if (space.transformAvailability === TRANSFORM_AVAILABILITY.REGISTERED && !hasText(space.transformAuthority)) {
    issues.push(issue(CODES.TRANSFORM_AUTHORITY_REQUIRED, "transformAuthority", "transformAuthority is required when transformAvailability is REGISTERED"));
  }
  if (!isObject(space.provenance)) issues.push(issue(CODES.PROVENANCE_REQUIRED, "provenance", "provenance is required"));
  return result(issues);
}

// Wave 3B layer policy fields (GEO1-WAVE3B-DEC-015). All optional; absence has a defined safe default.
function layerPolicyIssues(layer) {
  const issues = [];
  const policyIssue = (field, message) => issues.push(issue(CODES.LAYER_POLICY_INVALID, field, message));
  const durationMessage = (field) => `${field} must be a positive ISO 8601 duration using days, hours, minutes, or seconds`;

  if (layer.stalePolicy !== undefined && !SPATIAL_LAYER_STALE_POLICY_VALUES.includes(layer.stalePolicy)) {
    policyIssue("stalePolicy", "stalePolicy is invalid");
  }
  if (layer.maskMode !== undefined && !SPATIAL_LAYER_MASK_MODE_VALUES.includes(layer.maskMode)) {
    policyIssue("maskMode", "maskMode is invalid");
  }
  if (layer.maxSourceAge !== undefined) {
    if (parseSpatialDurationMs(layer.maxSourceAge) === null) policyIssue("maxSourceAge", durationMessage("maxSourceAge"));
    if (!hasText(layer.freshnessAuthority)) policyIssue("freshnessAuthority", "freshnessAuthority is required when maxSourceAge is present");
  }
  if (layer.soonThreshold !== undefined) {
    if (parseSpatialDurationMs(layer.soonThreshold) === null) policyIssue("soonThreshold", durationMessage("soonThreshold"));
    if (layer.timeAwareCapability !== true) policyIssue("soonThreshold", "soonThreshold requires timeAwareCapability");
    if (!hasText(layer.soonThresholdAuthority)) policyIssue("soonThresholdAuthority", "soonThresholdAuthority is required when soonThreshold is present");
  }
  return issues;
}

export function validateSpatialLayer(layer, coordinateRegistry) {
  const issues = [];
  if (!isObject(layer)) return result([issue(CODES.OBJECT_REQUIRED, null, "layer is required")]);
  for (const field of ["layerId", "name", "owningDomain", "sourceAuthority", "visibilityPolicy", "publicPrivateEligibility", "accessibilityBehavior", "lifecycleStatus"]) {
    requireText(issues, layer, field);
  }
  requireEnum(issues, layer, "lifecycleStatus", SPATIAL_LAYER_LIFECYCLE_VALUES);
  if (!Array.isArray(layer.supportedCoordinateSpaces) || layer.supportedCoordinateSpaces.length === 0) {
    issues.push(issue(CODES.FIELD_INVALID_TYPE, "supportedCoordinateSpaces", "supportedCoordinateSpaces must contain at least one coordinate space id"));
  } else if (coordinateRegistry) {
    for (const coordinateSpaceId of layer.supportedCoordinateSpaces) {
      if (!coordinateRegistry.has(coordinateSpaceId)) {
        issues.push(issue(CODES.UNSUPPORTED_COORDINATE_SPACE, "supportedCoordinateSpaces", `unsupported coordinate space: ${coordinateSpaceId}`));
      }
    }
  }
  issues.push(...layerPolicyIssues(layer));
  return result(issues);
}

export function validateTemporalProjection(temporalProjection) {
  const issues = [];
  if (!isObject(temporalProjection)) return result([issue(CODES.OBJECT_REQUIRED, null, "temporalProjection is required")]);
  requireEnum(issues, temporalProjection, "temporalState", TEMPORAL_STATE_VALUES);
  requireText(issues, temporalProjection, "sourceAuthority");
  requireText(issues, temporalProjection, "provenance", CODES.PROVENANCE_REQUIRED);
  if (!isIsoDateLike(temporalProjection.sourceTimestamp)) {
    issues.push(issue(CODES.FIELD_INVALID_TIMESTAMP, "sourceTimestamp", "sourceTimestamp is required for temporal projection"));
  }
  for (const field of ["effectiveStart", "effectiveEnd"]) {
    if (temporalProjection[field] !== undefined && temporalProjection[field] !== null && !isIsoDateLike(temporalProjection[field])) {
      issues.push(issue(CODES.FIELD_INVALID_TIMESTAMP, field, `${field} must be a valid timestamp when provided`));
    }
  }
  return result(issues);
}

export function validateSpatialFeature(feature, { coordinateRegistry, layerRegistry } = {}) {
  const issues = [];
  if (!isObject(feature)) return result([issue(CODES.OBJECT_REQUIRED, null, "feature is required")]);
  for (const field of ["featureId", "featureType", "domain", "sourceAuthority", "sourceRecordId", "coordinateFamily", "coordinateSpaceId", "layerId", "verificationState", "publicationState", "updatedAt"]) {
    requireText(issues, feature, field);
  }
  if (!hasGeometry(feature.geometry)) issues.push(issue(CODES.FIELD_REQUIRED, "geometry", "geometry is required"));
  if (hasText(feature.featureId) && !isSpatialFeatureId(feature.featureId)) {
    issues.push(issue(CODES.FEATURE_ID_INVALID_FORMAT, "featureId", "featureId must use canonical spatial feature id format"));
  }
  requireEnum(issues, feature, "coordinateFamily", COORDINATE_FAMILY_VALUES);
  requireEnum(issues, feature, "verificationState", VERIFICATION_STATE_VALUES);
  requireEnum(issues, feature, "publicationState", PUBLICATION_ELIGIBILITY_VALUES);
  if (feature.state !== undefined) requireEnum(issues, feature, "state", SPATIAL_STATE_VALUES);
  if (!isIsoDateLike(feature.updatedAt)) issues.push(issue(CODES.FIELD_INVALID_TIMESTAMP, "updatedAt", "updatedAt must be a valid timestamp"));
  if (!Array.isArray(feature.allowedInteractions)) issues.push(issue(CODES.FIELD_INVALID_TYPE, "allowedInteractions", "allowedInteractions must be an array"));
  if (!Array.isArray(feature.authorizedActionReferences)) {
    issues.push(issue(CODES.FIELD_INVALID_TYPE, "authorizedActionReferences", "authorizedActionReferences must be an array"));
  }

  issues.push(...nestIssues("provenance", validateSpatialProvenance(feature.provenance).issues));
  issues.push(...nestIssues("publicEligibility", validatePublicationEligibility(feature.publicEligibility).issues));

  if (coordinateRegistry && hasText(feature.coordinateSpaceId)) {
    const spaceIssue = coordinateSpaceIssue(coordinateRegistry, feature);
    if (spaceIssue) issues.push(spaceIssue);
  }
  if (layerRegistry && hasText(feature.layerId)) {
    const layerResult = layerRegistry.get(feature.layerId);
    if (!layerResult.ok) {
      issues.push(issue(CODES.UNKNOWN_LAYER, "layerId", layerResult.error));
    } else if (!layerResult.layer.supportedCoordinateSpaces.includes(feature.coordinateSpaceId)) {
      issues.push(issue(CODES.LAYER_COORDINATE_SPACE_UNSUPPORTED, "layerId", `layer ${feature.layerId} does not support coordinate space ${feature.coordinateSpaceId}`));
    }
  }

  return result(issues);
}

export function validateSpatialSelection(selection, { coordinateRegistry, layerRegistry } = {}) {
  const issues = [];
  if (!isObject(selection)) return result([issue(CODES.OBJECT_REQUIRED, null, "selection is required")]);
  for (const field of ["selectionId", "featureId", "domain", "sourceAuthority", "coordinateFamily", "coordinateSpaceId", "layerId", "selectionReason", "timestamp"]) {
    requireText(issues, selection, field);
  }
  requireEnum(issues, selection, "coordinateFamily", COORDINATE_FAMILY_VALUES);
  if (!isIsoDateLike(selection.timestamp)) issues.push(issue(CODES.FIELD_INVALID_TIMESTAMP, "timestamp", "timestamp must be a valid timestamp"));
  if (!Array.isArray(selection.eligibleActions)) issues.push(issue(CODES.FIELD_INVALID_TYPE, "eligibleActions", "eligibleActions must be an array"));
  if (coordinateRegistry && hasText(selection.coordinateSpaceId)) {
    const spaceIssue = coordinateSpaceIssue(coordinateRegistry, selection);
    if (spaceIssue) issues.push(spaceIssue);
  }
  if (layerRegistry && hasText(selection.layerId) && !layerRegistry.has(selection.layerId)) {
    issues.push(issue(CODES.UNKNOWN_LAYER, "layerId", `unknown layer: ${selection.layerId}`));
  }
  return result(issues);
}

export function validateSpatialInteraction(interaction) {
  const issues = [];
  if (!isObject(interaction)) return result([issue(CODES.OBJECT_REQUIRED, null, "interaction is required")]);
  for (const field of ["interactionId", "type", "timestamp", "publisherId", "domain", "sourceAuthority", "correlationId"]) {
    requireText(issues, interaction, field);
  }
  requireEnum(issues, interaction, "type", SPATIAL_INTERACTION_TYPE_VALUES);
  if (!isIsoDateLike(interaction.timestamp)) issues.push(issue(CODES.FIELD_INVALID_TIMESTAMP, "timestamp", "timestamp must be a valid timestamp"));
  if (interaction.coordinateFamily !== undefined) requireEnum(issues, interaction, "coordinateFamily", COORDINATE_FAMILY_VALUES);
  return result(issues);
}
