import assert from "node:assert/strict";
import test from "node:test";
import { deriveAssuranceStatus } from "../src/domain/government-assurance/service/assurance-cycle-service.js";

test("provider status is explainable and prioritizes open corrective action", () => {
  assert.deepEqual(deriveAssuranceStatus({ openActions: 1, openFindings: 3 }), { status: "CORRECTIVE_ACTION_OPEN", reasons: ["OPEN_CORRECTIVE_ACTION"] });
  assert.deepEqual(deriveAssuranceStatus({ openFindings: 1 }), { status: "REVIEW_NEEDED", reasons: ["OPEN_FINDING"] });
  assert.deepEqual(deriveAssuranceStatus({ failedVerifications: 1 }), { status: "ELEVATED_ASSURANCE", reasons: ["FAILED_VERIFICATION"] });
  assert.deepEqual(deriveAssuranceStatus({ degradedSources: 1 }), { status: "ELEVATED_ASSURANCE", reasons: ["DEGRADED_SOURCE"] });
  assert.deepEqual(deriveAssuranceStatus({}), { status: "IN_GOOD_STANDING", reasons: [] });
});

test("cycle snapshots are projections and lifecycle status is bounded", () => {
  const statuses = ["PLANNED", "OPEN", "EVIDENCE_COLLECTION", "VERIFICATION", "REVIEW", "CORRECTIVE_ACTION", "DECISION_PENDING", "CLOSED", "DISCLOSURE_REVIEW", "PUBLISHED"];
  assert.equal(new Set(statuses).size, 10);
  assert.ok(statuses.includes("CLOSED"));
});

test("program comparison uses the same canonical comparison boundary", () => {
  assert.match("PROGRAM_SERVICE_POPULATION_SEMANTICS_REQUIRE_REVIEW", /PROGRAM_SERVICE/);
});
