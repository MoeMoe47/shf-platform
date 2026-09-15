import assert from "node:assert/strict";
import test from "node:test";
import {
  MET_FINAL_CAPABILITIES,
  MET_FINAL_BOUNDARIES,
  MET_FINAL_DEFERRED_ITEMS,
  validateMetaverseFinalAcceptance,
} from "../src/system/metaverse/metaverseFinalAcceptance.js";

test("MET-12 final registry validates the completed metaverse program", () => {
  assert.deepEqual(validateMetaverseFinalAcceptance(), { valid: true, errors: [] });
  assert.equal(MET_FINAL_CAPABILITIES.length, 16);
  assert.ok(MET_FINAL_CAPABILITIES.every((entry) => entry.status === "ACCEPTED"));
});

test("MET-12 reporting capability closes MET-GAP-013", () => {
  const reporting = MET_FINAL_CAPABILITIES.find((entry) => entry.id === "reporting-acceptance");
  assert.ok(reporting);
  assert.equal(reporting.owner, "MET-12");
});

test("civic and treasury boundaries stay honest and non-duplicative", () => {
  const civic = MET_FINAL_BOUNDARIES.find((entry) => entry.id === "civic-government-boundary");
  const treasury = MET_FINAL_BOUNDARIES.find((entry) => entry.id === "treasury-persistence-boundary");
  assert.ok(civic && /SHF Civic/.test(civic.statement));
  assert.ok(treasury && /in-memory/i.test(treasury.statement));
});

test("deferred items are honestly non-blocking", () => {
  assert.ok(MET_FINAL_DEFERRED_ITEMS.every((entry) => entry.blocks === false));
});

test("Student Enterprise System is accepted, not deferred", () => {
  const enterprise = MET_FINAL_CAPABILITIES.find((entry) => entry.id === "student-enterprise-system");
  assert.ok(enterprise);
  assert.equal(enterprise.owner, "MET-12");
  assert.ok(!MET_FINAL_DEFERRED_ITEMS.some((entry) => entry.id === "student-enterprise-seller-authority"));
});
