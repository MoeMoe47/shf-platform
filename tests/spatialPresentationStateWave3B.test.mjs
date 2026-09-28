// GEO-1 Wave 3B production red tests: States (S), EVENT_SOON / temporal (T), Freshness and stale
// policy (F), State preservation and provenance (P).
// Spec: docs/architecture/spatial-intelligence/geo-1/GEO-1_WAVE3B_TEST_PLAN.md
//
// These tests target the production runtime at src/system/spatial/projection/index.js, which does
// not exist yet. Until it does, they fail with "EXPECTED_MISSING_RUNTIME". Fixtures are test-only.

import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SPATIAL_LAYERS,
  SpatialLayerRegistry,
  defaultCoordinateSpaceRegistry,
  validateSpatialLayer,
} from "../src/shared/spatial/index.js";
import { createSpatialSelectionStore } from "../src/system/spatial/index.js";
import {
  DOMAINS,
  HOUR,
  INVALID_LAYER_POLICY_CANDIDATES,
  LAYERS,
  MINUTE,
  NOW,
  VIEWERS,
  WAVE3B_FIXTURE_LAYERS,
  createTestPipeline,
  createWave3BLayerRegistry,
  featureIdFor,
  fixedClock,
  isoOffset,
  requireSharedExport,
  selectionFor,
  sorted,
  sourceRecord,
} from "./helpers/spatial/wave3bProjectionFixtures.mjs";

const codes = (result) => (result?.diagnostics || []).map((diagnostic) => diagnostic.code);
const selectedBy = (record) => ({ featureId: featureIdFor(record) });
const liveWindow = { effectiveStart: isoOffset(-HOUR), effectiveEnd: isoOffset(HOUR) };

// GEO-1_WAVE3B_RUNTIME_CONTRACT.md §4 client feature allowlist for UNAVAILABLE results.
const UNAVAILABLE_FEATURE_ALLOWLIST = [
  "allowedInteractions", "coordinateFamily", "coordinateSpaceId", "domain", "featureId", "featureType", "geometry",
  "label", "layerId", "provenance", "publicEligibility", "publicationState", "sourceAuthority", "sourceRecordId",
  "updatedAt", "verificationState",
];

function dimensionsWithout(dimensions, ...keys) {
  const copy = { ...dimensions };
  for (const key of keys) delete copy[key];
  return copy;
}

// ---------------------------------------------------------------------------
// States (S)
// ---------------------------------------------------------------------------

test("S01 NORMAL when no other dimension applies", async () => {
  const { pipeline } = await createTestPipeline();
  const internal = pipeline.project(sourceRecord(), { viewer: VIEWERS.PUBLIC });
  assert.equal(internal.status, "PROJECTED");
  assert.equal(internal.dimensions.resolvedVisualState, "NORMAL");
  assert.equal(internal.accessibility.stateText, "Normal");
});

test("S02 SELECTED is a presentation modifier that leaves the feature and every other dimension unchanged", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord();
  const plain = pipeline.project(record, { viewer: VIEWERS.PUBLIC });
  const selected = pipeline.project(record, { viewer: VIEWERS.PUBLIC, selection: selectedBy(record) });
  assert.equal(selected.dimensions.selectionState, "SELECTED");
  assert.equal(selected.dimensions.resolvedVisualState, "SELECTED");
  assert.equal(selected.accessibility.stateText, "Selected");
  assert.equal(selected.accessibility.selected, true);
  assert.deepEqual([...selected.dimensions.modifiers], ["SELECTED"], "modifier present even when SELECTED is dominant");
  assert.deepEqual(selected.feature, plain.feature);
  assert.deepEqual(
    dimensionsWithout(selected.dimensions, "selectionState", "resolvedVisualState", "modifiers"),
    dimensionsWithout(plain.dimensions, "selectionState", "resolvedVisualState", "modifiers"),
  );
});

test("S03 NEXT only when domain-supplied; Spatial never derives NEXT", async () => {
  const { pipeline } = await createTestPipeline();
  const next = pipeline.project(sourceRecord({ domainState: "NEXT" }), { viewer: VIEWERS.PUBLIC });
  assert.equal(next.dimensions.resolvedVisualState, "NEXT");
  assert.equal(next.accessibility.stateText, "Next step");

  const record = sourceRecord();
  const routed = pipeline.project(record, {
    viewer: VIEWERS.PUBLIC,
    selection: selectedBy(record),
    highlights: [{ featureId: featureIdFor(record), source: "ROUTE" }],
  });
  assert.equal(routed.dimensions.domainState, null);
  assert.notEqual(routed.dimensions.resolvedVisualState, "NEXT");
});

test("S04 SCHEDULED only when domain-supplied; a future start alone is upcoming and NORMAL", async () => {
  const { pipeline } = await createTestPipeline();
  const futureStart = isoOffset(48 * HOUR);

  const supplied = pipeline.project(sourceRecord({ layerId: LAYERS.EVENTS, domainState: "SCHEDULED", temporal: { effectiveStart: futureStart } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(supplied.dimensions.domainState, "SCHEDULED");
  assert.equal(supplied.dimensions.resolvedVisualState, "SCHEDULED");
  assert.match(supplied.accessibility.stateText, /^Scheduled/);

  const undated = pipeline.project(sourceRecord({ domainState: "SCHEDULED" }), { viewer: VIEWERS.PUBLIC });
  assert.equal(undated.dimensions.resolvedVisualState, "SCHEDULED");
  assert.equal(undated.dimensions.temporalState, null);
  assert.match(undated.accessibility.stateText, /Date not provided/);

  for (const layerId of [LAYERS.EVENTS, LAYERS.STATIC]) {
    const timeOnly = pipeline.project(sourceRecord({ layerId, temporal: { effectiveStart: futureStart } }), { viewer: VIEWERS.PUBLIC });
    assert.equal(timeOnly.dimensions.domainState, null, layerId);
    assert.equal(timeOnly.dimensions.temporalState, "upcoming", layerId);
    assert.equal(timeOnly.dimensions.resolvedVisualState, "NORMAL", layerId);
  }
});

test("S05 EVENT_SOON from a domain-supplied soon flag; never calculated without a flag or configured threshold", async () => {
  const { pipeline } = await createTestPipeline();
  const start = isoOffset(30 * MINUTE);
  const flagged = pipeline.project(sourceRecord({ layerId: LAYERS.EVENTS_NO_THRESHOLD, temporal: { effectiveStart: start, soonFlag: true } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(flagged.dimensions.domainState, null);
  assert.equal(flagged.dimensions.temporalState, "soon");
  assert.equal(flagged.dimensions.resolvedVisualState, "EVENT_SOON");
  assert.equal(flagged.accessibility.stateText, "Starting soon");

  const unflagged = pipeline.project(sourceRecord({ layerId: LAYERS.EVENTS_NO_THRESHOLD, temporal: { effectiveStart: start } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(unflagged.dimensions.temporalState, "upcoming");
  assert.equal(unflagged.dimensions.resolvedVisualState, "NORMAL");
});

test("S06 EVENT_LIVE from source start and end on a time-aware layer only", async () => {
  const { pipeline } = await createTestPipeline();
  const live = pipeline.project(sourceRecord({ layerId: LAYERS.EVENTS, temporal: liveWindow }), { viewer: VIEWERS.PUBLIC });
  assert.equal(live.dimensions.temporalState, "live");
  assert.equal(live.dimensions.resolvedVisualState, "EVENT_LIVE");
  assert.equal(live.accessibility.stateText, "Live now");

  const staticLayer = pipeline.project(sourceRecord({ layerId: LAYERS.STATIC, temporal: liveWindow }), { viewer: VIEWERS.PUBLIC });
  assert.equal(staticLayer.dimensions.temporalState, "live");
  assert.equal(staticLayer.dimensions.resolvedVisualState, "NORMAL");
});

test("S07 MISSION_ACTIVE is domain-supplied and preserved with SELECTED", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord({ domainState: "MISSION_ACTIVE" });
  const internal = pipeline.project(record, { viewer: VIEWERS.PUBLIC, selection: selectedBy(record) });
  assert.equal(internal.dimensions.domainState, "MISSION_ACTIVE");
  assert.equal(internal.dimensions.selectionState, "SELECTED");
  assert.equal(internal.dimensions.resolvedVisualState, "MISSION_ACTIVE");
  assert.ok(internal.dimensions.modifiers.includes("SELECTED"));
  assert.equal(internal.accessibility.stateText, "Mission active");
});

test("S08 EMERGENCY is domain-supplied by an allowlisted authority (see E01)", async () => {
  const { pipeline } = await createTestPipeline();
  const internal = pipeline.project(sourceRecord({ domain: DOMAINS.SAFETY, domainState: "EMERGENCY" }), { viewer: VIEWERS.PUBLIC });
  assert.equal(internal.dimensions.resolvedVisualState, "EMERGENCY");
  assert.equal(internal.accessibility.stateText, "Emergency");
});

test("S09 RESTRICTED is compared from supplied eligibility and never granted or upgraded", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord({ level: "RESTRICTED" });
  const denied = pipeline.project(record, { viewer: VIEWERS.AUTHENTICATED });
  assert.equal(denied.status, "RESTRICTED");
  assert.equal(denied.dimensions.publicationState, "RESTRICTED");
  assert.equal(denied.dimensions.resolvedVisualState, "RESTRICTED");
  assert.equal(denied.accessibility.stateText, "Restricted");

  const allowed = pipeline.project(record, { viewer: VIEWERS.OPERATOR });
  assert.equal(allowed.status, "PROJECTED");
  assert.equal(allowed.dimensions.publicationState, "RESTRICTED");
});

test("S10 CLOSED outranks temporal visuals while the temporal category is retained", async () => {
  const { pipeline } = await createTestPipeline();
  const internal = pipeline.project(sourceRecord({ layerId: LAYERS.EVENTS, domainState: "CLOSED", temporal: liveWindow }), { viewer: VIEWERS.PUBLIC });
  assert.equal(internal.dimensions.resolvedVisualState, "CLOSED");
  assert.equal(internal.dimensions.temporalState, "live");
  assert.equal(internal.accessibility.stateText, "Closed");
});

test("S11 COMPLETED outranks temporal visuals while the temporal category is retained", async () => {
  const { pipeline } = await createTestPipeline();
  const internal = pipeline.project(sourceRecord({ layerId: LAYERS.EVENTS, domainState: "COMPLETED", temporal: liveWindow }), { viewer: VIEWERS.PUBLIC });
  assert.equal(internal.dimensions.resolvedVisualState, "COMPLETED");
  assert.equal(internal.dimensions.temporalState, "live");
  assert.equal(internal.accessibility.stateText, "Completed");
});

test("S12 UNAVAILABLE from layer lifecycle, stale policy, and domain supply, each recording its reason", async () => {
  const { pipeline } = await createTestPipeline();
  const available = pipeline.project(sourceRecord(), { viewer: VIEWERS.PUBLIC });
  assert.equal(available.dimensions.availabilityState, "AVAILABLE");
  assert.equal(available.dimensions.availabilityReason, null, "reason is null if and only if AVAILABLE");

  for (const layerId of [LAYERS.DISCONNECTED, LAYERS.UNMOUNTED, LAYERS.ARCHIVED]) {
    const internal = pipeline.project(sourceRecord({ layerId }), { viewer: VIEWERS.PUBLIC });
    assert.equal(internal.status, "UNAVAILABLE", layerId);
    assert.equal(internal.dimensions.availabilityState, "UNAVAILABLE", layerId);
    assert.equal(internal.dimensions.availabilityReason, "LAYER_LIFECYCLE", layerId);
    assert.equal(internal.dimensions.resolvedVisualState, "UNAVAILABLE", layerId);
    assert.match(internal.accessibility.stateText, /^Unavailable/, layerId);
  }
  const stale = pipeline.project(sourceRecord({ layerId: LAYERS.UNAVAILABLE, temporal: { freshness: "stale" } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(stale.dimensions.availabilityReason, "STALE_POLICY");
  assert.equal(stale.dimensions.resolvedVisualState, "UNAVAILABLE");

  const supplied = pipeline.project(sourceRecord({ domainState: "UNAVAILABLE" }), { viewer: VIEWERS.PUBLIC });
  assert.equal(supplied.dimensions.domainState, "UNAVAILABLE");
  assert.equal(supplied.dimensions.availabilityState, "UNAVAILABLE");
  assert.equal(supplied.dimensions.availabilityReason, "DOMAIN_SUPPLIED");
  assert.equal(supplied.dimensions.resolvedVisualState, "UNAVAILABLE");
  assert.ok(!codes(supplied).includes("STALE_SOURCE"), "DOMAIN_SUPPLIED emits no diagnostic");

  // Precedence: LAYER_LIFECYCLE › STALE_POLICY › DOMAIN_SUPPLIED (GEO1-WAVE3B-DEC-011).
  const lifecycleAndDomain = pipeline.project(sourceRecord({ layerId: LAYERS.ARCHIVED, domainState: "UNAVAILABLE" }), { viewer: VIEWERS.PUBLIC });
  assert.equal(lifecycleAndDomain.dimensions.availabilityReason, "LAYER_LIFECYCLE");
  const staleAndDomain = pipeline.project(sourceRecord({ layerId: LAYERS.UNAVAILABLE, domainState: "UNAVAILABLE", temporal: { freshness: "stale" } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(staleAndDomain.dimensions.availabilityReason, "STALE_POLICY");
});

test("S13 domain may not supply Spatial-owned, restriction, temporal, or unknown states", async () => {
  const { pipeline } = await createTestPipeline();
  for (const domainState of ["NORMAL", "SELECTED", "RESTRICTED", "EVENT_SOON", "EVENT_LIVE", "PARTY_TIME"]) {
    const internal = pipeline.project(sourceRecord({ domainState }), { viewer: VIEWERS.PUBLIC });
    assert.equal(internal.status, "INVALID", domainState);
    assert.ok(codes(internal).includes("INVALID_DOMAIN_STATE"), domainState);
  }
});

// ---------------------------------------------------------------------------
// EVENT_SOON and temporal (T)
// ---------------------------------------------------------------------------

test("T01 no threshold and no domain flag: a future event is upcoming, never soon", async () => {
  const { pipeline } = await createTestPipeline();
  const start = isoOffset(30 * MINUTE);
  const timeAware = pipeline.project(sourceRecord({ layerId: LAYERS.EVENTS_NO_THRESHOLD, temporal: { effectiveStart: start } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(timeAware.dimensions.temporalState, "upcoming");
  assert.notEqual(timeAware.dimensions.resolvedVisualState, "EVENT_SOON");
  const notice = timeAware.diagnostics.find((entry) => entry.code === "EVENT_SOON_THRESHOLD_NOT_CONFIGURED");
  assert.ok(notice);
  assert.equal(notice.safeForClient, false);

  const staticLayer = pipeline.project(sourceRecord({ layerId: LAYERS.STATIC, temporal: { effectiveStart: start } }), { viewer: VIEWERS.PUBLIC });
  assert.ok(!codes(staticLayer).includes("EVENT_SOON_THRESHOLD_NOT_CONFIGURED"));
});

test("T02 a domain-configured threshold produces EVENT_SOON inside the window", async () => {
  const { pipeline } = await createTestPipeline();
  const internal = pipeline.project(sourceRecord({ layerId: LAYERS.EVENTS, temporal: { effectiveStart: isoOffset(HOUR) } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(internal.dimensions.temporalState, "soon");
  assert.equal(internal.dimensions.resolvedVisualState, "EVENT_SOON");
  assert.equal(internal.accessibility.stateText, "Starting soon");
});

test("T03 EVENT_SOON window boundaries: inclusive at start minus threshold, exclusive at start", async () => {
  const { pipeline } = await createTestPipeline();
  const categoryAt = (temporal) => pipeline.project(sourceRecord({ layerId: LAYERS.EVENTS, temporal }), { viewer: VIEWERS.PUBLIC }).dimensions.temporalState;
  assert.equal(categoryAt({ effectiveStart: isoOffset(2 * HOUR) }), "soon", "exactly start - threshold");
  assert.equal(categoryAt({ effectiveStart: isoOffset(2 * HOUR + 1) }), "upcoming", "1 ms before the window");
  assert.equal(categoryAt({ effectiveStart: isoOffset(1) }), "soon", "1 ms before start");
  assert.equal(categoryAt({ effectiveStart: NOW, effectiveEnd: isoOffset(HOUR) }), "live", "at start with end");
  assert.notEqual(categoryAt({ effectiveStart: NOW }), "soon", "at start without end");
});

test("T04 timezone: local times resolve on the absolute instant across DST; local time without timezone is invalid", async () => {
  // 2026-11-01 05:00Z is 01:00 EDT; US DST ends at 06:00Z. 02:30 local after fallback is EST = 07:30Z (2.5h away).
  const { pipeline } = await createTestPipeline({ clock: fixedClock("2026-11-01T05:00:00.000Z") });
  const project = (temporal) => pipeline.project(sourceRecord({ layerId: LAYERS.EVENTS, temporal }), { viewer: VIEWERS.PUBLIC });

  assert.equal(project({ effectiveStart: "2026-11-01T02:30:00", timezone: "America/New_York" }).dimensions.temporalState, "upcoming");
  assert.equal(project({ effectiveStart: "2026-11-01T02:00:00", timezone: "America/New_York" }).dimensions.temporalState, "soon");
  assert.equal(project({ effectiveStart: "2026-11-01T06:30:00.000Z" }).dimensions.temporalState, "soon");

  const ambiguous = project({ effectiveStart: "2026-11-01T06:00:00", timezone: null });
  assert.equal(ambiguous.status, "PROJECTED");
  assert.equal(ambiguous.dimensions.temporalState, null);
  assert.ok(codes(ambiguous).includes("INVALID_TEMPORAL_SOURCE"));
});

// Re-scoped by GEO1-WAVE3B-DEC-015: malformed or authority-less layer policy (including soonThreshold)
// is rejected at layer registration instead of being diagnosed at projection time.
test("T05 layer policy fields (soonThreshold, maxSourceAge, stalePolicy, maskMode) are validated at registration", () => {
  const stalePolicies = requireSharedExport("SPATIAL_LAYER_STALE_POLICIES");
  const maskModes = requireSharedExport("SPATIAL_LAYER_MASK_MODES");
  assert.deepEqual(sorted(Object.values(stalePolicies)), ["MARK_STALE", "SUPPRESS", "UNAVAILABLE"]);
  assert.deepEqual(sorted(Object.values(maskModes)), ["GENERALIZED", "HIDE", "NOTICE"]);

  for (const layer of [...WAVE3B_FIXTURE_LAYERS, ...DEFAULT_SPATIAL_LAYERS]) {
    const result = validateSpatialLayer(layer, defaultCoordinateSpaceRegistry);
    assert.equal(result.valid, true, `${layer.layerId}: ${result.errors.join("; ")}`);
  }
  for (const { field, layer } of INVALID_LAYER_POLICY_CANDIDATES) {
    const result = validateSpatialLayer(layer, defaultCoordinateSpaceRegistry);
    assert.equal(result.valid, false, layer.layerId);
    assert.ok(result.issues.some((issue) => issue.code === "LAYER_POLICY_INVALID" && issue.field === field), `${layer.layerId} → ${field}`);
    assert.throws(
      () => new SpatialLayerRegistry([layer], { coordinateRegistry: defaultCoordinateSpaceRegistry }),
      (error) => error.code === "DEFINITION_INVALID" && error.issues.some((issue) => issue.code === "LAYER_POLICY_INVALID"),
      layer.layerId,
    );
  }
});

test("T06 temporal visuals never appear on layers without timeAwareCapability", async () => {
  const { pipeline } = await createTestPipeline();
  const live = pipeline.project(sourceRecord({ layerId: LAYERS.STATIC, temporal: liveWindow }), { viewer: VIEWERS.PUBLIC });
  assert.equal(live.dimensions.temporalState, "live");
  assert.equal(live.dimensions.resolvedVisualState, "NORMAL");
  const flagged = pipeline.project(sourceRecord({ layerId: LAYERS.STATIC, temporal: { effectiveStart: isoOffset(30 * MINUTE), soonFlag: true } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(flagged.dimensions.temporalState, "soon");
  assert.equal(flagged.dimensions.resolvedVisualState, "NORMAL");
});

test("T07 domain CLOSED or COMPLETED outranks EVENT_SOON and EVENT_LIVE", async () => {
  const { pipeline } = await createTestPipeline();
  for (const domainState of ["CLOSED", "COMPLETED"]) {
    const live = pipeline.project(sourceRecord({ layerId: LAYERS.EVENTS, domainState, temporal: liveWindow }), { viewer: VIEWERS.PUBLIC });
    assert.equal(live.dimensions.resolvedVisualState, domainState);
    const soon = pipeline.project(sourceRecord({ layerId: LAYERS.EVENTS, domainState, temporal: { effectiveStart: isoOffset(HOUR) } }), { viewer: VIEWERS.PUBLIC });
    assert.equal(soon.dimensions.resolvedVisualState, domainState);
    assert.equal(soon.dimensions.temporalState, "soon");
  }
});

test("T08 temporal resolution is deterministic and never reads the system clock", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord({ layerId: LAYERS.EVENTS, temporal: { effectiveStart: isoOffset(HOUR), effectiveEnd: isoOffset(3 * HOUR) } });
  const RealDate = globalThis.Date;
  class GuardedDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) throw new Error("implicit system clock read: new Date()");
      super(...args);
    }
    static now() {
      throw new Error("implicit system clock read: Date.now()");
    }
  }
  let first;
  let second;
  globalThis.Date = GuardedDate;
  try {
    first = pipeline.project(record, { viewer: VIEWERS.PUBLIC });
    second = pipeline.project(record, { viewer: VIEWERS.PUBLIC });
  } finally {
    globalThis.Date = RealDate;
  }
  assert.deepEqual(first, second);
  assert.equal(first.dimensions.temporalState, "soon");
});

// ---------------------------------------------------------------------------
// Freshness and stale policy (F)
// ---------------------------------------------------------------------------

test("F01 MARK_STALE renders with a stale marker, stays inspectable, and describes staleness", async () => {
  const { pipeline } = await createTestPipeline();
  const internal = pipeline.project(sourceRecord({ layerId: LAYERS.MARK_STALE, temporal: { freshness: "stale" } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(internal.status, "STALE");
  assert.equal(internal.dimensions.freshnessState, "STALE");
  assert.ok(internal.dimensions.modifiers.includes("STALE"));
  const client = pipeline.toClient(internal);
  assert.ok(client.feature);
  assert.ok(codes(client).includes("STALE_SOURCE"));
  assert.equal(client.accessibility.freshnessText, `Information may be out of date (last updated ${NOW})`);
});

test("F02 SUPPRESS omits the stale feature from clients with STALE_SOURCE", async () => {
  const { pipeline } = await createTestPipeline();
  const internal = pipeline.project(sourceRecord({ layerId: LAYERS.SUPPRESS, temporal: { freshness: "stale" } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(internal.status, "SUPPRESSED");
  assert.ok(codes(internal).includes("STALE_SOURCE"));
  assert.equal(pipeline.toClient(internal), null);
});

test("F03 UNAVAILABLE policy returns a disabled placeholder with label and geometry only", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord({ layerId: LAYERS.UNAVAILABLE, temporal: { freshness: "stale" } });
  const internal = pipeline.project(record, { viewer: VIEWERS.PUBLIC });
  assert.equal(internal.status, "UNAVAILABLE");
  assert.equal(internal.accessibility.stateText, "Unavailable: information is out of date");
  const client = pipeline.toClient(internal);
  assert.equal(client.featureId, featureIdFor(record));
  assert.equal(client.feature.label, record.label);
  assert.equal(client.feature.geometry, record.geometry);
  assert.equal(client.feature.title, undefined);
  assert.equal(client.feature.description, undefined);
  assert.deepEqual([...client.feature.allowedInteractions], []);
  for (const key of Object.keys(client.feature)) assert.ok(UNAVAILABLE_FEATURE_ALLOWLIST.includes(key), `unexpected UNAVAILABLE client feature key ${key}`);
  assert.equal(client.presentation.availabilityReason, "STALE_POLICY");
});

test("F04 undeclared stale policy behaves as MARK_STALE", async () => {
  const { pipeline } = await createTestPipeline();
  const internal = pipeline.project(sourceRecord({ layerId: LAYERS.STATIC, temporal: { freshness: "stale" } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(internal.status, "STALE");
  assert.ok(internal.dimensions.modifiers.includes("STALE"));
});

test("F05 unreported freshness is UNKNOWN: neither stale nor current, no marker", async () => {
  const { pipeline } = await createTestPipeline();
  const unknown = pipeline.project(sourceRecord({ layerId: LAYERS.STATIC }), { viewer: VIEWERS.PUBLIC });
  assert.equal(unknown.dimensions.freshnessState, "UNKNOWN");
  assert.equal(unknown.status, "PROJECTED");
  assert.ok(!unknown.dimensions.modifiers.includes("STALE"));
  assert.ok(!codes(unknown).includes("STALE_SOURCE"));
  const current = pipeline.project(sourceRecord({ layerId: LAYERS.STATIC, temporal: { freshness: "current" } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(current.dimensions.freshnessState, "CURRENT");
});

// maxSourceAge without freshnessAuthority is now rejected at registration (T05, GEO1-WAVE3B-DEC-015).
test("F06 layer-declared maxSourceAge calculates freshness; supplied freshness wins; no maxSourceAge means UNKNOWN", async () => {
  const { pipeline } = await createTestPipeline();
  const freshnessOf = (layerId, temporal) => pipeline.project(sourceRecord({ layerId, temporal }), { viewer: VIEWERS.PUBLIC }).dimensions.freshnessState;
  assert.equal(freshnessOf(LAYERS.MAX_AGE, { sourceTimestamp: isoOffset(-2 * HOUR) }), "STALE");
  assert.equal(freshnessOf(LAYERS.MAX_AGE, { sourceTimestamp: isoOffset(-30 * MINUTE) }), "CURRENT");
  assert.equal(freshnessOf(LAYERS.MAX_AGE, { sourceTimestamp: isoOffset(-2 * HOUR), freshness: "current" }), "CURRENT");
  assert.equal(freshnessOf(LAYERS.STATIC, { sourceTimestamp: isoOffset(-48 * HOUR) }), "UNKNOWN", "no maxSourceAge means no calculated freshness");
});

test("F07 stale selection: preserved under MARK_STALE and UNAVAILABLE, cleared when SUPPRESS removes the feature", async () => {
  const { pipeline } = await createTestPipeline();
  const expectations = [
    { layerId: LAYERS.MARK_STALE, kept: true },
    { layerId: LAYERS.UNAVAILABLE, kept: true },
    { layerId: LAYERS.SUPPRESS, kept: false },
  ];
  for (const { layerId, kept } of expectations) {
    const current = sourceRecord({ layerId, sourceRecordId: `f07-${layerId.replace(/\W/g, "-")}`, temporal: { freshness: "current" } });
    const stale = sourceRecord({ layerId, sourceRecordId: current.sourceRecordId, temporal: { freshness: "stale" } });
    const store = createSpatialSelectionStore({
      features: pipeline.clientSelectableFeatures([current], { viewer: VIEWERS.PUBLIC }),
      layerRegistry: createWave3BLayerRegistry(),
    });
    const [feature] = store.listFeatures();
    assert.equal(store.select(selectionFor(feature)).ok, true, layerId);
    store.replaceFeatures(pipeline.clientSelectableFeatures([stale], { viewer: VIEWERS.PUBLIC }));
    assert.equal(store.getSelection() !== null, kept, layerId);
  }
});

test("F08 stale + restricted: restriction is evaluated first and masked clients get no freshness data", async () => {
  const { pipeline } = await createTestPipeline();
  const internal = pipeline.project(sourceRecord({ level: "RESTRICTED", layerId: LAYERS.NOTICE, temporal: { freshness: "stale" } }), { viewer: VIEWERS.AUTHENTICATED });
  assert.equal(internal.status, "RESTRICTED");
  const client = pipeline.toClient(internal);
  assert.equal(client.presentation.freshnessState, undefined);
  assert.equal(client.accessibility.freshnessText, undefined);
  assert.ok(!codes(client).includes("STALE_SOURCE"));
});

// ---------------------------------------------------------------------------
// State preservation and provenance (P)
// ---------------------------------------------------------------------------

test("P01 domainState equals the source value across every dimension combination", async () => {
  const { pipeline } = await createTestPipeline();
  const domainStates = [null, "NEXT", "SCHEDULED", "MISSION_ACTIVE", "CLOSED", "COMPLETED", "UNAVAILABLE"];
  for (const domainState of domainStates) {
    for (const selected of [false, true]) {
      for (const highlight of [null, "FOCUS"]) {
        for (const freshness of [null, "stale"]) {
          const record = sourceRecord({ layerId: LAYERS.EVENTS, domainState, temporal: { ...liveWindow, freshness } });
          const featureId = featureIdFor(record);
          const internal = pipeline.project(record, {
            viewer: VIEWERS.PUBLIC,
            selection: selected ? { featureId } : null,
            highlights: highlight ? [{ featureId, source: highlight }] : [],
          });
          assert.equal(internal.dimensions.domainState, domainState, JSON.stringify({ domainState, selected, highlight, freshness }));
        }
      }
    }
  }
  const emergency = pipeline.project(sourceRecord({ domain: DOMAINS.SAFETY, domainState: "EMERGENCY", temporal: { freshness: "stale" } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(emergency.dimensions.domainState, "EMERGENCY");
});

test("P02 temporal category is not overwritten by domain, selection, or highlight", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord({ layerId: LAYERS.EVENTS, domainState: "CLOSED", temporal: liveWindow });
  const featureId = featureIdFor(record);
  const internal = pipeline.project(record, { viewer: VIEWERS.PUBLIC, selection: { featureId }, highlights: [{ featureId, source: "SEARCH" }] });
  assert.equal(internal.dimensions.temporalState, "live");
});

test("P03 projection with selection mutates no source record, feature, or other dimension", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord({ domainState: "MISSION_ACTIVE" });
  const before = JSON.stringify(record);
  assert.ok(Object.isFrozen(record) && Object.isFrozen(record.temporal));
  const plain = pipeline.project(record, { viewer: VIEWERS.PUBLIC });
  const selected = pipeline.project(record, { viewer: VIEWERS.PUBLIC, selection: selectedBy(record) });
  assert.equal(JSON.stringify(record), before);
  assert.deepEqual(selected.feature, plain.feature);
  assert.equal(selected.feature.domainState ?? selected.dimensions.domainState, "MISSION_ACTIVE");
});

test("P04 highlight is transient, multi-source, keyboard-capable, and never alters other stages", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord();
  const featureId = featureIdFor(record);
  const plain = pipeline.project(record, { viewer: VIEWERS.PUBLIC });
  const highlighted = pipeline.project(record, {
    viewer: VIEWERS.PUBLIC,
    highlights: [{ featureId, source: "SEARCH" }, { featureId, source: "FOCUS" }, { featureId: "spatial:other:location:x:y", source: "HOVER" }],
  });
  assert.deepEqual(sorted(highlighted.dimensions.highlightState.sources), ["FOCUS", "SEARCH"]);
  assert.deepEqual([...highlighted.dimensions.modifiers], ["HIGHLIGHTED"]);
  assert.equal(highlighted.accessibility.highlighted, true);
  assert.equal(highlighted.dimensions.selectionState, null);
  assert.equal(highlighted.dimensions.resolvedVisualState, "NORMAL");
  assert.deepEqual(
    dimensionsWithout(highlighted.dimensions, "highlightState", "modifiers"),
    dimensionsWithout(plain.dimensions, "highlightState", "modifiers"),
  );
  assert.equal(highlighted.status, plain.status);

  const selectionSourced = pipeline.project(record, { viewer: VIEWERS.PUBLIC, highlights: [{ featureId, source: "SELECTION" }] });
  assert.equal(selectionSourced.dimensions.selectionState, null, "a SELECTION highlight source does not create selection");

  const after = pipeline.project(record, { viewer: VIEWERS.PUBLIC });
  assert.equal(after.dimensions.highlightState, null, "highlight leaves no residue");
  assert.deepEqual([...after.dimensions.modifiers], []);

  // Closed vocabulary in fixed order, unique (GEO1-WAVE3B-DEC-012).
  const everything = sourceRecord({ layerId: LAYERS.MARK_STALE, verificationState: "UNVERIFIED", temporal: { freshness: "stale" } });
  const everythingId = featureIdFor(everything);
  const full = pipeline.project(everything, {
    viewer: VIEWERS.PUBLIC,
    selection: { featureId: everythingId },
    highlights: [{ featureId: everythingId, source: "FOCUS" }, { featureId: everythingId, source: "SEARCH" }],
  });
  assert.deepEqual([...full.dimensions.modifiers], ["SELECTED", "HIGHLIGHTED", "STALE", "UNVERIFIED"]);
  assert.equal(full.accessibility.verificationText, "Unverified");
});

test("P05 publication and verification state pass through verbatim and are never upgraded", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord({ level: "AUTHENTICATED", verificationState: "UNVERIFIED" });
  const internal = pipeline.project(record, { viewer: VIEWERS.ADMIN });
  assert.equal(internal.dimensions.publicationState, "AUTHENTICATED");
  assert.equal(internal.dimensions.verificationState, "UNVERIFIED");
  const client = pipeline.toClient(internal);
  assert.equal(client.feature.publicationState, "AUTHENTICATED");
  assert.equal(client.feature.provenance.verificationState ?? client.feature.verificationState, "UNVERIFIED");

  const unpublished = pipeline.project(sourceRecord({ level: "NOT_PUBLISHED" }), { viewer: VIEWERS.ADMIN });
  assert.equal(unpublished.status, "SUPPRESSED", "Spatial does not approve publication for any viewer");
});

test("P06 resolvedVisualState is derived only and never fed back", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord();
  const selected = pipeline.project(record, { viewer: VIEWERS.PUBLIC, selection: selectedBy(record) });
  assert.equal(selected.dimensions.resolvedVisualState, "SELECTED");
  assert.equal(selected.feature.resolvedVisualState, undefined);
  assert.notEqual(selected.feature.state, "SELECTED");
  const again = pipeline.project(record, { viewer: VIEWERS.PUBLIC });
  assert.equal(again.dimensions.resolvedVisualState, "NORMAL");
  assert.equal(again.dimensions.selectionState, null);

  const supplied = pipeline.project(record, { viewer: VIEWERS.PUBLIC, modifiers: ["EMERGENCY", "SELECTED"] });
  assert.deepEqual([...supplied.dimensions.modifiers], [], "caller-supplied modifiers are ignored");
  assert.equal(supplied.dimensions.domainState, null);
});

test("P07 provenance continuity from record through internal result and client redaction", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord();
  const internal = pipeline.project(record, { viewer: VIEWERS.PUBLIC });
  const { provenance } = internal.feature;
  assert.equal(provenance.sourceAuthority, record.sourceAuthority);
  assert.equal(provenance.sourceRecordId, record.sourceRecordId);
  assert.equal(provenance.projectionAdapter, `wave3b-fixture-adapter:${record.domain}`);
  assert.equal(provenance.projectionVersion, "wave3b-fixture-1");
  const client = pipeline.toClient(internal);
  assert.equal(client.featureId, featureIdFor(record));
  assert.equal(client.feature.provenance.sourceAuthority, record.sourceAuthority);
  assert.equal(client.feature.provenance.updatedAt, NOW);

  // The adapter is the single projection-version authority (GEO1-WAVE3B-DEC-009).
  const mismatched = pipeline.project(sourceRecord({ provenanceOverrides: { projectionVersion: "wave3b-fixture-0" } }), { viewer: VIEWERS.PUBLIC });
  assert.equal(mismatched.status, "INVALID");
  assert.ok(codes(mismatched).includes("INVALID_PROVENANCE"));
});
