import {
  COORDINATE_FAMILIES,
  PUBLICATION_ELIGIBILITY_LEVELS,
  SPATIAL_LAYER_LIFECYCLE_STATUS,
  validateSpatialFeature,
} from "../../../shared/spatial/index.js";
import { createSpatialFeatureId } from "../../../shared/spatial/contracts/featureIds.js";
import { createProjectionDiagnostic, clientDiagnostic, PROJECTION_DIAGNOSTIC_CATALOG } from "./diagnostics.js";
import { evaluateFreshness } from "./freshness.js";
import { resolvePresentationState, DOMAIN_STATES } from "./presentationStateResolver.js";
import { evaluateTemporal } from "./temporal.js";

export const PRODUCTION_EMERGENCY_AUTHORITIES = Object.freeze([]);

const LEVELS = Object.values(PUBLICATION_ELIGIBILITY_LEVELS);
const LIFECYCLE_UNAVAILABLE = new Set([
  SPATIAL_LAYER_LIFECYCLE_STATUS.DISCONNECTED,
  SPATIAL_LAYER_LIFECYCLE_STATUS.UNMOUNTED,
  SPATIAL_LAYER_LIFECYCLE_STATUS.ARCHIVED,
]);
const FEATURE_ALLOWLIST = [
  "allowedInteractions", "coordinateFamily", "coordinateSpaceId", "description", "domain", "featureId", "featureType",
  "geometry", "position", "label", "layerId", "provenance", "publicEligibility", "publicationState", "sourceAuthority",
  "sourceRecordId", "title", "updatedAt", "verificationState",
];
const UNAVAILABLE_ALLOWLIST = [
  "allowedInteractions", "coordinateFamily", "coordinateSpaceId", "domain", "featureId", "featureType", "geometry",
  "position", "label", "layerId", "provenance", "publicEligibility", "publicationState", "sourceAuthority", "sourceRecordId",
  "updatedAt", "verificationState",
];
const CLIENT_PROVENANCE_ALLOWLIST = ["freshness", "publicationState", "sourceAuthority", "updatedAt", "verificationState"];
let resultCounter = 0;

const resultRef = () => `spatial-result-${++resultCounter}`;
const text = (value) => typeof value === "string" && value.trim().length > 0;

function defaultDimensions() {
  return Object.freeze({
    domainState: null,
    temporalState: null,
    selectionState: null,
    availabilityState: "AVAILABLE",
    availabilityReason: null,
    verificationState: null,
    publicationState: null,
    highlightState: null,
    freshnessState: "UNKNOWN",
    resolvedVisualState: "NORMAL",
    modifiers: Object.freeze([]),
  });
}

function internalResult(status, feature, diagnostics, dimensions = defaultDimensions(), extras = {}) {
  return Object.freeze({ kind: "INTERNAL", status, feature, diagnostics: Object.freeze(diagnostics), dimensions, ...extras });
}

function diagnosticForIssue(issue) {
  const map = {
    UNKNOWN_COORDINATE_SPACE: "UNKNOWN_COORDINATE_SPACE",
    COORDINATE_FAMILY_MISMATCH: "COORDINATE_FAMILY_MISMATCH",
    UNKNOWN_LAYER: "INVALID_LAYER",
    LAYER_COORDINATE_SPACE_UNSUPPORTED: "INVALID_LAYER",
    PROVENANCE_REQUIRED: "INVALID_PROVENANCE",
    PROVENANCE_FIELD_REQUIRED: "INVALID_PROVENANCE",
    PROVENANCE_TIMESTAMP_INVALID: "INVALID_PROVENANCE",
  };
  return map[issue.code] ? createProjectionDiagnostic(map[issue.code], issue.details) : createProjectionDiagnostic("INVALID_FEATURE", { issueCode: issue.code, field: issue.field });
}

function viewerAllows(level, viewer) {
  return Boolean(viewer?.grantedLevels && viewer.grantedLevels.includes(level));
}

function visibilityFor(feature, viewer) {
  const level = feature.publicEligibility?.level || feature.publicationState;
  if (level === PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED) return "SUPPRESSED";
  if (!LEVELS.includes(level) || !viewerAllows(level, viewer)) return "RESTRICTED";
  return "VISIBLE";
}

function authorityConfirmed(authorities, sourceAuthority, layerId) {
  return authorities.some((entry) => entry?.sourceAuthority === sourceAuthority && (!entry.layerIds || entry.layerIds.includes(layerId)));
}

function isOperator(viewer) {
  return Boolean(viewer?.grantedLevels?.includes("OPERATOR") || viewer?.grantedLevels?.includes("ADMIN"));
}

function safeFeature(feature, allowlist, restricted = false) {
  if (!feature) return undefined;
  const safe = {};
  for (const key of allowlist) {
    if (feature[key] !== undefined) safe[key] = feature[key];
  }
  if (safe.provenance) {
    const provenance = {};
    for (const key of CLIENT_PROVENANCE_ALLOWLIST) {
      if (safe.provenance[key] !== undefined) provenance[key] = safe.provenance[key];
    }
    provenance.verificationState ??= feature.verificationState;
    safe.provenance = provenance;
  }
  if (restricted) delete safe.provenance;
  return safe;
}

function presentationForClient(internal) {
  const dimensions = internal.dimensions;
  const presentation = {
    resolvedVisualState: dimensions.resolvedVisualState,
    domainState: dimensions.domainState,
    temporalState: dimensions.temporalState,
    selectionState: dimensions.selectionState,
    availabilityState: dimensions.availabilityState,
    availabilityReason: dimensions.availabilityReason,
    verificationState: dimensions.verificationState,
    publicationState: dimensions.publicationState,
    highlightState: dimensions.highlightState,
    freshnessState: dimensions.freshnessState,
    modifiers: dimensions.modifiers,
  };
  if (internal.masked) {
    delete presentation.domainState;
    delete presentation.temporalState;
    delete presentation.selectionState;
    delete presentation.availabilityState;
    delete presentation.availabilityReason;
    delete presentation.verificationState;
    delete presentation.publicationState;
    delete presentation.highlightState;
    delete presentation.freshnessState;
    delete presentation.modifiers;
  }
  if (internal.suppressEmergency) delete presentation.domainState;
  return Object.freeze(presentation);
}

function accessibilityFor(internal, stateTextOverride) {
  const dimensions = internal.dimensions;
  const accessibility = {
    label: internal.feature?.accessibility?.label || internal.feature?.label || "Spatial feature",
    stateText: stateTextOverride || internal.stateText,
    selected: dimensions.selectionState === "SELECTED",
    highlighted: Boolean(dimensions.highlightState),
  };
  if (dimensions.freshnessState === "STALE" && !internal.masked) accessibility.freshnessText = `Information may be out of date (last updated ${internal.feature.updatedAt})`;
  if (dimensions.verificationState === "UNVERIFIED" && !internal.masked) accessibility.verificationText = "Unverified";
  if (internal.masked) {
    return Object.freeze({ label: "Restricted item", stateText: "Restricted" });
  }
  return Object.freeze(accessibility);
}

function makeClient(internal) {
  if (!internal || internal.status === "INVALID" || internal.status === "SUPPRESSED") return null;
  if (internal.status === "RESTRICTED") {
    if (internal.maskMode === "HIDE") return null;
    if (internal.maskMode === "NOTICE") {
      return Object.freeze({
        kind: "CLIENT",
        status: "RESTRICTED",
        layerId: internal.feature.layerId,
        resultRef: resultRef(),
        presentation: Object.freeze({ resolvedVisualState: "RESTRICTED" }),
        accessibility: Object.freeze({ label: "Restricted item", stateText: "Restricted" }),
        diagnostics: Object.freeze(internal.diagnostics.filter((entry) => entry.code === "RESTRICTED").map(clientDiagnostic).filter(Boolean)),
      });
    }
    if (internal.maskMode === "GENERALIZED") {
      const generalized = internal.feature.generalizedGeometry;
      return Object.freeze({
        kind: "CLIENT",
        status: "RESTRICTED",
        layerId: internal.feature.layerId,
        resultRef: resultRef(),
        geometry: generalized === null ? undefined : generalized,
        presentation: Object.freeze({ resolvedVisualState: "RESTRICTED" }),
        accessibility: Object.freeze({ label: "Restricted item", stateText: "Restricted" }),
        diagnostics: Object.freeze(internal.diagnostics.filter((entry) => entry.code === "RESTRICTED").map(clientDiagnostic).filter(Boolean)),
      });
    }
    return null;
  }
  const allowlist = internal.status === "UNAVAILABLE" ? UNAVAILABLE_ALLOWLIST : FEATURE_ALLOWLIST;
  const feature = safeFeature(internal.feature, allowlist);
  if (internal.status === "UNAVAILABLE" && feature) feature.allowedInteractions = Object.freeze([]);
  const client = {
    kind: "CLIENT",
    status: internal.status,
    featureId: internal.feature.featureId,
    layerId: internal.feature.layerId,
    resultRef: resultRef(),
    feature,
    presentation: presentationForClient(internal),
    accessibility: accessibilityFor(internal),
    diagnostics: Object.freeze(internal.diagnostics.map(clientDiagnostic).filter(Boolean)),
  };
  return Object.freeze(client);
}

export function createSpatialProjectionPipeline({ adapterRegistry, coordinateRegistry, layerRegistry, clock = () => { throw new Error("projection pipeline requires an explicit clock"); }, emergencyAuthorities = PRODUCTION_EMERGENCY_AUTHORITIES } = {}) {
  if (!adapterRegistry || !coordinateRegistry || !layerRegistry) throw new Error("projection pipeline requires adapter, coordinate, and layer registries");
  const emergencyAllowlist = Object.freeze([...emergencyAuthorities]);

  function project(record, context = {}) {
    const diagnostics = [];
    const adapterResult = adapterRegistry.getAdapter(record?.domain, record?.featureType);
    if (!adapterResult.ok) return internalResult("INVALID", null, [createProjectionDiagnostic("ADAPTER_NOT_FOUND")]);
    const adapter = adapterResult.adapter;
    if (!text(record?.sourceAuthority)) return internalResult("INVALID", null, [createProjectionDiagnostic("INVALID_SOURCE_AUTHORITY")]);
    if (!adapter.canProject(record, context)) return internalResult("INVALID", null, [createProjectionDiagnostic("ADAPTER_NOT_FOUND")]);
    const feature = adapter.project(record, context);
    const snapshot = adapterRegistry.getSnapshot(record.domain, record.featureType);
    if (!feature || !text(feature.sourceAuthority)) return internalResult("INVALID", feature || null, [createProjectionDiagnostic("INVALID_SOURCE_AUTHORITY")]);
    const validation = validateSpatialFeature(feature, { coordinateRegistry, layerRegistry });
    for (const issue of validation.issues) diagnostics.push(diagnosticForIssue(issue));
    if (feature.provenance?.projectionVersion !== snapshot.projectionVersion) diagnostics.push(createProjectionDiagnostic("INVALID_PROVENANCE"));
    const layerResult = layerRegistry.get(feature.layerId);
    const layer = layerResult.ok ? layerResult.layer : null;
    if (!layerResult.ok && !diagnostics.some((entry) => entry.code === "INVALID_LAYER")) diagnostics.push(createProjectionDiagnostic("INVALID_LAYER"));
    const domainState = record.domainState ?? null;
    if (!DOMAIN_STATES.has(domainState)) diagnostics.push(createProjectionDiagnostic("INVALID_DOMAIN_STATE"));
    if (diagnostics.some((entry) => entry.code === "INVALID_FEATURE" || entry.code === "INVALID_PROVENANCE" || entry.code === "UNKNOWN_COORDINATE_SPACE" || entry.code === "COORDINATE_FAMILY_MISMATCH" || entry.code === "INVALID_LAYER" || entry.code === "INVALID_DOMAIN_STATE" || entry.code === "INVALID_SOURCE_AUTHORITY")) {
      return internalResult("INVALID", feature, diagnostics, { dimensions: Object.freeze({ ...defaultDimensions(), domainState, verificationState: feature.verificationState, publicationState: feature.publicationState }), stateText: "Unavailable" });
    }
    const viewer = context.viewer;
    const visibility = visibilityFor(feature, viewer);
    const now = clock();
    const temporal = record.temporal || {};
    const temporalResult = evaluateTemporal(temporal, layer, now);
    for (const code of temporalResult.diagnostics) diagnostics.push(createProjectionDiagnostic(code));
    if (temporalResult.state === "upcoming" && layer.timeAwareCapability === true && !layer.soonThreshold && temporal.soonFlag !== true) diagnostics.push(createProjectionDiagnostic("EVENT_SOON_THRESHOLD_NOT_CONFIGURED"));
    const freshnessState = evaluateFreshness(temporal, layer, now);
    const layerUnavailable = LIFECYCLE_UNAVAILABLE.has(layer.lifecycleStatus);
    const stalePolicy = layer.stalePolicy || "MARK_STALE";
    const domainUnavailable = domainState === "UNAVAILABLE";
    let availabilityState = "AVAILABLE";
    let availabilityReason = null;
    let status = "PROJECTED";
    if (layerUnavailable) {
      availabilityState = "UNAVAILABLE";
      availabilityReason = "LAYER_LIFECYCLE";
      status = "UNAVAILABLE";
    } else if (freshnessState === "STALE") {
      if (stalePolicy === "SUPPRESS") status = "SUPPRESSED";
      if (stalePolicy === "UNAVAILABLE") {
        status = "UNAVAILABLE";
        availabilityState = "UNAVAILABLE";
        availabilityReason = "STALE_POLICY";
      } else if (stalePolicy === "MARK_STALE") status = "STALE";
      diagnostics.push(createProjectionDiagnostic("STALE_SOURCE", { stalePolicy }));
    } else if (domainUnavailable) {
      availabilityState = "UNAVAILABLE";
      availabilityReason = "DOMAIN_SUPPLIED";
      status = "UNAVAILABLE";
    }
    if (visibility === "SUPPRESSED") {
      diagnostics.push(createProjectionDiagnostic("NOT_PUBLISHED"));
      status = "SUPPRESSED";
    } else if (visibility === "RESTRICTED") {
      diagnostics.push(createProjectionDiagnostic("RESTRICTED", { maskMode: layer.maskMode || "HIDE" }));
      status = "RESTRICTED";
    }
    const selectionState = context.selection?.featureId === feature.featureId ? "SELECTED" : null;
    const highlightSources = [...new Set((context.highlights || []).filter((entry) => entry?.featureId === feature.featureId && entry.source !== "SELECTION").map((entry) => entry.source).filter(text))].sort();
    const highlightState = highlightSources.length ? Object.freeze({ sources: Object.freeze(highlightSources) }) : null;
    const emergencyConfirmed = domainState === "EMERGENCY" && authorityConfirmed(emergencyAllowlist, feature.sourceAuthority, feature.layerId);
    const emergencyRenderable = emergencyConfirmed && (feature.verificationState === "VERIFIED" || isOperator(viewer));
    if (domainState === "EMERGENCY" && !emergencyConfirmed) diagnostics.push(createProjectionDiagnostic("EMERGENCY_AUTHORITY_NOT_CONFIRMED"));
    const resolved = resolvePresentationState({
      domainState,
      temporalState: temporalResult.state,
      selectionState,
      highlightState,
      availabilityState,
      availabilityReason,
      freshnessState,
      verificationState: feature.verificationState,
      publicationState: visibility === "RESTRICTED" ? feature.publicationState : null,
      emergencyConfirmed: emergencyRenderable,
      timeAwareCapability: layer.timeAwareCapability === true,
    });
    let dimensions = resolved.dimensions;
    let stateText = resolved.stateText;
    if (domainState === "EMERGENCY" && !emergencyRenderable && visibility !== "RESTRICTED" && availabilityState === "AVAILABLE") {
      dimensions = Object.freeze({ ...dimensions, resolvedVisualState: selectionState ? "SELECTED" : "NORMAL", publicationState: feature.publicationState });
      stateText = selectionState ? "Selected" : "Normal";
    } else {
      dimensions = Object.freeze({ ...dimensions, publicationState: feature.publicationState });
    }
    const internal = internalResult(status, feature, diagnostics, dimensions, {
      maskMode: layer.maskMode || "HIDE",
      stateText,
      viewer,
      masked: status === "RESTRICTED",
      suppressEmergency: domainState === "EMERGENCY" && !emergencyRenderable && visibility !== "RESTRICTED",
    });
    return Object.freeze({ ...internal, accessibility: accessibilityFor(internal) });
  }

  function projectForClient(records, context = {}) {
    return Object.freeze(records.map((record) => makeClient(project(record, context))).filter(Boolean));
  }

  function clientSelectableFeatures(records, context = {}) {
    return Object.freeze(records.map((record) => project(record, context)).filter((internal) => internal.status === "PROJECTED" || internal.status === "STALE" || internal.status === "UNAVAILABLE").map((internal) => internal.feature));
  }

  function lookupForClient(featureId, { records = [], ...context } = {}) {
    for (const record of records) {
      const expectedId = createSpatialFeatureId({ domain: record.domain, featureType: record.featureType, sourceAuthority: record.sourceAuthority, sourceRecordId: record.sourceRecordId });
      if (expectedId !== featureId) continue;
      const client = makeClient(project(record, context));
      if (client) return Object.freeze({ ok: true, result: client });
      break;
    }
    return Object.freeze({ ok: false, diagnostics: Object.freeze([{ code: "FEATURE_NOT_AVAILABLE", message: PROJECTION_DIAGNOSTIC_CATALOG.FEATURE_NOT_AVAILABLE.message }]) });
  }

  return Object.freeze({ project, toClient: makeClient, projectForClient, clientSelectableFeatures, lookupForClient });
}
