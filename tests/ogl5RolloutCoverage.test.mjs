import test from "node:test";
import assert from "node:assert/strict";
import { universeDestinations } from "../src/pages/universe-v1/universeDestinationRegistry.js";
import { OGL_ROLLOUT_COVERAGE, validateOglRolloutCoverage } from "../src/system/orientation/rolloutCoverage.js";

test("OGL-5 coverage accounts for every canonical Universe destination", () => {
  const result = validateOglRolloutCoverage();
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(OGL_ROLLOUT_COVERAGE.length, universeDestinations.length);
  assert.equal(new Set(OGL_ROLLOUT_COVERAGE.map((entry) => entry.destinationId)).size, universeDestinations.length);
});

test("OGL-5 closure statuses do not hide partial or missing destinations", () => {
  assert.ok(OGL_ROLLOUT_COVERAGE.some((entry) => entry.status === "EXTERNAL_OR_PRODUCT_DEPENDENCY_BLOCKED"));
  assert.equal(OGL_ROLLOUT_COVERAGE.some((entry) => ["BLOCKED", "PARTIAL", "MISSING"].includes(entry.status)), false);
  for (const entry of OGL_ROLLOUT_COVERAGE) assert.ok(entry.note.length > 0);
});

test("active Agent Fabric surface is wired to the canonical guidance entry point", () => {
  const agent = OGL_ROLLOUT_COVERAGE.find((entry) => entry.destinationId === "agent-fabric");
  assert.equal(agent.orientationId, "orientation:agent-fabric:operator");
  assert.equal(agent.status, "COMPLETE");
});

test("authenticated BOS and Sales coverage use canonical OGL identities", () => {
  assert.equal(OGL_ROLLOUT_COVERAGE.find((entry) => entry.destinationId === "bos").status, "COMPLETE");
  assert.equal(OGL_ROLLOUT_COVERAGE.find((entry) => entry.destinationId === "sales").orientationId, "orientation:sales:pipeline");
});
