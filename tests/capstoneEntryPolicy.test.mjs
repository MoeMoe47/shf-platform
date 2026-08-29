import assert from "node:assert/strict";
import test from "node:test";
import { CapstoneEntryService } from "../apps/shs-api/src/domain/programs/service/capstone-entry-service.ts";
import { CAPSTONE_BRANCH_REQUIREMENTS, CAPSTONE_ENTRY_POLICY_VERSION, GRADE12_SHARED_CORE_LESSONS } from "../apps/shs-api/src/domain/programs/model/capstone-entry-policy.ts";

const actor = { user_id: "learner", organization_id: "org", active_organization_id: "org", tenant_id: "tenant:org", permissions: ["program.read"] };

test("capstone entry policy covers all six branches without activating capstone content", () => {
  assert.equal(CAPSTONE_ENTRY_POLICY_VERSION, "grade12-capstone-entry-v1");
  assert.deepEqual(Object.keys(CAPSTONE_BRANCH_REQUIREMENTS), ["technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure"]);
  for (const requirement of Object.values(CAPSTONE_BRANCH_REQUIREMENTS)) {
    assert.match(requirement.courseId, /-12$/);
    assert.equal(requirement.lessons.length, 3);
    assert.ok(requirement.proofActivity);
    assert.ok(requirement.competencySlug);
    assert.ok(requirement.role);
  }
});

function dbFor({ specialization = "ai-cloud-infrastructure", completeAll = true, demonstrated = true } = {}) {
  const branch = CAPSTONE_BRANCH_REQUIREMENTS[specialization];
  return async (sql, params) => {
    if (sql.includes("program_specialization_assignments")) return { rows: [{ specialization_id: specialization }] };
    if (sql.includes("program_course_assignments")) return { rows: [{ assignment_id: "assignment" }] };
    if (sql.includes("curriculum_lesson_completions")) return { rows: (completeAll ? [...GRADE12_SHARED_CORE_LESSONS, ...branch.lessons] : []).map((lesson_id) => ({ lesson_id })) };
    if (sql.includes("prepare_prove_activity_results")) return { rows: demonstrated ? [{ decision_id: "decision" }] : [] };
    throw new Error(`unexpected query: ${sql}`);
  };
}

test("capstone entry is derived for every branch only from matching canonical facts", async () => {
  for (const [specialization, requirement] of Object.entries(CAPSTONE_BRANCH_REQUIREMENTS)) {
    const result = await new CapstoneEntryService(dbFor({ specialization })).evaluate(actor);
    assert.equal(result.status, "CAPSTONE_ENTRY_ELIGIBLE");
    assert.equal(result.eligible, true);
    assert.equal(result.course_id, requirement.courseId);
    assert.equal(result.future_role, requirement.role);
    assert.equal(result.capstone_status, "ARCHITECTURE_DEFINED_NON_EXECUTABLE");
  }
});

test("missing completion or demonstrated proof cannot satisfy capstone entry", async () => {
  const missingCompletion = await new CapstoneEntryService(dbFor({ completeAll: false })).evaluate(actor);
  assert.equal(missingCompletion.status, "CAPSTONE_ENTRY_NOT_ELIGIBLE");
  assert.ok(missingCompletion.missing_requirements.some((item) => item.code === "GRADE12_SHARED_CORE_MISSING"));
  const pendingProof = await new CapstoneEntryService(dbFor({ demonstrated: false })).evaluate(actor);
  assert.equal(pendingProof.status, "CAPSTONE_ENTRY_NOT_ELIGIBLE");
  assert.ok(pendingProof.missing_requirements.some((item) => item.code === "DEMONSTRATED_BRANCH_PROOF_REQUIRED"));
});
