import test from "node:test";
import assert from "node:assert/strict";
import { SEA_SERVICE_EXPERIENCE_CONTRACTS as contracts } from "../src/system/sea/serviceExperienceContracts.js";

test("SEA-1 registry has one normalized contract per audited service record", () => {
  assert.equal(contracts.length, 40);
  assert.equal(new Set(contracts.map((contract) => contract.serviceId)).size, 40);
  assert.deepEqual([...new Set(contracts.map((contract) => contract.tier))].sort(), ["A", "B", "C", "NOT_PRODUCTIZED"]);
});

test("SEA-1 Tier A contracts declare jobs, authority, next actions, and dashboard obligations", () => {
  const tierA = contracts.filter((contract) => contract.tier === "A");
  assert.equal(tierA.length, 15);
  for (const contract of tierA) {
    assert.ok(contract.jobsToBeDone.length >= 3);
    assert.ok(contract.explicitNonCapabilities.length >= 2);
    assert.notEqual(contract.nextAction.source, "NONE");
    assert.equal(contract.truth.writeAuthority, false);
    assert.equal(contract.evidence.notOwned, true);
    assert.equal(contract.companion.readOnly, true);
  }
});

test("SEA-1 contracts reject arbitrary action authorities and unsafe URLs", () => {
  for (const contract of contracts) {
    for (const item of [...(contract.actions.primary || []), ...(contract.actions.secondary || []), ...(contract.actions.reference || [])]) {
      assert.match(item.route, /^(\/|external:)/);
      assert.equal(/^https?:|^javascript:/i.test(item.route), false);
    }
  }
});
