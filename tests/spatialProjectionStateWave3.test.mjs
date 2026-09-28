import assert from "node:assert/strict";
import test from "node:test";

import {
  COORDINATE_FAMILIES,
  PUBLICATION_ELIGIBILITY_LEVELS,
  SPATIAL_STATES,
  TEMPORAL_STATES,
  createSpatialFeatureId,
  defaultCoordinateSpaceRegistry,
  defaultSpatialLayerRegistry,
  validateSpatialFeature,
} from "../src/shared/spatial/index.js";
import { createSpatialSelectionStore } from "../src/system/spatial/index.js";

const timestamp = "2026-09-27T00:00:00.000Z";

const PROJECTION_RESULTS = Object.freeze({
  PROJECTED: "PROJECTED",
  SUPPRESSED: "SUPPRESSED",
  RESTRICTED: "RESTRICTED",
  INVALID: "INVALID",
  UNAVAILABLE: "UNAVAILABLE",
  STALE: "STALE",
});

const DIAGNOSTICS = Object.freeze({
  UNKNOWN_COORDINATE_SPACE: "UNKNOWN_COORDINATE_SPACE",
  COORDINATE_FAMILY_MISMATCH: "COORDINATE_FAMILY_MISMATCH",
  INVALID_PROVENANCE: "INVALID_PROVENANCE",
  NOT_PUBLISHED: "NOT_PUBLISHED",
  RESTRICTED: "RESTRICTED",
  STALE_SOURCE: "STALE_SOURCE",
  INVALID_LAYER: "INVALID_LAYER",
  ADAPTER_NOT_FOUND: "ADAPTER_NOT_FOUND",
  INVALID_FEATURE: "INVALID_FEATURE",
  INVALID_SOURCE_AUTHORITY: "INVALID_SOURCE_AUTHORITY",
  INVALID_TEMPORAL_SOURCE: "INVALID_TEMPORAL_SOURCE",
});

function provenance(record, overrides = {}) {
  return {
    sourceAuthority: record.sourceAuthority,
    sourceRecordId: record.sourceRecordId,
    sourceReference: "wave3a-fixture",
    evidenceReference: "GEO-1_WAVE3A_PROJECTION_STATE_DESIGN.md",
    projectionAdapter: "wave3a-fixture-adapter",
    projectionVersion: "1",
    coordinateProvenance: "fixture coordinate declaration",
    updatedAt: timestamp,
    freshness: record.freshness || "current",
    ...overrides,
  };
}

function record(overrides = {}) {
  return Object.freeze({
    domain: "metaverse",
    featureType: "location",
    sourceAuthority: "fixture-authority",
    sourceRecordId: "fixture-location-001",
    coordinateFamily: COORDINATE_FAMILIES.METAVERSE,
    coordinateSpaceId: "metaverse.quick-map",
    geometry: "point-normalized-percent",
    layerId: "metaverse.quick-map.locations",
    title: "Fixture Location",
    label: "Fixture Location",
    verificationState: "UNKNOWN",
    publicationState: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
    publicEligibility: {
      level: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
      publicationState: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
    },
    domainState: null,
    effectiveStart: null,
    effectiveEnd: null,
    sourceTimestamp: timestamp,
    timezone: "America/New_York",
    freshness: "current",
    accessibleLabel: "Fixture Location",
    description: "A neutral projection fixture.",
    ...overrides,
  });
}

function createFixtureAdapter() {
  return Object.freeze({
    canProject(candidate) {
      return Boolean(candidate?.sourceAuthority && candidate?.sourceRecordId);
    },
    project(candidate) {
      if (!this.canProject(candidate)) return { status: PROJECTION_RESULTS.INVALID, diagnostics: [DIAGNOSTICS.INVALID_SOURCE_AUTHORITY] };
      const feature = {
        featureId: createSpatialFeatureId({
          domain: candidate.domain,
          featureType: candidate.featureType,
          sourceAuthority: candidate.sourceAuthority,
          sourceRecordId: candidate.sourceRecordId,
        }),
        featureType: candidate.featureType,
        domain: candidate.domain,
        sourceAuthority: candidate.sourceAuthority,
        sourceRecordId: candidate.sourceRecordId,
        coordinateFamily: candidate.coordinateFamily,
        coordinateSpaceId: candidate.coordinateSpaceId,
        geometry: candidate.geometry,
        layerId: candidate.layerId,
        title: candidate.title,
        label: candidate.label,
        state: SPATIAL_STATES.NORMAL,
        temporalState: null,
        verificationState: candidate.verificationState,
        publicationState: candidate.publicationState,
        provenance: provenance(candidate),
        updatedAt: timestamp,
        allowedInteractions: [],
        authorizedActionReferences: [],
        publicEligibility: candidate.publicEligibility,
        accessibility: {
          label: candidate.accessibleLabel,
          description: candidate.description,
          stateText: "Normal",
          keyboardInteractions: ["SELECT"],
        },
        sourceDomainState: candidate.domainState,
        sourceTemporal: {
          effectiveStart: candidate.effectiveStart,
          effectiveEnd: candidate.effectiveEnd,
          sourceTimestamp: candidate.sourceTimestamp,
          timezone: candidate.timezone,
          freshness: candidate.freshness,
        },
      };
      const validation = validateSpatialFeature(feature, {
        coordinateRegistry: defaultCoordinateSpaceRegistry,
        layerRegistry: defaultSpatialLayerRegistry,
      });
      if (!validation.valid) return { status: PROJECTION_RESULTS.INVALID, diagnostics: mapDiagnostics(validation.errors), feature };
      if (candidate.publicationState === PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED) return { status: PROJECTION_RESULTS.SUPPRESSED, diagnostics: [DIAGNOSTICS.NOT_PUBLISHED], feature };
      if (candidate.publicEligibility?.level === PUBLICATION_ELIGIBILITY_LEVELS.RESTRICTED) return { status: PROJECTION_RESULTS.RESTRICTED, diagnostics: [DIAGNOSTICS.RESTRICTED], feature };
      if (candidate.freshness === "stale") return { status: PROJECTION_RESULTS.STALE, diagnostics: [DIAGNOSTICS.STALE_SOURCE], feature };
      return { status: PROJECTION_RESULTS.PROJECTED, diagnostics: [], feature };
    },
    getSourceAuthority() {
      return "fixture-authority";
    },
    getSupportedFeatureTypes() {
      return ["location"];
    },
    getSupportedCoordinateSpaces() {
      return ["metaverse.quick-map"];
    },
  });
}

function mapDiagnostics(errors) {
  return errors.map((error) => {
    if (error.includes("unknown coordinate space")) return DIAGNOSTICS.UNKNOWN_COORDINATE_SPACE;
    if (error.includes("coordinate family mismatch")) return DIAGNOSTICS.COORDINATE_FAMILY_MISMATCH;
    if (error.includes("provenance")) return DIAGNOSTICS.INVALID_PROVENANCE;
    if (error.includes("layer")) return DIAGNOSTICS.INVALID_LAYER;
    return DIAGNOSTICS.INVALID_FEATURE;
  });
}

function createAdapterRegistry() {
  const adapters = new Map();
  return {
    register(adapter, domain = "metaverse", featureType = "location") {
      const key = `${domain}:${featureType}`;
      if (adapters.has(key)) return { ok: false, diagnostics: ["ADAPTER_COLLISION"] };
      adapters.set(key, adapter);
      return { ok: true };
    },
    getAdapter(domain, featureType) {
      const adapter = adapters.get(`${domain}:${featureType}`);
      if (!adapter) return { ok: false, diagnostics: [DIAGNOSTICS.ADAPTER_NOT_FOUND] };
      return { ok: true, adapter };
    },
    listAdapters() {
      return [...adapters.values()];
    },
  };
}

function resolvePresentationState(feature, { selection = null, now = new Date(timestamp) } = {}) {
  const domainState = feature.sourceDomainState || null;
  const publicationState = feature.publicEligibility?.level === PUBLICATION_ELIGIBILITY_LEVELS.RESTRICTED ? SPATIAL_STATES.RESTRICTED : null;
  const selectionState = selection?.featureId === feature.featureId ? SPATIAL_STATES.SELECTED : null;
  const temporalState = resolveTemporalState(feature.sourceTemporal, now);
  const temporalVisualState = temporalState === TEMPORAL_STATES.LIVE ? SPATIAL_STATES.EVENT_LIVE : null;
  const availabilityState = feature.sourceTemporal?.freshness === "stale" ? SPATIAL_STATES.UNAVAILABLE : null;
  const resolvedVisualState = publicationState || availabilityState || domainState || temporalVisualState || selectionState || SPATIAL_STATES.NORMAL;
  return { domainState, temporalState, selectionState, availabilityState, publicationState, verificationState: feature.verificationState, resolvedVisualState };
}

function resolveTemporalState(sourceTemporal, now) {
  if (!sourceTemporal?.effectiveStart) return null;
  const start = new Date(sourceTemporal.effectiveStart);
  if (Number.isNaN(start.getTime())) return null;
  const end = sourceTemporal.effectiveEnd ? new Date(sourceTemporal.effectiveEnd) : null;
  if (end && Number.isNaN(end.getTime())) return null;
  if (start > now) return TEMPORAL_STATES.UPCOMING;
  if (end && now <= end) return TEMPORAL_STATES.LIVE;
  if (end && now > end) return TEMPORAL_STATES.ENDED;
  return null;
}

test("valid domain fixture projects to a valid SpatialFeature", () => {
  const result = createFixtureAdapter().project(record());
  assert.equal(result.status, PROJECTION_RESULTS.PROJECTED);
  assert.equal(result.feature.sourceRecordId, "fixture-location-001");
  assert.equal(result.feature.provenance.sourceAuthority, "fixture-authority");
});

test("invalid record and missing source authority are rejected with diagnostics", () => {
  const adapter = createFixtureAdapter();
  assert.deepEqual(adapter.project(record({ sourceAuthority: "" })).diagnostics, [DIAGNOSTICS.INVALID_SOURCE_AUTHORITY]);
  assert.deepEqual(adapter.project(null).diagnostics, [DIAGNOSTICS.INVALID_SOURCE_AUTHORITY]);
});

test("unknown coordinate space, family mismatch, and invalid layer are diagnosed", () => {
  const adapter = createFixtureAdapter();
  assert.ok(adapter.project(record({ coordinateSpaceId: "metaverse.missing" })).diagnostics.includes(DIAGNOSTICS.UNKNOWN_COORDINATE_SPACE));
  assert.ok(adapter.project(record({ coordinateFamily: COORDINATE_FAMILIES.REAL_WORLD })).diagnostics.includes(DIAGNOSTICS.COORDINATE_FAMILY_MISMATCH));
  assert.ok(adapter.project(record({ layerId: "metaverse.missing-layer" })).diagnostics.includes(DIAGNOSTICS.INVALID_LAYER));
});

test("NOT_PUBLISHED is suppressed and RESTRICTED is handled safely", () => {
  const adapter = createFixtureAdapter();
  assert.equal(adapter.project(record({ publicationState: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED })).status, PROJECTION_RESULTS.SUPPRESSED);
  assert.equal(adapter.project(record({ publicEligibility: { level: PUBLICATION_ELIGIBILITY_LEVELS.RESTRICTED, publicationState: PUBLICATION_ELIGIBILITY_LEVELS.RESTRICTED } })).status, PROJECTION_RESULTS.RESTRICTED);
});

test("provenance, sourceRecordId, and accessible label survive projection", () => {
  const result = createFixtureAdapter().project(record({ accessibleLabel: "Accessible fixture" }));
  assert.equal(result.feature.sourceRecordId, "fixture-location-001");
  assert.equal(result.feature.provenance.projectionAdapter, "wave3a-fixture-adapter");
  assert.equal(result.feature.accessibility.label, "Accessible fixture");
});

test("selection creates presentation selection state only and does not mutate domain fixture", () => {
  const domainRecord = record({ domainState: SPATIAL_STATES.MISSION_ACTIVE });
  const result = createFixtureAdapter().project(domainRecord);
  const store = createSpatialSelectionStore({ features: [result.feature] });
  store.select({
    selectionId: "selection-001",
    featureId: result.feature.featureId,
    domain: result.feature.domain,
    sourceAuthority: result.feature.sourceAuthority,
    coordinateFamily: result.feature.coordinateFamily,
    coordinateSpaceId: result.feature.coordinateSpaceId,
    layerId: result.feature.layerId,
    selectionReason: "test",
    timestamp,
    provenance: result.feature.provenance,
    eligibleActions: [],
  });
  const state = resolvePresentationState(result.feature, { selection: store.getSelection() });
  assert.equal(state.selectionState, SPATIAL_STATES.SELECTED);
  assert.equal(state.domainState, SPATIAL_STATES.MISSION_ACTIVE);
  assert.equal(domainRecord.domainState, SPATIAL_STATES.MISSION_ACTIVE);
});

test("selected + restricted and selected + mission-active conflicts preserve dimensions", () => {
  const adapter = createFixtureAdapter();
  const restricted = adapter.project(record({ publicEligibility: { level: PUBLICATION_ELIGIBILITY_LEVELS.RESTRICTED, publicationState: PUBLICATION_ELIGIBILITY_LEVELS.RESTRICTED } })).feature;
  const restrictedState = resolvePresentationState(restricted, { selection: { featureId: restricted.featureId } });
  assert.equal(restrictedState.selectionState, SPATIAL_STATES.SELECTED);
  assert.equal(restrictedState.resolvedVisualState, SPATIAL_STATES.RESTRICTED);

  const mission = adapter.project(record({ domainState: SPATIAL_STATES.MISSION_ACTIVE })).feature;
  const missionState = resolvePresentationState(mission, { selection: { featureId: mission.featureId } });
  assert.equal(missionState.selectionState, SPATIAL_STATES.SELECTED);
  assert.equal(missionState.domainState, SPATIAL_STATES.MISSION_ACTIVE);
});

test("stale feature and temporal values are handled without inference", () => {
  const adapter = createFixtureAdapter();
  assert.equal(adapter.project(record({ freshness: "stale" })).status, PROJECTION_RESULTS.STALE);
  assert.equal(resolvePresentationState(adapter.project(record({ effectiveStart: null })).feature).temporalState, null);
  assert.equal(resolvePresentationState(adapter.project(record({ effectiveStart: "2026-09-28T00:00:00.000Z" })).feature).temporalState, TEMPORAL_STATES.UPCOMING);
  const live = resolvePresentationState(adapter.project(record({ effectiveStart: "2026-09-26T00:00:00.000Z", effectiveEnd: "2026-09-28T00:00:00.000Z" })).feature);
  assert.equal(live.temporalState, TEMPORAL_STATES.LIVE);
  assert.equal(live.resolvedVisualState, SPATIAL_STATES.EVENT_LIVE);
});

test("SCHEDULED is domain-supplied only and never derived from a future start time (GEO1-WAVE3A-DEC-003)", () => {
  const adapter = createFixtureAdapter();
  const futureStart = "2026-09-28T00:00:00.000Z";

  const timeOnly = resolvePresentationState(adapter.project(record({ effectiveStart: futureStart })).feature);
  assert.equal(timeOnly.domainState, null);
  assert.equal(timeOnly.temporalState, TEMPORAL_STATES.UPCOMING);
  assert.equal(timeOnly.resolvedVisualState, SPATIAL_STATES.NORMAL);
  assert.notEqual(timeOnly.resolvedVisualState, SPATIAL_STATES.SCHEDULED);

  const closedFuture = resolvePresentationState(adapter.project(record({ domainState: SPATIAL_STATES.CLOSED, effectiveStart: futureStart })).feature);
  assert.equal(closedFuture.domainState, SPATIAL_STATES.CLOSED);
  assert.equal(closedFuture.resolvedVisualState, SPATIAL_STATES.CLOSED);

  const suppliedRecord = record({ domainState: SPATIAL_STATES.SCHEDULED, effectiveStart: futureStart });
  const supplied = adapter.project(suppliedRecord).feature;
  const suppliedState = resolvePresentationState(supplied, { selection: { featureId: supplied.featureId } });
  assert.equal(suppliedState.domainState, SPATIAL_STATES.SCHEDULED);
  assert.equal(suppliedState.selectionState, SPATIAL_STATES.SELECTED);
  assert.equal(suppliedState.resolvedVisualState, SPATIAL_STATES.SCHEDULED);
  assert.equal(suppliedRecord.domainState, SPATIAL_STATES.SCHEDULED);

  const undated = adapter.project(record({ domainState: SPATIAL_STATES.SCHEDULED, effectiveStart: null, effectiveEnd: null }));
  const undatedState = resolvePresentationState(undated.feature);
  assert.equal(undatedState.domainState, SPATIAL_STATES.SCHEDULED);
  assert.equal(undatedState.temporalState, null);
  assert.equal(undated.feature.sourceTemporal.effectiveStart, null);
});

test("adapter registry rejects collision and diagnoses missing adapters", () => {
  const registry = createAdapterRegistry();
  const adapter = createFixtureAdapter();
  assert.equal(registry.register(adapter).ok, true);
  assert.equal(registry.register(adapter).ok, false);
  assert.deepEqual(registry.getAdapter("missing", "location").diagnostics, [DIAGNOSTICS.ADAPTER_NOT_FOUND]);
});

test("coordinate isolation, no Franklin fallback, no mutation, and no publication authority creation remain intact", () => {
  const domainRecord = record();
  const projected = createFixtureAdapter().project(domainRecord).feature;
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "metaverse.master-city").ok, false);
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "real-world.latlng").ok, false);
  assert.equal(defaultSpatialLayerRegistry.has("real-world.franklin-fallback"), false);
  assert.equal(domainRecord.sourceRecordId, "fixture-location-001");
  assert.equal(projected.publicEligibility.level, PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED);
});
