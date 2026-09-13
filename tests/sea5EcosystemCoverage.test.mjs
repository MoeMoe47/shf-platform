import assert from "node:assert/strict";
import { test } from "node:test";
import { SEA5_COVERAGE_VALIDATION_ERRORS, SEA5_DISPOSITIONS, SEA5_ECOSYSTEM_COVERAGE } from "../src/system/sea/sea5EcosystemCoverage.js";

test("SEA-5 accounts for all 40 service/product records", () => {
  assert.equal(SEA5_ECOSYSTEM_COVERAGE.length, 40);
  assert.deepEqual(SEA5_COVERAGE_VALIDATION_ERRORS, []);
  assert.ok(SEA5_ECOSYSTEM_COVERAGE.every((entry) => SEA5_DISPOSITIONS.includes(entry.disposition)));
});

test("SEA-5 has no unknown or unexplained partial disposition", () => {
  assert.ok(SEA5_ECOSYSTEM_COVERAGE.every((entry) => entry.disposition !== "UNKNOWN"));
  assert.ok(SEA5_ECOSYSTEM_COVERAGE.every((entry) => entry.disposition !== "PARTIAL"));
});

test("public surfaces carry explicit public-safety classification", () => {
  assert.ok(SEA5_ECOSYSTEM_COVERAGE.filter((entry) => entry.disposition === "PUBLIC_ACCEPTED").every((entry) => entry.publicSafety));
});

test("EXR deferrals explain the broader decision required", () => {
  assert.ok(SEA5_ECOSYSTEM_COVERAGE.filter((entry) => entry.disposition === "DEFER_TO_EXR").every((entry) => entry.exrDependency));
});
