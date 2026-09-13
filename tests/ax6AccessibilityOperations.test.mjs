import test from "node:test";
import assert from "node:assert/strict";
import { deriveHealth, ISSUE_ORIGINS, ISSUE_STATUSES, SUPPORT_TYPES } from "../apps/shs-api/src/domain/accessibility-operations/model/operations.ts";

test("AX-6 uses bounded issue/support vocabularies", () => {
  assert.equal(ISSUE_ORIGINS.includes("COMPANION_ESCALATION"), true);
  assert.equal(ISSUE_STATUSES.includes("REGRESSION"), true);
  assert.equal(SUPPORT_TYPES.includes("ACCESS_BARRIER"), true);
});
test("AX-6 health is deterministic and unknown when source is unavailable", () => {
  assert.equal(deriveHealth([]), "HEALTHY");
  assert.equal(deriveHealth([{ status: "BLOCKED", severity: "SERIOUS" }]), "CRITICAL");
  assert.equal(deriveHealth([{ status: "REGRESSION", severity: "MINOR" }]), "ATTENTION");
  assert.equal(deriveHealth([], false), "UNKNOWN");
});
