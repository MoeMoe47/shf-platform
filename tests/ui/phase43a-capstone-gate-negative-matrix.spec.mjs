import { test, expect } from "@playwright/test";
import { admin, branchData, call, establishGrade11, establishGrade12, employer, gate, headers, otherAdmin, program, proof, reviewer, status, token } from "./phase43a-capstone-test-helpers.mjs";

test("Phase 43A executes the isolated capstone gate negative matrix", { timeout: 240_000 }, async ({ page }) => {
  const cases = [];
  const record = (name, expected, actual, http = 200) => cases.push({ name, expected, actual, http });
  const noAssignment = await gate(page, token("user_no_assignment_001"));
  record("no active specialization", "CAPSTONE_ENTRY_NOT_ELIGIBLE", noAssignment.status);

  await establishGrade11(page, "user_assignment_technical_001", "technical-operations");
  await establishGrade12(page, "user_assignment_technical_001", "technical-operations");
  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: "user_assignment_technical_001", program_id: program, specialization_id: "networking-fiber", grade: 11, assignment_type: "PRIMARY", assignment_source: "ADVISOR_CHANGE" }, 201);
  let result = await gate(page, token("user_assignment_technical_001"));
  record("no active course assignment", "CAPSTONE_ENTRY_NOT_ELIGIBLE", result.status);

  await establishGrade11(page, "user_no_assignment_001", "technical-operations");
  await establishGrade12(page, "user_no_assignment_001", "technical-operations", { omitProof: true });
  await call(page, "post", "/prepare-prove/activity-results", token("user_no_assignment_001"), { result: { activity_id: branchData["technical-operations"].proof, observations: ["Synthetic result without submitted evidence."], uncertainty: "The scenario does not establish root cause.", safe_next_step: "Document and escalate through the authorized workflow." } }, 201);
  result = await gate(page, token("user_no_assignment_001"));
  record("result without evidence", "CAPSTONE_ENTRY_NOT_ELIGIBLE", result.status);

  await establishGrade11(page, "user_assignment_networking_001", "networking-fiber");
  await establishGrade12(page, "user_assignment_networking_001", "networking-fiber");
  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: "user_assignment_networking_001", program_id: program, specialization_id: "electrical-infrastructure", grade: 11, assignment_type: "PRIMARY", assignment_source: "ADVISOR_CHANGE" }, 201);
  result = await gate(page, token("user_assignment_networking_001"));
  record("specialization/course mismatch", "CAPSTONE_ENTRY_NOT_ELIGIBLE", result.status);

  await establishGrade11(page, "user_assignment_electrical_001", "electrical-infrastructure");
  await establishGrade12(page, "user_assignment_electrical_001", "electrical-infrastructure", { omitShared12: true });
  result = await gate(page, token("user_assignment_electrical_001"));
  record("missing one shared-core lesson", "CAPSTONE_ENTRY_NOT_ELIGIBLE", result.status);

  await establishGrade11(page, "user_assignment_mechanical_001", "mechanical-hvac");
  await establishGrade12(page, "user_assignment_mechanical_001", "mechanical-hvac", { omitBranch12: true });
  result = await gate(page, token("user_assignment_mechanical_001"));
  record("missing one branch lesson", "CAPSTONE_ENTRY_NOT_ELIGIBLE", result.status);

  await establishGrade11(page, "user_assignment_security_001", "cybersecurity-security");
  await establishGrade12(page, "user_assignment_security_001", "cybersecurity-security", { omitProof: true });
  result = await gate(page, token("user_assignment_security_001"));
  record("missing required PROVE result", "CAPSTONE_ENTRY_NOT_ELIGIBLE", result.status);

  const pending = await proof(page, token("user_assignment_security_001"), branchData["cybersecurity-security"].proof, "phase43a-pending", null);
  result = await gate(page, token("user_assignment_security_001"));
  record("pending review", "CAPSTONE_ENTRY_NOT_ELIGIBLE", result.status);
  await call(page, "post", `/prepare-prove/evidence/${pending.evidence.evidence_id}/review`, reviewer, { decision: "EVIDENCE_INSUFFICIENT" });
  result = await gate(page, token("user_assignment_security_001"));
  record("insufficient evidence", "CAPSTONE_ENTRY_NOT_ELIGIBLE", result.status);

  await establishGrade11(page, "user_assignment_ai_001", "ai-cloud-infrastructure");
  await establishGrade12(page, "user_assignment_ai_001", "ai-cloud-infrastructure");
  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: "user_assignment_ai_001", program_id: program, specialization_id: "technical-operations", grade: 11, assignment_type: "PRIMARY", assignment_source: "ADVISOR_CHANGE" }, 201);
  result = await gate(page, token("user_assignment_ai_001"));
  record("wrong-branch demonstrated competency", "CAPSTONE_ENTRY_NOT_ELIGIBLE", result.status);
  record("transferred specialization", "CAPSTONE_ENTRY_NOT_ELIGIBLE", result.status);

  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: "user_assignment_ai_001", program_id: program, specialization_id: "technical-operations", grade: 11, assignment_type: "PRIMARY", assignment_source: "ADVISOR_CHANGE" }, 201);
  result = await gate(page, token("user_assignment_ai_001"));
  record("inactive course assignment", "CAPSTONE_ENTRY_NOT_ELIGIBLE", result.status);

  const crossTenant = await page.request.get(`${process.env.SHS_TEST_API_URL}/programs/${program}/capstone-entry?learner_id=user_assignment_ai_001`, { headers: headers(otherAdmin) });
  record("cross-tenant gate read", "HTTP_DENIED", crossTenant.status(), crossTenant.status());
  const employerRead = await page.request.get(`${process.env.SHS_TEST_API_URL}/programs/${program}/capstone-entry`, { headers: headers(employer) });
  record("employer gate read", "HTTP_DENIED", employerRead.status(), employerRead.status());

  expect(noAssignment.status).toBe("CAPSTONE_ENTRY_NOT_ELIGIBLE");
  expect(cases).toHaveLength(14);
  for (const item of cases) console.log(`[phase43a-gate] ${JSON.stringify(item)}`);
});
