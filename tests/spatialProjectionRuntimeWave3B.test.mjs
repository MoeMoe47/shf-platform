// GEO-1 Wave 3B production red tests: Emergency (E), Masking / internal-client boundary (M),
// Diagnostics (D), Regression (R). Spec: docs/architecture/spatial-intelligence/geo-1/GEO-1_WAVE3B_TEST_PLAN.md
//
// These tests target the production runtime at src/system/spatial/projection/index.js, which does
// not exist yet. Until it does, runtime tests fail with "EXPECTED_MISSING_RUNTIME". Fixtures are
// test-only (tests/helpers/spatial/wave3bProjectionFixtures.mjs); nothing here implements runtime.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  COORDINATE_FAMILIES,
  DEFAULT_SPATIAL_LAYERS,
  SpatialLayerRegistry,
  defaultCoordinateSpaceRegistry,
  defaultSpatialLayerRegistry,
  validateCoordinateSpace,
  validatePublicationEligibility,
  validateSpatialFeature,
  validateSpatialInteraction,
  validateSpatialLayer,
  validateSpatialProvenance,
  validateSpatialSelection,
  validateTemporalProjection,
} from "../src/shared/spatial/index.js";
import { createSpatialSelectionStore } from "../src/system/spatial/index.js";
import {
  DOMAINS,
  LAYERS,
  LEAK_PROBE,
  PRODUCTION_DEFAULT_EMERGENCY_AUTHORITIES,
  REPO_ROOT,
  VIEWERS,
  WAVE3B_RUNTIME_DIR,
  containsLeakProbe,
  createFixtureAdapters,
  createTestPipeline,
  createWave3BLayerRegistry,
  featureIdFor,
  leakProbeRecord,
  loadProjectionRuntime,
  missingRuntime,
  requireSharedExport,
  selectionFor,
  sorted,
  sourceRecord,
} from "./helpers/spatial/wave3bProjectionFixtures.mjs";

// Canonical diagnostic catalog (addendum §7, GEO1-WAVE3B-DEC-006; INVALID_ADAPTER added by DEC-008, 17 codes per DEC-016).
// Kept literal here so the runtime cannot drift from the frozen design.
const EXPECTED_CATALOG = Object.freeze({
  ADAPTER_NOT_FOUND: { stage: "REGISTRY", severity: "ERROR", safeForClient: false, blocking: true, resultStatus: "INVALID" },
  ADAPTER_COLLISION: { stage: "REGISTRY", severity: "ERROR", safeForClient: false, blocking: true, resultStatus: null },
  INVALID_ADAPTER: { stage: "REGISTRY", severity: "ERROR", safeForClient: false, blocking: true, resultStatus: null },
  INVALID_SOURCE_AUTHORITY: { stage: "ADAPTER", severity: "ERROR", safeForClient: false, blocking: true, resultStatus: "INVALID" },
  INVALID_FEATURE: { stage: "VALIDATION", severity: "ERROR", safeForClient: false, blocking: true, resultStatus: "INVALID" },
  INVALID_PROVENANCE: { stage: "VALIDATION", severity: "ERROR", safeForClient: false, blocking: true, resultStatus: "INVALID" },
  UNKNOWN_COORDINATE_SPACE: { stage: "VALIDATION", severity: "ERROR", safeForClient: false, blocking: true, resultStatus: "INVALID" },
  COORDINATE_FAMILY_MISMATCH: { stage: "VALIDATION", severity: "ERROR", safeForClient: false, blocking: true, resultStatus: "INVALID" },
  INVALID_LAYER: { stage: "LAYER", severity: "ERROR", safeForClient: false, blocking: true, resultStatus: "INVALID" },
  INVALID_DOMAIN_STATE: { stage: "VALIDATION", severity: "ERROR", safeForClient: false, blocking: true, resultStatus: "INVALID" },
  INVALID_TEMPORAL_SOURCE: { stage: "VALIDATION", severity: "WARNING", safeForClient: false, blocking: false, resultStatus: null },
  NOT_PUBLISHED: { stage: "ELIGIBILITY", severity: "INFO", safeForClient: false, blocking: true, resultStatus: "SUPPRESSED" },
  RESTRICTED: { stage: "ELIGIBILITY", severity: "INFO", safeForClient: true, blocking: true, resultStatus: "RESTRICTED" },
  FEATURE_NOT_AVAILABLE: { stage: "ELIGIBILITY", severity: "INFO", safeForClient: true, blocking: true, resultStatus: null },
  STALE_SOURCE: { stage: "FRESHNESS", severity: "WARNING", safeForClient: true, blocking: "PER_STALE_POLICY", resultStatus: ["STALE", "SUPPRESSED", "UNAVAILABLE"] },
  EMERGENCY_AUTHORITY_NOT_CONFIRMED: { stage: "STATE_RESOLUTION", severity: "WARNING", safeForClient: false, blocking: false, resultStatus: null },
  EVENT_SOON_THRESHOLD_NOT_CONFIGURED: { stage: "STATE_RESOLUTION", severity: "INFO", safeForClient: false, blocking: false, resultStatus: null },
});

// GEO-1_WAVE3B_RUNTIME_CONTRACT.md §4, §6, §7 (GEO1-WAVE3B-DEC-013, DEC-014, DEC-016).
const CLIENT_PROVENANCE_ALLOWLIST = ["freshness", "publicationState", "sourceAuthority", "updatedAt", "verificationState"];
const PROJECTED_FEATURE_ALLOWLIST = [
  "allowedInteractions", "coordinateFamily", "coordinateSpaceId", "description", "domain", "featureId", "featureType",
  "geometry", "label", "layerId", "provenance", "publicEligibility", "publicationState", "sourceAuthority",
  "sourceRecordId", "title", "updatedAt", "verificationState",
];
const DETAIL_KEYS = ["expectedCoordinateFamily", "field", "issueCode", "maskMode", "receivedCoordinateFamily", "stalePolicy"];
const PAYLOAD_KEYS = ["title", "label", "description", "geometry", "generalizedGeometry", "evidenceReference", "sourceRecordId", "payload", "record", "feature"];

const codes = (result) => (result?.diagnostics || []).map((diagnostic) => diagnostic.code);

function diagnostic(result, code) {
  return (result?.diagnostics || []).find((entry) => entry.code === code);
}

// ---------------------------------------------------------------------------
// Emergency (E)
// ---------------------------------------------------------------------------

test("E01 domain-supplied EMERGENCY from an allowlisted verified authority is preserved and rendered", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord({ domain: DOMAINS.SAFETY, domainState: "EMERGENCY" });
  const internal = pipeline.project(record, { viewer: VIEWERS.PUBLIC });
  assert.equal(internal.kind, "INTERNAL");
  assert.equal(internal.status, "PROJECTED");
  assert.equal(internal.dimensions.domainState, "EMERGENCY");
  assert.equal(internal.dimensions.resolvedVisualState, "EMERGENCY");
  const client = pipeline.toClient(internal);
  assert.equal(client.kind, "CLIENT");
  assert.equal(client.presentation.resolvedVisualState, "EMERGENCY");
  assert.equal(client.accessibility.stateText, "Emergency");
});

test("E02 Spatial cannot infer EMERGENCY from title, layer name, alert highlight, or authority", async () => {
  const { pipeline } = await createTestPipeline();
  const cases = [
    sourceRecord({ title: "EMERGENCY evacuation", label: "Emergency shelter", description: "emergency" }),
    sourceRecord({ layerId: LAYERS.EMERGENCY_NAMED }),
    sourceRecord({ domain: DOMAINS.SAFETY }),
  ];
  for (const record of cases) {
    const featureId = featureIdFor(record);
    const internal = pipeline.project(record, { viewer: VIEWERS.OPERATOR, highlights: [{ featureId, source: "ALERT" }] });
    assert.equal(internal.dimensions.domainState, null, record.sourceRecordId);
    assert.notEqual(internal.dimensions.resolvedVisualState, "EMERGENCY", record.sourceRecordId);
  }
});

test("E03 unconfirmed authority EMERGENCY is retained internally, diagnosed, not rendered; production allowlist is empty", async () => {
  const { runtime, pipeline } = await createTestPipeline();
  assert.deepEqual([...runtime.PRODUCTION_EMERGENCY_AUTHORITIES], []);

  const rumor = sourceRecord({ domain: DOMAINS.RUMOR, domainState: "EMERGENCY" });
  const internal = pipeline.project(rumor, { viewer: VIEWERS.OPERATOR });
  assert.equal(internal.dimensions.domainState, "EMERGENCY");
  assert.notEqual(internal.dimensions.resolvedVisualState, "EMERGENCY");
  const warning = diagnostic(internal, "EMERGENCY_AUTHORITY_NOT_CONFIRMED");
  assert.ok(warning);
  assert.equal(warning.safeForClient, false);
  const client = pipeline.toClient(internal);
  assert.notEqual(client.presentation.resolvedVisualState, "EMERGENCY");
  assert.ok(!codes(client).includes("EMERGENCY_AUTHORITY_NOT_CONFIRMED"));

  const { pipeline: productionDefault } = await createTestPipeline({ emergencyAuthorities: PRODUCTION_DEFAULT_EMERGENCY_AUTHORITIES });
  const confirmedInTestsOnly = sourceRecord({ domain: DOMAINS.SAFETY, domainState: "EMERGENCY" });
  const defaultResult = productionDefault.project(confirmedInTestsOnly, { viewer: VIEWERS.OPERATOR });
  assert.notEqual(defaultResult.dimensions.resolvedVisualState, "EMERGENCY");
  assert.ok(codes(defaultResult).includes("EMERGENCY_AUTHORITY_NOT_CONFIRMED"));
});

test("E04 unverified EMERGENCY is not rendered on public surfaces and is labeled unverified for operators", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord({ domain: DOMAINS.SAFETY, domainState: "EMERGENCY", verificationState: "UNVERIFIED" });

  const publicClient = pipeline.toClient(pipeline.project(record, { viewer: VIEWERS.PUBLIC }));
  assert.notEqual(publicClient.presentation.resolvedVisualState, "EMERGENCY");
  assert.notEqual(publicClient.presentation.domainState, "EMERGENCY");
  assert.doesNotMatch(publicClient.accessibility.stateText, /emergency/i);

  const operatorClient = pipeline.toClient(pipeline.project(record, { viewer: VIEWERS.OPERATOR }));
  assert.equal(operatorClient.presentation.resolvedVisualState, "EMERGENCY");
  assert.equal(operatorClient.accessibility.stateText, "Unverified emergency report");
  assert.deepEqual([...operatorClient.presentation.modifiers], ["UNVERIFIED"]);
  assert.equal(operatorClient.accessibility.verificationText, "Unverified");
});

test("E05 EMERGENCY + SELECTED preserves both dimensions and resolves to EMERGENCY with selected modifier", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord({ domain: DOMAINS.SAFETY, domainState: "EMERGENCY" });
  const internal = pipeline.project(record, { viewer: VIEWERS.AUTHENTICATED, selection: { featureId: featureIdFor(record) } });
  assert.equal(internal.dimensions.domainState, "EMERGENCY");
  assert.equal(internal.dimensions.selectionState, "SELECTED");
  assert.equal(internal.dimensions.resolvedVisualState, "EMERGENCY");
  assert.ok(internal.dimensions.modifiers.includes("SELECTED"));
  assert.equal(pipeline.toClient(internal).accessibility.selected, true);
});

test("E06 EMERGENCY + RESTRICTED keeps the domain fact internally and discloses nothing to a non-eligible client", async () => {
  const { pipeline } = await createTestPipeline();
  const hidden = leakProbeRecord({ domain: DOMAINS.SAFETY, domainState: "EMERGENCY", level: "RESTRICTED" });
  const selection = { featureId: featureIdFor(hidden) };

  const internal = pipeline.project(hidden, { viewer: VIEWERS.AUTHENTICATED, selection });
  assert.equal(internal.status, "RESTRICTED");
  assert.equal(internal.dimensions.domainState, "EMERGENCY");
  assert.equal(internal.dimensions.selectionState, "SELECTED");
  assert.equal(internal.dimensions.publicationState, "RESTRICTED");
  assert.equal(internal.dimensions.availabilityState, "AVAILABLE");
  assert.equal(internal.dimensions.resolvedVisualState, "RESTRICTED");
  assert.equal(pipeline.toClient(internal), null, "default HIDE omits the feature");

  const notice = leakProbeRecord({ domain: DOMAINS.SAFETY, domainState: "EMERGENCY", level: "RESTRICTED", layerId: LAYERS.NOTICE });
  const noticeClient = pipeline.toClient(pipeline.project(notice, { viewer: VIEWERS.AUTHENTICATED }));
  assert.equal(noticeClient.presentation.domainState, undefined);
  assert.equal(noticeClient.presentation.modifiers, undefined, "masked clients receive no modifiers");
  assert.equal(noticeClient.accessibility.stateText, "Restricted");
  assert.ok(!JSON.stringify(noticeClient).toLowerCase().includes("emergency"));
  assert.ok(!containsLeakProbe(noticeClient));

  const eligible = pipeline.toClient(pipeline.project(hidden, { viewer: VIEWERS.OPERATOR, selection }));
  assert.equal(eligible.status, "PROJECTED");
  assert.equal(eligible.presentation.resolvedVisualState, "EMERGENCY");
});

test("E07 stale EMERGENCY follows the layer stale policy and never renders as a current emergency", async () => {
  const { pipeline } = await createTestPipeline();
  const expectations = [
    { layerId: LAYERS.MARK_STALE, status: "STALE" },
    { layerId: LAYERS.SUPPRESS, status: "SUPPRESSED" },
    { layerId: LAYERS.UNAVAILABLE, status: "UNAVAILABLE" },
    { layerId: LAYERS.STATIC, status: "STALE" },
  ];
  for (const { layerId, status } of expectations) {
    const record = sourceRecord({ domain: DOMAINS.SAFETY, domainState: "EMERGENCY", layerId, temporal: { freshness: "stale" } });
    const internal = pipeline.project(record, { viewer: VIEWERS.OPERATOR });
    assert.equal(internal.status, status, layerId);
    assert.equal(internal.dimensions.domainState, "EMERGENCY", layerId);
    assert.equal(internal.dimensions.freshnessState, "STALE", layerId);
    if (internal.dimensions.resolvedVisualState === "EMERGENCY") {
      assert.ok(internal.dimensions.modifiers.includes("STALE"), `${layerId}: stale emergency rendered without stale marker`);
    }
    if (status === "SUPPRESSED") assert.equal(pipeline.toClient(internal), null);
    if (status === "UNAVAILABLE") assert.equal(internal.dimensions.resolvedVisualState, "UNAVAILABLE");
  }
});

// ---------------------------------------------------------------------------
// Masking and internal / client boundary (M)
// ---------------------------------------------------------------------------

test("M01 NOT_PUBLISHED is omitted from client results with no placeholder, count, or payload", async () => {
  const { pipeline } = await createTestPipeline();
  const hidden = leakProbeRecord({ level: "NOT_PUBLISHED" });
  const visible = sourceRecord();
  const internal = pipeline.project(hidden, { viewer: VIEWERS.ADMIN });
  assert.equal(internal.status, "SUPPRESSED");
  assert.ok(codes(internal).includes("NOT_PUBLISHED"));
  assert.equal(pipeline.toClient(internal), null);
  const batch = pipeline.projectForClient([hidden, visible], { viewer: VIEWERS.ADMIN });
  assert.equal(batch.length, 1);
  assert.equal(batch[0].featureId, featureIdFor(visible));
  assert.ok(!containsLeakProbe(batch));
});

test("M02 RESTRICTED with default HIDE mask mode is omitted from client results", async () => {
  const { pipeline } = await createTestPipeline();
  const hidden = leakProbeRecord({ level: "RESTRICTED" });
  const internal = pipeline.project(hidden, { viewer: VIEWERS.AUTHENTICATED });
  assert.equal(internal.status, "RESTRICTED");
  assert.equal(internal.maskMode, "HIDE");
  assert.equal(pipeline.toClient(internal), null);
  assert.deepEqual(pipeline.projectForClient([hidden], { viewer: VIEWERS.AUTHENTICATED }), []);
});

test("M03 RESTRICTED NOTICE returns only the allowlisted placeholder fields", async () => {
  const { runtime, pipeline } = await createTestPipeline();
  const hidden = leakProbeRecord({ level: "RESTRICTED", layerId: LAYERS.NOTICE, domainState: "MISSION_ACTIVE" });
  const client = pipeline.toClient(pipeline.project(hidden, { viewer: VIEWERS.AUTHENTICATED, selection: { featureId: featureIdFor(hidden) } }));
  assert.deepEqual(sorted(Object.keys(client)), ["accessibility", "diagnostics", "kind", "layerId", "presentation", "resultRef", "status"]);
  assert.equal(client.status, "RESTRICTED");
  assert.equal(client.layerId, LAYERS.NOTICE);
  assert.deepEqual(client.presentation, { resolvedVisualState: "RESTRICTED" });
  assert.deepEqual(client.accessibility, { label: "Restricted item", stateText: "Restricted" });
  assert.deepEqual(client.diagnostics, [{ code: "RESTRICTED", message: runtime.PROJECTION_DIAGNOSTIC_CATALOG.RESTRICTED.message }]);
  assert.ok(!containsLeakProbe(client));

  // Constructive allowlist: every NOTICE on a layer is identical apart from resultRef (GEO1-WAVE3B-DEC-014).
  const other = sourceRecord({ level: "RESTRICTED", layerId: LAYERS.NOTICE, domain: DOMAINS.SAFETY, domainState: "EMERGENCY", title: "Other", verificationState: "UNVERIFIED", temporal: { freshness: "stale" } });
  const otherClient = pipeline.toClient(pipeline.project(other, { viewer: VIEWERS.AUTHENTICATED }));
  const { resultRef: _first, ...firstRest } = client;
  const { resultRef: _second, ...secondRest } = otherClient;
  assert.deepEqual(secondRest, firstRest);
});

test("M04 GENERALIZED returns only source-supplied generalized geometry and never derives one", async () => {
  const { pipeline } = await createTestPipeline();
  const withGeneralized = leakProbeRecord({ level: "RESTRICTED", layerId: LAYERS.GENERALIZED, generalizedGeometry: "region(north-quadrant)" });
  const client = pipeline.toClient(pipeline.project(withGeneralized, { viewer: VIEWERS.AUTHENTICATED }));
  assert.equal(client.geometry, "region(north-quadrant)");
  assert.ok(!containsLeakProbe(client));

  const withoutGeneralized = leakProbeRecord({ level: "RESTRICTED", layerId: LAYERS.GENERALIZED });
  const bare = pipeline.toClient(pipeline.project(withoutGeneralized, { viewer: VIEWERS.AUTHENTICATED }));
  assert.equal(bare?.geometry, undefined);
  assert.ok(!containsLeakProbe(bare));
});

test("M05 INVALID results leak no title, label, geometry, featureId, or sourceRecordId to clients", async () => {
  const { pipeline } = await createTestPipeline();
  const invalid = leakProbeRecord({ coordinateSpaceId: "metaverse.missing" });
  const internal = pipeline.project(invalid, { viewer: VIEWERS.ADMIN });
  assert.equal(internal.status, "INVALID");
  assert.equal(pipeline.toClient(internal), null);
  const batch = pipeline.projectForClient([invalid], { viewer: VIEWERS.ADMIN });
  assert.deepEqual(batch, []);
  const lookup = pipeline.lookupForClient(featureIdFor(invalid), { records: [invalid], viewer: VIEWERS.ADMIN });
  assert.equal(lookup.ok, false);
  assert.ok(!containsLeakProbe(lookup));
});

test("M06 feature ID injection: hidden and unknown IDs return byte-identical FEATURE_NOT_AVAILABLE", async () => {
  const { pipeline } = await createTestPipeline();
  const hidden = leakProbeRecord({ level: "RESTRICTED" });
  const records = [hidden, sourceRecord()];
  const computedHiddenId = featureIdFor(hidden);
  const hiddenLookup = pipeline.lookupForClient(computedHiddenId, { records, viewer: VIEWERS.AUTHENTICATED });
  const unknownLookup = pipeline.lookupForClient("spatial:wave3b-places:location:wave3b-test-only-source-authority:does-not-exist", { records, viewer: VIEWERS.AUTHENTICATED });
  assert.equal(hiddenLookup.ok, false);
  assert.deepEqual(hiddenLookup.diagnostics.map((entry) => entry.code), ["FEATURE_NOT_AVAILABLE"]);
  assert.equal(JSON.stringify(hiddenLookup), JSON.stringify(unknownLookup));
  assert.ok(!containsLeakProbe(hiddenLookup));
});

test("M07 resultRef is opaque, per-response, and not derived from featureId or sourceRecordId", async () => {
  const { pipeline } = await createTestPipeline();
  const notice = sourceRecord({ level: "RESTRICTED", layerId: LAYERS.NOTICE, sourceRecordId: "stable-record-id" });
  const first = pipeline.toClient(pipeline.project(notice, { viewer: VIEWERS.AUTHENTICATED }));
  const second = pipeline.toClient(pipeline.project(notice, { viewer: VIEWERS.AUTHENTICATED }));
  assert.equal(typeof first.resultRef, "string");
  assert.ok(first.resultRef.length > 0);
  assert.notEqual(first.resultRef, second.resultRef);
  for (const ref of [first.resultRef, second.resultRef]) {
    assert.notEqual(ref, featureIdFor(notice));
    assert.ok(!ref.includes("stable-record-id"));
    assert.ok(!ref.includes(notice.domain));
  }
});

test("M08 PROJECTED client provenance is limited to the client subset", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord();
  const client = pipeline.toClient(pipeline.project(record, { viewer: VIEWERS.PUBLIC }));
  assert.equal(client.status, "PROJECTED");
  assert.equal(client.featureId, featureIdFor(record));
  assert.deepEqual(sorted(Object.keys(client)), ["accessibility", "diagnostics", "feature", "featureId", "kind", "layerId", "presentation", "resultRef", "status"]);
  for (const key of Object.keys(client.feature)) assert.ok(PROJECTED_FEATURE_ALLOWLIST.includes(key), `unexpected client feature key ${key}`);
  for (const key of Object.keys(client.feature.provenance)) assert.ok(CLIENT_PROVENANCE_ALLOWLIST.includes(key), `unexpected client provenance key ${key}`);
  for (const key of ["evidenceReference", "coordinateProvenance", "projectionAdapter", "projectionVersion", "sourceReference"]) {
    assert.equal(client.feature.provenance[key], undefined, key);
  }
  assert.ok(!JSON.stringify(client).includes("wave3b-evidence-ref"));
});

test("M09 selection store seeded by the pipeline contains only client-visible features", async () => {
  const { pipeline } = await createTestPipeline();
  const visible = sourceRecord();
  const restricted = sourceRecord({ level: "RESTRICTED" });
  const unpublished = sourceRecord({ level: "NOT_PUBLISHED" });
  const features = pipeline.clientSelectableFeatures([visible, restricted, unpublished], { viewer: VIEWERS.AUTHENTICATED });
  assert.deepEqual(features.map((feature) => feature.featureId), [featureIdFor(visible)]);

  const store = createSpatialSelectionStore({ features, layerRegistry: createWave3BLayerRegistry() });
  assert.equal(store.select(selectionFor(features[0])).ok, true);
  const injected = selectionFor({ ...features[0], featureId: featureIdFor(restricted) });
  assert.equal(store.select(injected).ok, false);
  assert.equal(store.getFeature(featureIdFor(restricted)), null);
});

test("M10 ORGANIZATION, OPERATOR, and ADMIN levels are compared against supplied viewer context; missing context grants nothing", async () => {
  const { pipeline } = await createTestPipeline();
  const matrix = [
    { level: "ORGANIZATION", denied: VIEWERS.AUTHENTICATED, allowed: VIEWERS.ORGANIZATION },
    { level: "OPERATOR", denied: VIEWERS.ORGANIZATION, allowed: VIEWERS.OPERATOR },
    { level: "ADMIN", denied: VIEWERS.OPERATOR, allowed: VIEWERS.ADMIN },
  ];
  for (const { level, denied, allowed } of matrix) {
    const record = sourceRecord({ level });
    assert.equal(pipeline.project(record, { viewer: denied }).status, "RESTRICTED", `${level} denied`);
    assert.equal(pipeline.toClient(pipeline.project(record, { viewer: denied })), null, `${level} denied client`);
    assert.equal(pipeline.project(record, { viewer: allowed }).status, "PROJECTED", `${level} allowed`);
    assert.equal(pipeline.project(record, {}).status, "RESTRICTED", `${level} missing viewer`);
  }
});

// ---------------------------------------------------------------------------
// Diagnostics (D)
// ---------------------------------------------------------------------------

test("D01 every catalog code matches the frozen catalog and is emitted as a structured diagnostic", async () => {
  const { runtime, pipeline, adapterRegistry } = await createTestPipeline();
  assert.deepEqual(sorted(Object.keys(runtime.PROJECTION_DIAGNOSTIC_CATALOG)), sorted(Object.keys(EXPECTED_CATALOG)));
  for (const [code, expected] of Object.entries(EXPECTED_CATALOG)) {
    const row = runtime.PROJECTION_DIAGNOSTIC_CATALOG[code];
    for (const field of ["stage", "severity", "safeForClient", "blocking", "resultStatus"]) {
      assert.deepEqual(row[field], expected[field], `${code}.${field}`);
    }
    assert.equal(typeof row.message, "string", `${code}.message`);
    assert.ok(row.message.length > 0, `${code}.message`);
  }

  const scenarios = {
    ADAPTER_NOT_FOUND: [sourceRecord({ domain: "wave3b-unregistered" })],
    INVALID_SOURCE_AUTHORITY: [sourceRecord({ sourceAuthority: "" })],
    INVALID_FEATURE: [sourceRecord({ geometry: "" })],
    INVALID_PROVENANCE: [sourceRecord({ provenanceOverrides: { projectionVersion: "" } })],
    UNKNOWN_COORDINATE_SPACE: [sourceRecord({ coordinateSpaceId: "metaverse.missing" })],
    COORDINATE_FAMILY_MISMATCH: [sourceRecord({ coordinateFamily: COORDINATE_FAMILIES.REAL_WORLD })],
    INVALID_LAYER: [sourceRecord({ layerId: "wave3b.missing-layer" })],
    INVALID_DOMAIN_STATE: [sourceRecord({ domainState: "SELECTED" })],
    INVALID_TEMPORAL_SOURCE: [sourceRecord({ layerId: LAYERS.EVENTS, temporal: { effectiveStart: "2026-09-28T10:00:00", timezone: null } })],
    NOT_PUBLISHED: [sourceRecord({ level: "NOT_PUBLISHED" })],
    RESTRICTED: [sourceRecord({ level: "RESTRICTED" }), VIEWERS.AUTHENTICATED],
    STALE_SOURCE: [sourceRecord({ layerId: LAYERS.MARK_STALE, temporal: { freshness: "stale" } })],
    EMERGENCY_AUTHORITY_NOT_CONFIRMED: [sourceRecord({ domain: DOMAINS.RUMOR, domainState: "EMERGENCY" })],
    EVENT_SOON_THRESHOLD_NOT_CONFIGURED: [sourceRecord({ layerId: LAYERS.EVENTS_NO_THRESHOLD, temporal: { effectiveStart: "2026-09-27T12:30:00.000Z" } })],
  };
  for (const [code, [record, viewer = VIEWERS.ADMIN]] of Object.entries(scenarios)) {
    const internal = pipeline.project(record, { viewer });
    const emitted = diagnostic(internal, code);
    assert.ok(emitted, `${code} not emitted`);
    const expected = EXPECTED_CATALOG[code];
    assert.equal(emitted.stage, expected.stage, code);
    assert.equal(emitted.severity, expected.severity, code);
    assert.equal(emitted.safeForClient, expected.safeForClient, code);
    assert.equal(typeof emitted.blocking, "boolean", code);
    assert.equal(emitted.message, runtime.PROJECTION_DIAGNOSTIC_CATALOG[code].message, code);
    if (typeof expected.resultStatus === "string") assert.equal(internal.status, expected.resultStatus, code);
  }

  const collision = adapterRegistry.register(createFixtureAdapters()[0]);
  assert.equal(collision.diagnostics[0].code, "ADAPTER_COLLISION");

  const lookup = pipeline.lookupForClient("spatial:none:none:none:none", { records: [], viewer: VIEWERS.ADMIN });
  assert.deepEqual(lookup.diagnostics, [{ code: "FEATURE_NOT_AVAILABLE", message: runtime.PROJECTION_DIAGNOSTIC_CATALOG.FEATURE_NOT_AVAILABLE.message }]);
});

function listSourceFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) files.push(...listSourceFiles(path));
    else if (/\.(m?js|jsx|ts)$/.test(entry)) files.push(path);
  }
  return files;
}

test("D02 production projection modules never classify diagnostics by parsing message text", () => {
  const runtimeDir = resolve(REPO_ROOT, WAVE3B_RUNTIME_DIR);
  if (!existsSync(runtimeDir)) throw missingRuntime(`${WAVE3B_RUNTIME_DIR}/ does not exist`);
  const stringParsing = [
    /\b(error|err|e|message|msg|reason|errors\[\d+\])\s*\??\.\s*(includes|match|matchAll|startsWith|endsWith|search|indexOf)\s*\(/,
    /\.test\(\s*(error|err|e|message|msg|reason)\b/,
    /String\(\s*(error|err|e|message|msg)\b[^)]*\)\s*\.\s*(includes|match|startsWith|endsWith|search|indexOf)\s*\(/,
  ];
  const files = [...listSourceFiles(runtimeDir), ...listSourceFiles(resolve(REPO_ROOT, "src/shared/spatial/contracts"))];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const pattern of stringParsing) assert.doesNotMatch(source, pattern, `${file} classifies message text`);
  }
});

test("D03 ADAPTER_COLLISION rejects registration atomically and leaves the registry unchanged", async () => {
  const runtime = await loadProjectionRuntime();
  const registry = runtime.createProjectionAdapterRegistry();
  const [original] = createFixtureAdapters();
  assert.equal(registry.register(original).ok, true);
  const before = [...registry.listAdapters()];

  const [competitor] = createFixtureAdapters();
  const result = registry.register(competitor);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.length, 1);
  const [collision] = result.diagnostics;
  assert.equal(collision.code, "ADAPTER_COLLISION");
  assert.equal(collision.severity, "ERROR");
  assert.equal(collision.stage, "REGISTRY");
  assert.equal(collision.blocking, true);
  assert.equal(collision.safeForClient, false);
  assert.deepEqual([...registry.listAdapters()], before);
  const lookup = registry.getAdapter(original.getDomain(), "location");
  assert.equal(lookup.ok, true);
  assert.equal(lookup.adapter, original);
});

test("D04 identical re-registration and version changes collide; no replacement API exists", async () => {
  const runtime = await loadProjectionRuntime();
  const registry = runtime.createProjectionAdapterRegistry();
  const [original] = createFixtureAdapters();
  registry.register(original);
  assert.equal(registry.register(original).diagnostics?.[0]?.code, "ADAPTER_COLLISION");
  const nextVersion = Object.freeze({ ...original, getProjectionVersion: () => "wave3b-fixture-2" });
  assert.equal(registry.register(nextVersion).diagnostics?.[0]?.code, "ADAPTER_COLLISION");
  assert.equal(registry.getAdapter(original.getDomain(), "location").adapter, original);
  for (const name of ["replace", "override", "unregister", "upsert"]) assert.equal(registry[name], undefined, name);

  // Registration validates identity (GEO1-WAVE3B-DEC-008).
  const invalidAdapters = {
    "not frozen": { ...original, getDomain: () => "wave3b-unfrozen" },
    "empty domain": Object.freeze({ ...original, getDomain: () => "" }),
    "unnormalized domain": Object.freeze({ ...original, getDomain: () => "Wave3B Places" }),
    "no feature types": Object.freeze({ ...original, getDomain: () => "wave3b-no-types", getSupportedFeatureTypes: () => [] }),
    "no coordinate spaces": Object.freeze({ ...original, getDomain: () => "wave3b-no-spaces", getSupportedCoordinateSpaces: () => [] }),
    "empty projection version": Object.freeze({ ...original, getDomain: () => "wave3b-no-version", getProjectionVersion: () => "" }),
    "missing project": Object.freeze({ ...original, getDomain: () => "wave3b-no-project", project: undefined }),
  };
  for (const [label, adapter] of Object.entries(invalidAdapters)) {
    const result = registry.register(adapter);
    assert.equal(result.ok, false, label);
    assert.equal(result.diagnostics?.[0]?.code, "INVALID_ADAPTER", label);
  }
  assert.equal(registry.listAdapters().length, 1);

  // Identity is snapshotted at registration.
  let declaredDomain = "wave3b-snapshot";
  const mutable = Object.freeze({ ...createFixtureAdapters()[1], getDomain: () => declaredDomain });
  assert.equal(registry.register(mutable).ok, true);
  declaredDomain = "wave3b-changed";
  assert.equal(registry.getAdapter("wave3b-snapshot", "location").ok, true);
  assert.equal(registry.getAdapter("wave3b-changed", "location").ok, false);
});

test("D05 diagnostic messages are static per code and details carry no source payload", async () => {
  const { runtime, pipeline } = await createTestPipeline();
  const leaky = [
    leakProbeRecord({ coordinateSpaceId: "metaverse.missing" }),
    leakProbeRecord({ coordinateFamily: COORDINATE_FAMILIES.REAL_WORLD }),
    leakProbeRecord({ layerId: "wave3b.missing-layer" }),
    leakProbeRecord({ geometry: "" }),
    leakProbeRecord({ level: "NOT_PUBLISHED" }),
    leakProbeRecord({ layerId: LAYERS.MARK_STALE, temporal: { freshness: "stale" } }),
  ];
  const allowedDetailKeys = runtime.PROJECTION_DIAGNOSTIC_DETAIL_KEYS;
  assert.deepEqual(sorted(allowedDetailKeys), DETAIL_KEYS);
  for (const key of PAYLOAD_KEYS) assert.ok(!allowedDetailKeys.includes(key), `payload key ${key} is allowlisted`);

  const messagesByCode = new Map();
  for (const record of leaky) {
    for (const entry of pipeline.project(record, { viewer: VIEWERS.ADMIN }).diagnostics) {
      assert.equal(entry.message, runtime.PROJECTION_DIAGNOSTIC_CATALOG[entry.code].message, entry.code);
      assert.ok(!entry.message.toLowerCase().includes(LEAK_PROBE), entry.code);
      for (const key of Object.keys(entry.details || {})) assert.ok(allowedDetailKeys.includes(key), `${entry.code}.details.${key}`);
      assert.ok(!containsLeakProbe(entry.details), `${entry.code}.details`);
      if (messagesByCode.has(entry.code)) assert.equal(entry.message, messagesByCode.get(entry.code));
      messagesByCode.set(entry.code, entry.message);
    }
  }
});

test("D06 client results carry only client-safe diagnostics reduced to { code, message }", async () => {
  const { runtime, pipeline } = await createTestPipeline();
  const records = [
    sourceRecord({ layerId: LAYERS.MARK_STALE, temporal: { freshness: "stale" } }),
    sourceRecord({ layerId: LAYERS.EVENTS_NO_THRESHOLD, temporal: { effectiveStart: "2026-09-27T12:30:00.000Z" } }),
    sourceRecord({ domain: DOMAINS.RUMOR, domainState: "EMERGENCY" }),
    sourceRecord({ level: "RESTRICTED", layerId: LAYERS.NOTICE }),
    sourceRecord({ layerId: LAYERS.EVENTS, temporal: { effectiveStart: "2026-09-28T10:00:00", timezone: null } }),
  ];
  const clients = pipeline.projectForClient(records, { viewer: VIEWERS.AUTHENTICATED });
  assert.ok(clients.length > 0);
  for (const client of clients) {
    for (const entry of client.diagnostics) {
      assert.deepEqual(sorted(Object.keys(entry)), ["code", "message"]);
      assert.equal(runtime.PROJECTION_DIAGNOSTIC_CATALOG[entry.code].safeForClient, true, entry.code);
    }
  }
  const clientCodes = clients.flatMap((client) => codes(client));
  assert.ok(clientCodes.includes("STALE_SOURCE"));
  for (const unsafe of ["EVENT_SOON_THRESHOLD_NOT_CONFIGURED", "EMERGENCY_AUTHORITY_NOT_CONFIRMED", "INVALID_TEMPORAL_SOURCE"]) {
    assert.ok(!clientCodes.includes(unsafe), unsafe);
  }
});

test("D07 Wave 1 validators and registries expose additive structured issues while legacy error strings are unchanged", () => {
  const base = {
    featureId: "spatial:wave3b-places:location:wave3b-test-only-source-authority:record-d07",
    featureType: "location",
    domain: "wave3b-places",
    sourceAuthority: "wave3b-test-only-source-authority",
    sourceRecordId: "record-d07",
    coordinateFamily: COORDINATE_FAMILIES.METAVERSE,
    coordinateSpaceId: "metaverse.quick-map",
    geometry: "point(1,1)",
    layerId: "metaverse.quick-map.locations",
    verificationState: "VERIFIED",
    publicationState: "PUBLIC",
    publicEligibility: { level: "PUBLIC", publicationState: "PUBLIC" },
    provenance: { sourceAuthority: "a", sourceRecordId: "r", projectionAdapter: "p", projectionVersion: "1", updatedAt: "2026-09-27T12:00:00.000Z" },
    updatedAt: "2026-09-27T12:00:00.000Z",
    allowedInteractions: [],
    authorizedActionReferences: [],
  };
  const registries = { coordinateRegistry: defaultCoordinateSpaceRegistry, layerRegistry: defaultSpatialLayerRegistry };

  // Legacy strings first: these already pass and must never change.
  const featureCases = [
    { overrides: { coordinateSpaceId: "metaverse.missing" }, legacy: "unknown coordinate space: metaverse.missing", code: "UNKNOWN_COORDINATE_SPACE", field: "coordinateSpaceId" },
    { overrides: { coordinateFamily: COORDINATE_FAMILIES.REAL_WORLD }, legacy: "coordinate family mismatch for metaverse.quick-map: expected REAL_WORLD, got METAVERSE", code: "COORDINATE_FAMILY_MISMATCH", field: "coordinateSpaceId", details: { expectedCoordinateFamily: "REAL_WORLD", receivedCoordinateFamily: "METAVERSE" } },
    { overrides: { layerId: "wave3b.missing-layer" }, legacy: "unknown spatial layer: wave3b.missing-layer", code: "UNKNOWN_LAYER", field: "layerId" },
    { overrides: { provenance: { ...base.provenance, projectionVersion: "" } }, legacy: "provenance.projectionVersion is required", code: "PROVENANCE_FIELD_REQUIRED", field: "provenance.projectionVersion" },
  ];
  for (const { overrides, legacy } of featureCases) {
    assert.ok(validateSpatialFeature({ ...base, ...overrides }, registries).errors.includes(legacy), `legacy error string changed: ${legacy}`);
  }
  assert.equal(defaultCoordinateSpaceRegistry.get("metaverse.missing").error, "unknown coordinate space: metaverse.missing");
  assert.equal(defaultSpatialLayerRegistry.get("wave3b.missing-layer").error, "unknown spatial layer: wave3b.missing-layer");
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "metaverse.master-city").error, "no registered transform from metaverse.quick-map to metaverse.master-city");

  // Structured issues (GEO1-WAVE3B-DEC-010).
  const issueCodes = Object.values(requireSharedExport("VALIDATION_ISSUE_CODES"));
  const detailKeys = requireSharedExport("VALIDATION_ISSUE_DETAIL_KEYS");
  assert.deepEqual(sorted(detailKeys), ["expectedCoordinateFamily", "receivedCoordinateFamily"]);

  for (const { overrides, code, field, details } of featureCases) {
    const issue = validateSpatialFeature({ ...base, ...overrides }, registries).issues.find((entry) => entry.code === code);
    assert.ok(issue, code);
    assert.equal(issue.field, field, code);
    if (details) assert.deepEqual(issue.details, details, code);
  }

  const invalidInputs = {
    validateSpatialFeature: () => validateSpatialFeature({ ...base, geometry: "", coordinateSpaceId: "metaverse.missing", provenance: null }, registries),
    validateSpatialProvenance: () => validateSpatialProvenance(null),
    validatePublicationEligibility: () => validatePublicationEligibility({ level: "X", publicationState: "PUBLIC" }),
    validateCoordinateSpace: () => validateCoordinateSpace({ id: "x" }),
    validateSpatialLayer: () => validateSpatialLayer({ layerId: "x", supportedCoordinateSpaces: ["metaverse.missing"] }, defaultCoordinateSpaceRegistry),
    validateTemporalProjection: () => validateTemporalProjection({ temporalState: "sometime" }),
    validateSpatialSelection: () => validateSpatialSelection({ featureId: "x" }, registries),
    validateSpatialInteraction: () => validateSpatialInteraction({ type: "POKE" }),
  };
  for (const [name, run] of Object.entries(invalidInputs)) {
    const result = run();
    assert.equal(result.valid, false, name);
    assert.ok(Array.isArray(result.issues), `${name}.issues`);
    assert.equal(result.issues.length, result.errors.length, `${name} issues/errors parity`);
    result.issues.forEach((issue, index) => {
      assert.equal(issue.message, result.errors[index], `${name}[${index}] message twin`);
      assert.ok(issueCodes.includes(issue.code), `${name}[${index}] code ${issue.code}`);
      assert.ok(issue.field === null || typeof issue.field === "string", `${name}[${index}] field`);
      for (const key of Object.keys(issue.details || {})) assert.ok(detailKeys.includes(key), `${name}[${index}] details.${key}`);
    });
  }
  assert.equal(validateSpatialProvenance(null).issues[0].code, "PROVENANCE_REQUIRED");
  assert.ok(validatePublicationEligibility({ level: "X", publicationState: "PUBLIC" }).issues.every((issue) => issue.code === "PUBLICATION_ELIGIBILITY_INVALID"));

  const validFeature = validateSpatialFeature(base, registries);
  assert.deepEqual([...validFeature.errors], []);
  assert.deepEqual([...validFeature.issues], []);
  assert.deepEqual([...validateSpatialLayer(DEFAULT_SPATIAL_LAYERS[0], defaultCoordinateSpaceRegistry).issues], []);

  // Registry codes, additive to the unchanged `error` strings.
  assert.equal(defaultCoordinateSpaceRegistry.get("metaverse.missing").code, "UNKNOWN_COORDINATE_SPACE");
  assert.equal(defaultCoordinateSpaceRegistry.get("metaverse.quick-map", { expectedFamily: COORDINATE_FAMILIES.REAL_WORLD }).code, "COORDINATE_FAMILY_MISMATCH");
  assert.equal(defaultSpatialLayerRegistry.get("wave3b.missing-layer").code, "UNKNOWN_LAYER");
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "metaverse.master-city").code, "NO_REGISTERED_TRANSFORM");
  assert.throws(
    () => new SpatialLayerRegistry([DEFAULT_SPATIAL_LAYERS[1], DEFAULT_SPATIAL_LAYERS[1]], { coordinateRegistry: defaultCoordinateSpaceRegistry }),
    (error) => error.message === `Duplicate spatial layer id: ${DEFAULT_SPATIAL_LAYERS[1].layerId}` && error.code === "DUPLICATE_ID",
  );
});

// ---------------------------------------------------------------------------
// Regression (R)
// ---------------------------------------------------------------------------

test("R01 Wave 1, Wave 2A, Wave 2B, and Wave 3A suites still pass unmodified", () => {
  const suites = [
    "tests/spatialFoundationWave1.test.mjs",
    "tests/spatialSelectionInteractionWave2.test.mjs",
    "tests/spatialSelectionInteractionRuntimeWave2.test.mjs",
    "tests/spatialProjectionStateWave3.test.mjs",
  ];
  // NODE_TEST_CONTEXT is set by the outer runner and would redirect the child's report away from stdout.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const run = spawnSync(process.execPath, ["--test", "--test-reporter=tap", ...suites], { cwd: REPO_ROOT, env, encoding: "utf8", timeout: 120000 });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /# pass 53\b/);
  assert.match(run.stdout, /# fail 0\b/);
});

test("R02 coordinate isolation, no implicit transform, and no Franklin County fallback remain intact", () => {
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "metaverse.master-city").ok, false);
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.master-city", "metaverse.quick-map").ok, false);
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "real-world.latlng").ok, false);
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("real-world.latlng", "metaverse.master-city").ok, false);
  assert.equal(defaultCoordinateSpaceRegistry.get("metaverse.quick-map", { expectedFamily: COORDINATE_FAMILIES.REAL_WORLD }).ok, false);
  for (const layer of defaultSpatialLayerRegistry.list()) {
    assert.doesNotMatch(`${layer.layerId} ${layer.name}`, /franklin/i);
  }
  assert.equal(defaultCoordinateSpaceRegistry.get("real-world.franklin-county").ok, false);
});

test("R03 no production module imports Wave 3A or Wave 3B test fixtures", () => {
  const fixtureReference = /(tests\/helpers|wave3bProjectionFixtures|spatialProjectionStateWave3|spatialProjectionRuntimeWave3B|spatialPresentationStateWave3B|wave3a-fixture|wave3b-test-only)/;
  for (const root of ["src", "apps/shs-api/src"]) {
    const directory = resolve(REPO_ROOT, root);
    if (!existsSync(directory)) continue;
    for (const file of listSourceFiles(directory)) {
      assert.doesNotMatch(readFileSync(file, "utf8"), fixtureReference, file);
    }
  }
});
