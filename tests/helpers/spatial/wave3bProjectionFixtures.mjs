// GEO-1 Wave 3B red-test fixtures.
//
// TEST-ONLY. Nothing in this file is production truth, and no production module may import it.
// It supplies:
//   1. a loader for the not-yet-implemented Wave 3B production runtime,
//   2. fixture layers carrying the Wave 3B layer-policy fields accepted by GEO1-WAVE3B-DEC-015.
//      The production layer contract does NOT validate them yet (see WAVE3B_LAYER_POLICY_REQUIREMENTS),
//   3. a test-only projection adapter and test-only authorities, including a clearly labeled
//      test-only confirmed emergency authority. The production emergency allowlist is empty.

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as sharedSpatial from "../../../src/shared/spatial/index.js";
import {
  COORDINATE_FAMILIES,
  PUBLICATION_ELIGIBILITY_LEVELS,
  SPATIAL_LAYER_LIFECYCLE_STATUS,
  SpatialLayerRegistry,
  createSpatialFeatureId,
  defaultCoordinateSpaceRegistry,
} from "../../../src/shared/spatial/index.js";

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(here, "../../..");

// Production module the Wave 3B tests require (GEO-1B Repository Placement Plan: runtime in src/system/spatial/).
export const WAVE3B_RUNTIME_ENTRY = "src/system/spatial/projection/index.js";
export const WAVE3B_RUNTIME_DIR = "src/system/spatial/projection";

export const EXPECTED_MISSING_RUNTIME = "EXPECTED_MISSING_RUNTIME";

export async function loadProjectionRuntime() {
  const entry = resolve(REPO_ROOT, WAVE3B_RUNTIME_ENTRY);
  if (!existsSync(entry)) {
    throw new Error(`${EXPECTED_MISSING_RUNTIME}: ${WAVE3B_RUNTIME_ENTRY} is not implemented`);
  }
  // Any failure after the entry exists is a real failure, not an expected missing-runtime failure.
  return import(pathToFileURL(entry).href);
}

export function missingRuntime(what) {
  return new Error(`${EXPECTED_MISSING_RUNTIME}: ${what}`);
}

// Gate for additive Wave 1 contract exports required by GEO-1_WAVE3B_RUNTIME_CONTRACT.md §9.
// Presence of the export, not the outcome of an assertion, decides "missing runtime", so a
// broken implementation can never be reported as an expected failure.
export function requireSharedExport(name) {
  if (!(name in sharedSpatial)) throw missingRuntime(`src/shared/spatial/index.js does not yet export ${name}`);
  return sharedSpatial[name];
}

export const NOW = "2026-09-27T12:00:00.000Z";
export const fixedClock = (iso = NOW) => () => new Date(iso);

// Planted in private fields. It must never appear in a client result for a hidden record.
export const LEAK_PROBE = "leak-probe-7f3a";

export function containsLeakProbe(value) {
  return JSON.stringify(value ?? null).toLowerCase().includes(LEAK_PROBE);
}

// ---------------------------------------------------------------------------
// Test-only authorities
// ---------------------------------------------------------------------------

export const TEST_ONLY_CONFIRMED_EMERGENCY_AUTHORITY = "wave3b-test-only-confirmed-emergency-authority";
export const TEST_ONLY_UNCONFIRMED_AUTHORITY = "wave3b-test-only-unconfirmed-authority";
export const TEST_ONLY_EVENT_AUTHORITY = "wave3b-test-only-event-authority";
export const TEST_ONLY_FRESHNESS_AUTHORITY = "wave3b-test-only-freshness-authority";
export const TEST_ONLY_SOURCE_AUTHORITY = "wave3b-test-only-source-authority";

// ---------------------------------------------------------------------------
// WAVE3B_LAYER_POLICY_REQUIREMENTS
// Optional layer fields accepted into the canonical layer contract by GEO1-WAVE3B-DEC-015
// (GEO-1_WAVE3B_RUNTIME_CONTRACT.md §8). Production validation of these fields is NOT
// implemented yet. SpatialLayerRegistry currently ignores unknown fields, so registering these
// fixtures does NOT mean the production contract validates them. Test T05 enforces validation.
// ---------------------------------------------------------------------------

export const WAVE3B_LAYER_POLICY_REQUIREMENTS = Object.freeze({
  stalePolicy: "MARK_STALE | SUPPRESS | UNAVAILABLE; absent behaves as MARK_STALE",
  maxSourceAge: "ISO 8601 duration (D/H/M/S only, > 0); requires freshnessAuthority",
  freshnessAuthority: "non-empty; required with maxSourceAge",
  soonThreshold: "ISO 8601 duration (D/H/M/S only, > 0); requires soonThresholdAuthority and timeAwareCapability",
  soonThresholdAuthority: "non-empty; required with soonThreshold",
  maskMode: "HIDE | NOTICE | GENERALIZED; absent means HIDE",
});

const COORDINATE_SPACE = "metaverse.quick-map";

function fixtureLayer(layerId, overrides = {}) {
  return Object.freeze({
    layerId,
    name: `Wave 3B fixture ${layerId}`,
    owningDomain: "wave3b-fixture",
    sourceAuthority: TEST_ONLY_SOURCE_AUTHORITY,
    supportedCoordinateSpaces: Object.freeze([COORDINATE_SPACE]),
    visibilityPolicy: "explicit",
    publicPrivateEligibility: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
    requiredPermissions: Object.freeze([]),
    timeAwareCapability: false,
    selectionCapability: true,
    verificationCapability: true,
    accessibilityBehavior: "text equivalent and keyboard selection required",
    lifecycleStatus: SPATIAL_LAYER_LIFECYCLE_STATUS.EXPERIMENTAL,
    ...overrides,
  });
}

export const LAYERS = Object.freeze({
  STATIC: "wave3b.static",
  EVENTS: "wave3b.events",
  EVENTS_NO_THRESHOLD: "wave3b.events-no-threshold",
  EMERGENCY_NAMED: "wave3b.emergency-alerts",
  NOTICE: "wave3b.restricted-notice",
  GENERALIZED: "wave3b.restricted-generalized",
  MARK_STALE: "wave3b.stale-mark",
  SUPPRESS: "wave3b.stale-suppress",
  UNAVAILABLE: "wave3b.stale-unavailable",
  MAX_AGE: "wave3b.max-age",
  DISCONNECTED: "wave3b.disconnected",
  UNMOUNTED: "wave3b.unmounted",
  ARCHIVED: "wave3b.archived",
});

export const WAVE3B_FIXTURE_LAYERS = Object.freeze([
  fixtureLayer(LAYERS.STATIC),
  fixtureLayer(LAYERS.EVENTS, { timeAwareCapability: true, soonThreshold: "PT2H", soonThresholdAuthority: TEST_ONLY_EVENT_AUTHORITY }),
  fixtureLayer(LAYERS.EVENTS_NO_THRESHOLD, { timeAwareCapability: true }),
  fixtureLayer(LAYERS.EMERGENCY_NAMED, { name: "Emergency Alerts" }),
  fixtureLayer(LAYERS.NOTICE, { maskMode: "NOTICE" }),
  fixtureLayer(LAYERS.GENERALIZED, { maskMode: "GENERALIZED" }),
  fixtureLayer(LAYERS.MARK_STALE, { stalePolicy: "MARK_STALE" }),
  fixtureLayer(LAYERS.SUPPRESS, { stalePolicy: "SUPPRESS" }),
  fixtureLayer(LAYERS.UNAVAILABLE, { stalePolicy: "UNAVAILABLE" }),
  fixtureLayer(LAYERS.MAX_AGE, { maxSourceAge: "PT1H", freshnessAuthority: TEST_ONLY_FRESHNESS_AUTHORITY, stalePolicy: "MARK_STALE" }),
  fixtureLayer(LAYERS.DISCONNECTED, { lifecycleStatus: SPATIAL_LAYER_LIFECYCLE_STATUS.DISCONNECTED }),
  fixtureLayer(LAYERS.UNMOUNTED, { lifecycleStatus: SPATIAL_LAYER_LIFECYCLE_STATUS.UNMOUNTED }),
  fixtureLayer(LAYERS.ARCHIVED, { lifecycleStatus: SPATIAL_LAYER_LIFECYCLE_STATUS.ARCHIVED }),
]);

// Layers that violate the DEC-015 layer policy contract. They are never registered in the fixture
// registry; T05 asserts production validation rejects each with LAYER_POLICY_INVALID on `field`.
export const INVALID_LAYER_POLICY_CANDIDATES = Object.freeze([
  { field: "stalePolicy", layer: fixtureLayer("wave3b.invalid-stale-policy", { stalePolicy: "SOMETIMES" }) },
  { field: "maskMode", layer: fixtureLayer("wave3b.invalid-mask-mode", { maskMode: "BLUR" }) },
  { field: "soonThreshold", layer: fixtureLayer("wave3b.invalid-threshold-format", { timeAwareCapability: true, soonThreshold: "two hours", soonThresholdAuthority: TEST_ONLY_EVENT_AUTHORITY }) },
  { field: "soonThreshold", layer: fixtureLayer("wave3b.invalid-threshold-zero", { timeAwareCapability: true, soonThreshold: "PT0S", soonThresholdAuthority: TEST_ONLY_EVENT_AUTHORITY }) },
  { field: "soonThreshold", layer: fixtureLayer("wave3b.invalid-threshold-months", { timeAwareCapability: true, soonThreshold: "P1M", soonThresholdAuthority: TEST_ONLY_EVENT_AUTHORITY }) },
  { field: "soonThreshold", layer: fixtureLayer("wave3b.invalid-threshold-not-time-aware", { timeAwareCapability: false, soonThreshold: "PT2H", soonThresholdAuthority: TEST_ONLY_EVENT_AUTHORITY }) },
  { field: "soonThresholdAuthority", layer: fixtureLayer("wave3b.invalid-threshold-no-authority", { timeAwareCapability: true, soonThreshold: "PT2H" }) },
  { field: "maxSourceAge", layer: fixtureLayer("wave3b.invalid-max-age-format", { maxSourceAge: "1h", freshnessAuthority: TEST_ONLY_FRESHNESS_AUTHORITY }) },
  { field: "freshnessAuthority", layer: fixtureLayer("wave3b.invalid-max-age-no-authority", { maxSourceAge: "PT1H" }) },
]);

export function createWave3BLayerRegistry() {
  return new SpatialLayerRegistry(WAVE3B_FIXTURE_LAYERS, { coordinateRegistry: defaultCoordinateSpaceRegistry });
}

// ---------------------------------------------------------------------------
// Test-only source records and adapter
// ---------------------------------------------------------------------------

export const DOMAINS = Object.freeze({
  PLACES: "wave3b-places",
  SAFETY: "wave3b-safety",
  RUMOR: "wave3b-rumor",
});

const DOMAIN_AUTHORITY = Object.freeze({
  [DOMAINS.PLACES]: TEST_ONLY_SOURCE_AUTHORITY,
  [DOMAINS.SAFETY]: TEST_ONLY_CONFIRMED_EMERGENCY_AUTHORITY,
  [DOMAINS.RUMOR]: TEST_ONLY_UNCONFIRMED_AUTHORITY,
});

export const VIEWERS = Object.freeze({
  ANONYMOUS: Object.freeze({ surface: "PUBLIC", grantedLevels: Object.freeze([]) }),
  PUBLIC: Object.freeze({ surface: "PUBLIC", grantedLevels: Object.freeze(["PUBLIC"]) }),
  AUTHENTICATED: Object.freeze({ surface: "AUTHENTICATED", grantedLevels: Object.freeze(["PUBLIC", "AUTHENTICATED"]) }),
  ORGANIZATION: Object.freeze({ surface: "AUTHENTICATED", grantedLevels: Object.freeze(["PUBLIC", "AUTHENTICATED", "ORGANIZATION"]) }),
  OPERATOR: Object.freeze({ surface: "OPERATOR", grantedLevels: Object.freeze(["PUBLIC", "AUTHENTICATED", "ORGANIZATION", "OPERATOR", "RESTRICTED"]) }),
  ADMIN: Object.freeze({ surface: "OPERATOR", grantedLevels: Object.freeze(["PUBLIC", "AUTHENTICATED", "ORGANIZATION", "OPERATOR", "ADMIN", "RESTRICTED"]) }),
});

let recordCounter = 0;

// Source record shape consumed by the fixture adapter. Fields below `temporal` are the
// Wave 3B SpatialFeature projection extensions (domainState, temporal) the runtime must read.
export function sourceRecord(overrides = {}) {
  recordCounter += 1;
  const domain = overrides.domain ?? DOMAINS.PLACES;
  const level = overrides.level ?? PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC;
  const base = {
    domain,
    featureType: "location",
    sourceAuthority: DOMAIN_AUTHORITY[domain] ?? TEST_ONLY_SOURCE_AUTHORITY,
    sourceRecordId: `record-${String(recordCounter).padStart(4, "0")}`,
    coordinateFamily: COORDINATE_FAMILIES.METAVERSE,
    coordinateSpaceId: COORDINATE_SPACE,
    geometry: "point(41.25,63.10)",
    generalizedGeometry: null,
    layerId: LAYERS.STATIC,
    title: "Fixture place",
    label: "Fixture place",
    description: "Neutral Wave 3B fixture.",
    verificationState: "VERIFIED",
    publicationState: level,
    publicEligibility: { level, publicationState: level },
    evidenceReference: "wave3b-evidence-ref",
    domainState: null,
    temporal: {
      effectiveStart: null,
      effectiveEnd: null,
      sourceTimestamp: NOW,
      timezone: null,
      freshness: null,
      soonFlag: false,
    },
    provenanceOverrides: {},
  };
  const merged = { ...base, ...overrides, temporal: { ...base.temporal, ...(overrides.temporal || {}) } };
  delete merged.level;
  return deepFreeze(merged);
}

// Record with the leak probe planted in every private field that has free text.
export function leakProbeRecord(overrides = {}) {
  return sourceRecord({
    sourceRecordId: `${LEAK_PROBE}-record`,
    title: `Private ${LEAK_PROBE} title`,
    label: `Private ${LEAK_PROBE} label`,
    description: `Private ${LEAK_PROBE} description`,
    geometry: `point(${LEAK_PROBE})`,
    evidenceReference: `${LEAK_PROBE}-evidence`,
    ...overrides,
  });
}

export function featureIdFor(record) {
  return createSpatialFeatureId(record);
}

function createFixtureAdapter(domain) {
  const authority = DOMAIN_AUTHORITY[domain];
  return Object.freeze({
    getDomain: () => domain,
    getSourceAuthority: () => authority,
    getSupportedFeatureTypes: () => ["location"],
    getSupportedCoordinateSpaces: () => [COORDINATE_SPACE],
    getProjectionVersion: () => "wave3b-fixture-1",
    canProject: (record) => record?.domain === domain,
    project(record) {
      return {
        featureId: createSpatialFeatureId({
          domain: record.domain,
          featureType: record.featureType,
          sourceAuthority: record.sourceAuthority || "missing",
          sourceRecordId: record.sourceRecordId,
        }),
        featureType: record.featureType,
        domain: record.domain,
        sourceAuthority: record.sourceAuthority,
        sourceRecordId: record.sourceRecordId,
        coordinateFamily: record.coordinateFamily,
        coordinateSpaceId: record.coordinateSpaceId,
        geometry: record.geometry,
        generalizedGeometry: record.generalizedGeometry,
        layerId: record.layerId,
        title: record.title,
        label: record.label,
        verificationState: record.verificationState,
        publicationState: record.publicationState,
        publicEligibility: record.publicEligibility,
        provenance: {
          sourceAuthority: record.sourceAuthority,
          sourceRecordId: record.sourceRecordId,
          sourceReference: "wave3b-fixture-source",
          evidenceReference: record.evidenceReference,
          projectionAdapter: `wave3b-fixture-adapter:${domain}`,
          projectionVersion: "wave3b-fixture-1",
          coordinateProvenance: "fixture coordinate declaration",
          updatedAt: record.temporal.sourceTimestamp || NOW,
          freshness: record.temporal.freshness,
          ...record.provenanceOverrides,
        },
        updatedAt: record.temporal.sourceTimestamp || NOW,
        allowedInteractions: ["SELECT"],
        authorizedActionReferences: [],
        accessibility: { label: record.label, description: record.description, keyboardInteractions: ["SELECT"] },
        domainState: record.domainState,
        temporal: { ...record.temporal },
      };
    },
  });
}

export function createFixtureAdapters() {
  return [createFixtureAdapter(DOMAINS.PLACES), createFixtureAdapter(DOMAINS.SAFETY), createFixtureAdapter(DOMAINS.RUMOR)];
}

export const TEST_ONLY_EMERGENCY_ALLOWLIST = Object.freeze([
  Object.freeze({ sourceAuthority: TEST_ONLY_CONFIRMED_EMERGENCY_AUTHORITY, layerIds: Object.freeze(Object.values(LAYERS)) }),
]);

// Pass as `emergencyAuthorities` to build the pipeline with its production default (no option supplied).
export const PRODUCTION_DEFAULT_EMERGENCY_AUTHORITIES = Symbol("production-default-emergency-authorities");

// Builds the production pipeline (from the runtime module) with test-only adapters and policy.
export async function createTestPipeline({ clock = fixedClock(), emergencyAuthorities = TEST_ONLY_EMERGENCY_ALLOWLIST, adapters = createFixtureAdapters() } = {}) {
  const runtime = await loadProjectionRuntime();
  const adapterRegistry = runtime.createProjectionAdapterRegistry();
  for (const adapter of adapters) {
    const registration = adapterRegistry.register(adapter);
    if (!registration.ok) throw new Error(`fixture adapter registration failed: ${JSON.stringify(registration.diagnostics)}`);
  }
  const options = {
    adapterRegistry,
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry: createWave3BLayerRegistry(),
    clock,
  };
  if (emergencyAuthorities !== PRODUCTION_DEFAULT_EMERGENCY_AUTHORITIES) options.emergencyAuthorities = emergencyAuthorities;
  const pipeline = runtime.createSpatialProjectionPipeline(options);
  return { runtime, pipeline, adapterRegistry };
}

// Wave 2B selection for a (client-visible) feature.
export function selectionFor(feature, overrides = {}) {
  return {
    selectionId: `selection-${feature.featureId}`,
    featureId: feature.featureId,
    domain: feature.domain,
    sourceAuthority: feature.sourceAuthority,
    coordinateFamily: feature.coordinateFamily,
    coordinateSpaceId: feature.coordinateSpaceId,
    layerId: feature.layerId,
    selectionReason: "wave3b-test",
    timestamp: NOW,
    eligibleActions: [],
    ...overrides,
  };
}

export function isoOffset(ms, from = NOW) {
  return new Date(Date.parse(from) + ms).toISOString();
}

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export function sorted(values) {
  return [...values].sort();
}
