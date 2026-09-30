import assert from "node:assert/strict";
import test from "node:test";

async function runtime() {
  return import("../src/system/spatial/clients/regionalScene/RegionalSceneIntelligenceClient.js");
}

test("wrapper output is client-safe and contains only the sanitized result", async () => {
  const { createRegionalSceneIntelligenceClient } = await runtime();
  const result = createRegionalSceneIntelligenceClient({ isDev: true, sceneId: "oil-rig", search: "?metaverseDev=1&spatialIntelligenceFixture=oil-rig-contains-point" }).getInspectionResult();
  for (const field of ["sourceRecord", "internalResult", "approvalMetadata", "authoringMetadata", "filesystemPath", "reviewerIdentity"]) {
    assert.equal(result[field], undefined, field);
  }
});

test("sanitized evidence summary preserves only safe evidence fields", async () => {
  const { sanitizeRegionalSceneIntelligenceResult } = await runtime();
  const result = sanitizeRegionalSceneIntelligenceResult({
    evidenceSummary: [{ sourceAuthority: "geometry-registry", sourceRecordId: "oil-rig", reviewerIdentity: "private", filesystemPath: "/private/file" }],
  });
  assert.deepEqual(result.evidenceSummary, [{ sourceAuthority: "geometry-registry", sourceRecordId: "oil-rig" }]);
});

test("hidden input returns the generic restricted result", async () => {
  const { sanitizeRegionalSceneIntelligenceResult } = await runtime();
  assert.deepEqual(sanitizeRegionalSceneIntelligenceResult({ visibility: "HIDDEN", inputReferences: { left: "hidden-feature" } }), {
    kind: "SPATIAL_INTELLIGENCE",
    status: "RESTRICTED",
  });
});

test("restricted input does not expose feature or source identifiers", async () => {
  const { sanitizeRegionalSceneIntelligenceResult } = await runtime();
  const result = sanitizeRegionalSceneIntelligenceResult({ visibility: "RESTRICTED", sourceRecordId: "private-source", inputReferences: { left: "hidden-feature" } });
  assert.deepEqual(result, { kind: "SPATIAL_INTELLIGENCE", status: "RESTRICTED" });
  assert.equal(JSON.stringify(result).includes("private-source"), false);
});

test("NOT_PUBLISHED input returns the generic suppressed result", async () => {
  const { sanitizeRegionalSceneIntelligenceResult } = await runtime();
  assert.deepEqual(sanitizeRegionalSceneIntelligenceResult({ publicationState: "NOT_PUBLISHED" }), {
    kind: "SPATIAL_INTELLIGENCE",
    status: "SUPPRESSED",
  });
});

test("internal diagnostics are never returned to the client", async () => {
  const { sanitizeRegionalSceneIntelligenceResult } = await runtime();
  const result = sanitizeRegionalSceneIntelligenceResult({ diagnostics: [{ code: "INTERNAL_PATH", filesystemPath: "/private/file" }] });
  assert.deepEqual(result.diagnostics, []);
});

test("the client wrapper does not expose unsanitized evidence or provenance", async () => {
  const { createRegionalSceneIntelligenceClient } = await runtime();
  const result = createRegionalSceneIntelligenceClient({ isDev: true, sceneId: "oil-rig", search: "?metaverseDev=1&spatialIntelligenceFixture=oil-rig-contains-point" }).getInspectionResult();
  assert.equal(result.evidenceReferences, undefined);
  assert.equal(result.provenance, undefined);
  assert.equal(result.geometry, undefined);
});

test("the client wrapper returns no result when the fixture is disabled", async () => {
  const { createRegionalSceneIntelligenceClient } = await runtime();
  assert.equal(createRegionalSceneIntelligenceClient({ isDev: false, sceneId: "oil-rig", search: "?spatialIntelligenceFixture=oil-rig-contains-point" }).getInspectionResult(), null);
});
