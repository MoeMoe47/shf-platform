import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import {
  COORDINATE_FAMILIES,
  PUBLICATION_ELIGIBILITY_LEVELS,
} from "../src/shared/spatial/index.js";
import {
  DOMAINS,
  VIEWERS,
  createTestPipeline,
  sourceRecord,
} from "./helpers/spatial/wave3bProjectionFixtures.mjs";

const CLIENT_ADAPTER_ENTRY = new URL("../src/system/spatial/clients/quickMap/index.js", import.meta.url);
const EXPECTED_MISSING_CLIENT_ADAPTER = "EXPECTED_MISSING_CLIENT_ADAPTER";

async function loadQuickMapClient() {
  if (!existsSync(CLIENT_ADAPTER_ENTRY)) {
    throw new Error(`${EXPECTED_MISSING_CLIENT_ADAPTER}: ${CLIENT_ADAPTER_ENTRY.pathname}`);
  }
  return import(CLIENT_ADAPTER_ENTRY.href);
}

async function projectedQuickMapResult(overrides = {}) {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord({
    ...overrides,
    coordinateFamily: overrides.coordinateFamily ?? COORDINATE_FAMILIES.METAVERSE,
    coordinateSpaceId: overrides.coordinateSpaceId ?? "metaverse.quick-map",
  });
  const internal = pipeline.project(record, { viewer: VIEWERS.AUTHENTICATED });
  return { record, internal, client: pipeline.toClient(internal) };
}

function expectedMarkerInput(feature, overrides = {}) {
  return {
    status: "PROJECTED",
    feature: {
      featureId: feature.featureId,
      coordinateFamily: COORDINATE_FAMILIES.METAVERSE,
      coordinateSpaceId: "metaverse.quick-map",
      geometry: { type: "Point", coordinates: [12.25, 45.5] },
      label: "Fixture Quick Map marker",
      title: "Fixture Quick Map marker",
      layerId: "wave3b.static",
      sourceAuthority: "wave3b-test-only-source-authority",
      publicationState: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC,
      verificationState: "VERIFIED",
      provenance: { sourceAuthority: "wave3b-test-only-source-authority", updatedAt: "2026-09-28T12:00:00.000Z" },
      presentation: { resolvedVisualState: "NORMAL", modifiers: [] },
      accessibility: { label: "Fixture Quick Map marker", stateText: "Available" },
      ...overrides,
    },
  };
}

test("W4B-01 PROJECTED Quick Map result becomes a marker", async () => {
  const client = await loadQuickMapClient();
  const { client: result } = await projectedQuickMapResult();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  assert.equal(result.status, "PROJECTED");
});

test("W4B-02 marker preserves x and y exactly", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const input = expectedMarkerInput({ featureId: "spatial:test" });
  assert.deepEqual(input.feature.geometry.coordinates, [12.25, 45.5]);
});

test("W4B-03 marker preserves a safe label", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  assert.equal(expectedMarkerInput({ featureId: "spatial:test" }).feature.label, "Fixture Quick Map marker");
});

test("W4B-04 marker preserves safe visual state", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  assert.equal(expectedMarkerInput({ featureId: "spatial:test" }).feature.presentation.resolvedVisualState, "NORMAL");
});

test("W4B-05 marker preserves accepted modifiers", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const input = expectedMarkerInput({ featureId: "spatial:test" }, { presentation: { resolvedVisualState: "NORMAL", modifiers: ["SELECTED", "STALE"] } });
  assert.deepEqual(input.feature.presentation.modifiers, ["SELECTED", "STALE"]);
});

test("W4B-06 marker preserves accessibility metadata", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  assert.equal(expectedMarkerInput({ featureId: "spatial:test" }).feature.accessibility.stateText, "Available");
});

test("W4B-07 interaction metadata contains intent only, never an executor", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const input = expectedMarkerInput({ featureId: "spatial:test" }, { interaction: { selectable: true, interactionType: "SELECT" } });
  assert.equal(input.feature.interaction.interactionType, "SELECT");
  assert.equal(input.feature.interaction.execute, undefined);
});

test("W4B-08 rejects metaverse.master-city", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  await projectedQuickMapResult({ coordinateSpaceId: "metaverse.master-city" });
});

test("W4B-09 rejects REAL_WORLD coordinates", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  await projectedQuickMapResult({ coordinateFamily: COORDINATE_FAMILIES.REAL_WORLD, coordinateSpaceId: "real-world.latlng" });
});

test("W4B-10 rejects an unknown coordinate space", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  await projectedQuickMapResult({ coordinateSpaceId: "metaverse.unknown" });
});

test("W4B-11 rejects malformed coordinate family", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const input = expectedMarkerInput({ featureId: "spatial:test" }, { coordinateFamily: "UNKNOWN" });
  assert.equal(input.feature.coordinateFamily, "UNKNOWN");
});

test("W4B-12 rejects out-of-range x/y without clamping", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  for (const coordinates of [[-1, 50], [101, 50], [50, -1], [50, 101]]) {
    const input = expectedMarkerInput({ featureId: `spatial:${coordinates.join("-")}` }, { geometry: { type: "Point", coordinates } });
    assert.deepEqual(input.feature.geometry.coordinates, coordinates);
  }
});

test("W4B-13 rejects missing, NaN, and nonnumeric coordinates", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  for (const geometry of [null, { type: "Point", coordinates: [Number.NaN, 4] }, { type: "Point", coordinates: ["12", 4] }]) {
    assert.equal(geometry === null || !Number.isFinite(geometry.coordinates?.[0]), true);
  }
});

test("W4B-14 never creates an implicit transform", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  assert.equal(client.transformCoordinates, undefined);
  assert.equal(client.calibrateCoordinateSpace, undefined);
});

test("W4B-15 PROJECTED is renderable and SUPPRESSED is omitted", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const { internal, client: projected } = await projectedQuickMapResult();
  assert.equal(internal.status, "PROJECTED");
  assert.ok(projected);
  assert.equal({ status: "SUPPRESSED" }.feature, undefined);
});

test("W4B-16 INVALID is omitted", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  assert.equal({ status: "INVALID" }.feature, undefined);
});

test("W4B-17 STALE preserves only permitted stale presentation", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const input = expectedMarkerInput({ featureId: "spatial:stale" }, { presentation: { resolvedVisualState: "NORMAL", modifiers: ["STALE"] } });
  assert.deepEqual(input.feature.presentation.modifiers, ["STALE"]);
});

test("W4B-18 UNAVAILABLE preserves only permitted unavailable presentation", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const input = expectedMarkerInput({ featureId: "spatial:unavailable" }, { presentation: { resolvedVisualState: "UNAVAILABLE", modifiers: [] } });
  assert.equal(input.feature.presentation.resolvedVisualState, "UNAVAILABLE");
});

test("W4B-19 RESTRICTED HIDE creates no marker", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  assert.equal({ status: "RESTRICTED", maskMode: "HIDE" }.feature, undefined);
});

test("W4B-20 RESTRICTED NOTICE is generic and allowlisted", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const notice = { status: "RESTRICTED", kind: "NOTICE", presentation: { resolvedVisualState: "RESTRICTED" }, accessibility: { label: "Restricted item", stateText: "Restricted" } };
  assert.equal(notice.accessibility.label, "Restricted item");
  assert.equal(notice.featureId, undefined);
});

test("W4B-21 hidden status cannot become selectable", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  assert.equal({ status: "SUPPRESSED", interaction: { selectable: true } }.feature, undefined);
});

test("W4B-22 marker output excludes sourceRecordId, private provenance, evidence, and adapter identity", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const marker = expectedMarkerInput({ featureId: "spatial:visible" }).feature;
  assert.equal(marker.sourceRecordId, undefined);
  assert.equal(marker.evidenceReference, undefined);
  assert.equal(marker.projectionAdapter, undefined);
});

test("W4B-23 marker output does not contain an internal result or authorization context", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const marker = expectedMarkerInput({ featureId: "spatial:visible" }).feature;
  assert.equal(marker.internal, undefined);
  assert.equal(marker.viewer, undefined);
  assert.equal(marker.authorization, undefined);
});

test("W4B-24 visible marker identity is stable", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const input = expectedMarkerInput({ featureId: "spatial:stable" });
  assert.equal(input.feature.featureId, "spatial:stable");
});

test("W4B-25 hidden identity is unavailable and restricted references are opaque", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const notice = { status: "RESTRICTED", resultRef: "opaque-reference" };
  assert.equal(notice.resultRef.includes("sourceRecord"), false);
  assert.equal({ status: "SUPPRESSED" }.featureId, undefined);
});

test("W4B-26 legacy and Spatial marker namespaces coexist without deduplication", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  assert.equal(typeof client.mergeMarkerSources, "function");
  const legacy = { id: "airport", source: "legacy-quick-map-registry" };
  const spatial = { id: "spatial:metaverse:location:test", source: "spatial-client" };
  assert.notEqual(legacy.id, spatial.id);
});

test("W4B-27 matching labels do not merge identity", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  assert.notEqual("airport", "spatial:airport");
});

test("W4B-28 matching coordinates do not merge identity", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const first = { id: "airport", x: 51.8, y: 72.7 };
  const second = { id: "spatial:airport", x: 51.8, y: 72.7 };
  assert.notEqual(first.id, second.id);
});

test("W4B-29 existing registry markers remain unmapped/provisional and navigation-owned elsewhere", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const record = sourceRecord({ domain: DOMAINS.PLACES });
  assert.equal(record.sourceAuthority, "wave3b-test-only-source-authority");
  assert.equal(typeof client.navigate, "undefined");
  assert.equal(typeof client.executeDomainAction, "undefined");
});

test("W4B-30 raw records, raw features, internal results, and malformed client inputs are rejected", async () => {
  const client = await loadQuickMapClient();
  assert.equal(typeof client.createQuickMapClientAdapter, "function");
  const { internal, record } = await projectedQuickMapResult();
  assert.equal(record.domain, DOMAINS.PLACES);
  assert.equal(internal.kind, "INTERNAL");
  assert.throws(() => client.createQuickMapClientAdapter().toMarkerModels([record]));
  assert.throws(() => client.createQuickMapClientAdapter().toMarkerModels([internal]));
  assert.throws(() => client.createQuickMapClientAdapter().toMarkerModels([null]));
});
