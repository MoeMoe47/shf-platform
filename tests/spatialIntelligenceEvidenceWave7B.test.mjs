import assert from "node:assert/strict";
import test from "node:test";

const OIL_RIG_EVIDENCE = Object.freeze({
  sourceAuthority: "silicon-heartland-metaverse-regional-geometry-registry",
  sourceRecordId: "oil-rig",
  projectionAdapter: "metaverseRegionalSceneAdapter",
  projectionVersion: "wave6c-regional-scene-v1",
  geometryProvenanceRef: {
    geometryHash: "201e189ef24d2adb",
    coordinateSpace: "metaverse.regional-scene",
  },
  sourceObservedAt: null,
  sourceRetrievedAt: null,
  sourceEffectiveFrom: null,
  sourceEffectiveTo: null,
  sourceApprovalState: "APPROVED",
  sourcePublicationState: null,
  evidenceHash: null,
  evidenceVersion: null,
});

async function runtime() {
  return import("../src/system/spatial/intelligence/index.js");
}

test("evidence reference preserves source authority and source record identity", async () => {
  const { createEvidenceReference } = await runtime();
  const evidence = createEvidenceReference(OIL_RIG_EVIDENCE);

  assert.equal(evidence.sourceAuthority, OIL_RIG_EVIDENCE.sourceAuthority);
  assert.equal(evidence.sourceRecordId, OIL_RIG_EVIDENCE.sourceRecordId);
});

test("evidence reference preserves projection version", async () => {
  const { createEvidenceReference } = await runtime();
  const evidence = createEvidenceReference(OIL_RIG_EVIDENCE);

  assert.equal(evidence.projectionVersion, "wave6c-regional-scene-v1");
});

test("evidence reference preserves geometry provenance and approved hash", async () => {
  const { createEvidenceReference } = await runtime();
  const evidence = createEvidenceReference(OIL_RIG_EVIDENCE);

  assert.deepEqual(evidence.geometryProvenanceRef, {
    geometryHash: "201e189ef24d2adb",
    coordinateSpace: "metaverse.regional-scene",
  });
});

test("evidence reference does not clone source record data", async () => {
  const { createEvidenceReference } = await runtime();
  const sourceRecord = {
    id: "oil-rig",
    title: "Oil Rig",
    geometry: [[[95.52457739934192, 20.389571245573055]]],
    internalApprovalNotes: "must not be copied",
  };
  const evidence = createEvidenceReference({ ...OIL_RIG_EVIDENCE, sourceRecord });

  assert.equal("sourceRecord" in evidence, false);
  assert.equal("geometry" in evidence, false);
  assert.equal("internalApprovalNotes" in evidence, false);
});

test("unknown source evidence fields remain unknown", async () => {
  const { createEvidenceReference } = await runtime();
  const evidence = createEvidenceReference(OIL_RIG_EVIDENCE);

  assert.equal(evidence.sourceObservedAt, null);
  assert.equal(evidence.sourceRetrievedAt, null);
  assert.equal(evidence.sourceEffectiveFrom, null);
  assert.equal(evidence.sourceEffectiveTo, null);
  assert.equal(evidence.evidenceHash, null);
});

test("sanitized evidence summary excludes approval metadata, paths, and authoring data", async () => {
  const { sanitizeEvidenceForClient } = await runtime();
  const summary = sanitizeEvidenceForClient({
    ...OIL_RIG_EVIDENCE,
    filesystemPath: "/private/approval/oil-rig.json",
    authoringSessionId: "session-internal",
    reviewerIdentity: "should-not-leak",
    sourceApprovalState: "APPROVED",
  });

  assert.deepEqual(Object.keys(summary).sort(), [
    "geometryHash",
    "projectionVersion",
    "sourceAuthority",
    "sourceRecordId",
  ]);
});

test("restricted evidence does not leak source identifiers", async () => {
  const { sanitizeEvidenceForClient } = await runtime();
  const summary = sanitizeEvidenceForClient({ ...OIL_RIG_EVIDENCE, visibility: "RESTRICTED" });

  assert.deepEqual(summary, { restricted: true });
});

test("evidence references remain references when attached to a projection result", async () => {
  const { createEvidenceReference, createIntelligenceEvidenceReferences } = await runtime();
  const reference = createEvidenceReference(OIL_RIG_EVIDENCE);
  const result = createIntelligenceEvidenceReferences([reference]);

  assert.deepEqual(result, [reference]);
  assert.equal(result[0].sourceRecord, undefined);
  assert.equal(result[0].sourceGeometry, undefined);
});
