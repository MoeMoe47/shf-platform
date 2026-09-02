import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { destinationDispatch, experienceStateCannotAssertInstitutionalTruth } from "../src/domain/studio/model/studio-lifecycle.ts";
import { REQUIREMENT_REGISTRY, REQUIREMENT_TYPES } from "../src/domain/completion-policy/model/completion-policy.ts";
import { verifiedEvidenceEventSourceTypes } from "../src/domain/verified-evidence/service/verified-evidence-service.ts";

test("Studio finalized deliveries enter the existing Evidence source boundary", () => {
  assert.equal(verifiedEvidenceEventSourceTypes["studio.delivery.finalized"], "STUDIO_DELIVERY");
  assert.equal(destinationDispatch("STUDENT").consumer, "STUDENT_EVIDENCE");
  assert.equal(destinationDispatch("COMMERCIAL").consumer, "COMMERCIAL_CLIENTOPS");
});

test("Studio evidence is not a direct Truth or completion claim", () => {
  assert.deepEqual(destinationDispatch("STUDENT"), { destination: "STUDENT", consumer: "STUDENT_EVIDENCE", requiresCanonicalDelivery: true });
  assert.equal(experienceStateCannotAssertInstitutionalTruth("VERIFIED"), false);
  assert.equal(experienceStateCannotAssertInstitutionalTruth("FINALIZED"), true);
});

test("completion policies can explicitly require a finalized Studio project", () => {
  assert.ok((REQUIREMENT_TYPES as readonly string[]).includes("STUDIO_PROJECT"));
  assert.equal(REQUIREMENT_REGISTRY.STUDIO_PROJECT.authoritativeDomain, "studio_delivery_records (Studio finalization)");
  assert.equal(REQUIREMENT_REGISTRY.STUDIO_PROJECT.requiresTargetReference, true);
});

test("commercial projects do not use the student Evidence consumer", () => {
  assert.notEqual(destinationDispatch("COMMERCIAL").consumer, "STUDENT_EVIDENCE");
});

test("teacher Studio progress is a derived assignment-scoped read model", () => {
  const source = fs.readFileSync("apps/shs-api/src/domain/studio/service/studio-project-service.ts", "utf8");
  assert.match(source, /getAssignmentProgress/);
  assert.match(source, /assignment_targets/);
  assert.match(source, /studio_review_submissions/);
  assert.match(source, /studio_delivery_records/);
  assert.match(source, /assignmentComplete/);
  assert.doesNotMatch(source, /teacher_studio_status|teacher_completion_status|teacher_review_status/);
});

test("Studio project type requirements are evaluated from canonical policy configuration", () => {
  const source = fs.readFileSync("apps/shs-api/src/domain/completion-policy/service/requirement-adapters.ts", "utf8");
  assert.match(source, /requiredProjectType/);
  assert.match(source, /row\.project_type !== requiredProjectType/);
});
