import assert from "node:assert/strict";
import test from "node:test";

const NOW = "2026-09-29T12:00:00.000Z";

async function runtime() {
  return import("../src/system/spatial/intelligence/index.js");
}

test("projectedAt is Spatial-owned", async () => {
  const { createTemporalContext } = await runtime();
  const temporal = createTemporalContext({ projectedAt: NOW });

  assert.equal(temporal.projectedAt, NOW);
  assert.equal(temporal.projectedAtAuthority, "SPATIAL");
});

test("source-derived timestamps are preserved without changing authority", async () => {
  const { createTemporalContext } = await runtime();
  const temporal = createTemporalContext({
    observedAt: "2026-09-28T12:00:00.000Z",
    effectiveFrom: "2026-09-01T00:00:00.000Z",
    effectiveTo: null,
    retrievedAt: "2026-09-29T11:00:00.000Z",
    supersededAt: null,
  });

  assert.equal(temporal.observedAtAuthority, "SOURCE");
  assert.equal(temporal.effectiveFromAuthority, "SOURCE");
  assert.equal(temporal.retrievedAtAuthority, "EVIDENCE");
  assert.equal(temporal.supersededAtAuthority, "SOURCE_OR_EVIDENCE");
});

test("missing timestamps remain unknown", async () => {
  const { createTemporalContext } = await runtime();
  const temporal = createTemporalContext({});

  for (const field of ["observedAt", "effectiveFrom", "effectiveTo", "retrievedAt", "supersededAt"]) {
    assert.equal(temporal[field], null);
  }
});

test("invalid temporal ordering fails closed", async () => {
  const { validateTemporalContext } = await runtime();
  const result = validateTemporalContext({
    effectiveFrom: "2026-09-30T00:00:00.000Z",
    effectiveTo: "2026-09-29T00:00:00.000Z",
  });

  assert.equal(result.ok, false);
});

test("current clock time cannot infer or overwrite source temporal truth", async () => {
  const { resolveTemporalContext } = await runtime();
  const result = resolveTemporalContext({ observedAt: null }, NOW);

  assert.equal(result.observedAt, null);
  assert.equal(result.projectedAt, NOW);
});

test("freshness exposes the complete frozen state vocabulary", async () => {
  const { FRESHNESS_STATES } = await runtime();

  assert.deepEqual(Object.values(FRESHNESS_STATES).sort(), [
    "CURRENT",
    "EXPIRED",
    "HISTORICAL",
    "STALE",
    "UNKNOWN",
  ]);
});

test("unknown freshness is not current", async () => {
  const { resolveFreshness } = await runtime();
  const result = resolveFreshness({}, { now: NOW });

  assert.equal(result.state, "UNKNOWN");
  assert.notEqual(result.state, "CURRENT");
});

test("threshold freshness requires an explicit source or layer threshold", async () => {
  const { resolveFreshness } = await runtime();
  const result = resolveFreshness({ retrievedAt: "2026-09-28T12:00:00.000Z" }, { now: NOW });

  assert.equal(result.state, "UNKNOWN");
  assert.match(result.reason, /threshold/i);
});

test("historical snapshots are not stale solely because they are old", async () => {
  const { resolveFreshness } = await runtime();
  const result = resolveFreshness({ historical: true, observedAt: "2010-01-01T00:00:00.000Z" }, {
    now: NOW,
    maxSourceAgeMs: 1,
  });

  assert.equal(result.state, "HISTORICAL");
});

test("expired effective periods resolve EXPIRED", async () => {
  const { resolveFreshness } = await runtime();
  const result = resolveFreshness({ effectiveTo: "2026-09-28T00:00:00.000Z" }, { now: NOW });

  assert.equal(result.state, "EXPIRED");
});

test("stale freshness does not invalidate geometry", async () => {
  const { resolveFreshness } = await runtime();
  const result = resolveFreshness({ freshness: "STALE", geometryValid: true }, { now: NOW });

  assert.equal(result.state, "STALE");
  assert.equal(result.geometryValid, true);
});

test("freshness cannot create publication or domain authority", async () => {
  const { resolveFreshness } = await runtime();
  const result = resolveFreshness({ freshness: "CURRENT" }, { now: NOW });

  assert.equal(result.publicationState, undefined);
  assert.equal(result.domainAuthority, undefined);
});
