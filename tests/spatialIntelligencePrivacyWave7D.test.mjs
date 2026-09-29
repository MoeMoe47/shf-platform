import assert from "node:assert/strict";
import test from "node:test";

const publicResult = {
  ok: true,
  resultType: "SPATIAL_INTELLIGENCE",
  reasoningClass: "GEOMETRIC_FACT",
  relationship: "CONTAINS",
  value: true,
  coordinateSpace: "metaverse.regional-scene",
  inputReferences: { left: "visible-feature", right: "visible-point" },
  evidenceReferences: [{ sourceAuthority: "geometry-registry", sourceRecordId: "oil-rig", geometryHash: "201e189ef24d2adb" }],
  freshnessState: "CURRENT",
  temporalContext: { projectedAt: "2026-09-29T12:00:00.000Z" },
  diagnostics: [],
  filesystemPath: "/private/approval/oil-rig.json",
  authoringSessionId: "internal-session",
  approvalMetadata: { reviewer: "internal" },
  sourceRecord: { secret: "must not leak" },
};

async function runtime() {
  return import("../src/system/spatial/intelligence/reasoning.js");
}

test("client result uses an explicit sanitized intelligence shape", async () => {
  const { sanitizeIntelligenceResult } = await runtime();
  const result = sanitizeIntelligenceResult(publicResult);

  assert.equal(result.kind, "SPATIAL_INTELLIGENCE");
  assert.equal(result.resultType, "SPATIAL_INTELLIGENCE");
  assert.equal(result.relationship, "CONTAINS");
  assert.equal(result.value, true);
});

test("sanitized output excludes approval, authoring, filesystem, and source-record data", async () => {
  const { sanitizeIntelligenceResult } = await runtime();
  const result = sanitizeIntelligenceResult(publicResult);

  for (const field of ["filesystemPath", "authoringSessionId", "approvalMetadata", "sourceRecord"]) {
    assert.equal(result[field], undefined);
  }
});

test("restricted results do not leak hidden feature IDs or source identifiers", async () => {
  const { sanitizeIntelligenceResult } = await runtime();
  const result = sanitizeIntelligenceResult({ ...publicResult, visibility: "RESTRICTED", inputReferences: { left: "hidden-id" } });

  assert.deepEqual(result, { kind: "SPATIAL_INTELLIGENCE", status: "RESTRICTED" });
});

test("hidden results use the safe generic result", async () => {
  const { sanitizeIntelligenceResult } = await runtime();
  const result = sanitizeIntelligenceResult({ ...publicResult, visibility: "HIDDEN" });

  assert.deepEqual(result, { kind: "SPATIAL_INTELLIGENCE", status: "RESTRICTED" });
});

test("NOT_PUBLISHED results are not client eligible", async () => {
  const { sanitizeIntelligenceResult } = await runtime();
  const result = sanitizeIntelligenceResult({ ...publicResult, publicationState: "NOT_PUBLISHED" });

  assert.deepEqual(result, { kind: "SPATIAL_INTELLIGENCE", status: "SUPPRESSED" });
});

test("internal diagnostics and sensitive provenance are not exposed", async () => {
  const { sanitizeIntelligenceResult } = await runtime();
  const result = sanitizeIntelligenceResult({
    ...publicResult,
    diagnostics: [{ code: "INTERNAL_PATH", filesystemPath: "/private/file" }],
    evidenceReferences: [{ sourceAuthority: "secret-authority", sourceRecordId: "restricted-source", reviewerIdentity: "private" }],
  });

  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.evidenceSummary, [{ sourceAuthority: "secret-authority", sourceRecordId: "restricted-source" }]);
});
