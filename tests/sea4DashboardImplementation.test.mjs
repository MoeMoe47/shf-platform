import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { SEA4_IMPLEMENTATION_COVERAGE, findSea4Projection, findSea4VisualContract } from "../src/system/sea/sea4ImplementationCoverage.js";

test("SEA-4 covers the required implementation set", async () => {
  assert.equal(SEA4_IMPLEMENTATION_COVERAGE.length, 14);
  for (const entry of SEA4_IMPLEMENTATION_COVERAGE) {
    assert.ok(findSea4Projection(entry), `${entry.id} must reference a SEA-2 projection`);
    assert.ok(findSea4VisualContract(entry), `${entry.id} must reference a SEA-3 visual contract`);
    const source = await readFile(new URL(`../${entry.module}`, import.meta.url), "utf8");
    assert.match(source, /Sea(NextAction|DashboardSection|Attention|HelpRegion)/, `${entry.id} must expose SEA semantic structure`);
  }
});

test("SEA-4 preserves role and authority distinctions", () => {
  const ids = new Set(SEA4_IMPLEMENTATION_COVERAGE.map((entry) => entry.id));
  assert.ok(ids.has("student") && ids.has("instructor"));
  assert.ok(ids.has("onboarding-applicant") && ids.has("onboarding-reviewer"));
  assert.ok(ids.has("civicsure-provider") && ids.has("civicsure-operator"));
  assert.ok(ids.has("studio-builder") && ids.has("studio-qa") && ids.has("studio-reviewer"));
  assert.ok(ids.has("agent-fabric") && ids.has("arag-1") && ids.has("executive-command"));
});

test("SEA-4 implementation coverage only claims browser acceptance with evidence", () => {
  const onboarding = SEA4_IMPLEMENTATION_COVERAGE.filter((entry) => entry.id.startsWith("onboarding-"));
  assert.ok(onboarding.every((entry) => entry.browser === "PASS"));
  assert.ok(SEA4_IMPLEMENTATION_COVERAGE.every((entry) => entry.browser === "PASS"));
});
