import test from "node:test";
import assert from "node:assert/strict";
import { deriveMasteryStatus, deriveVerificationStatus } from "../src/domain/curriculum/service/learner-result-service.js";

test("learner-result semantics keep failed academic results out of mastery", () => {
  assert.equal(deriveMasteryStatus("FAILED"), "NOT_DEMONSTRATED");
  assert.equal(deriveMasteryStatus("PASSED"), "DEMONSTRATED");
  assert.equal(deriveMasteryStatus("COMPLETED"), "DEVELOPING");
});

test("verification stays separate from academic mastery", () => {
  assert.equal(deriveVerificationStatus(), "UNVERIFIED");
  assert.equal(deriveVerificationStatus(["evidence-1"]), "EVIDENCE_PENDING");
});
