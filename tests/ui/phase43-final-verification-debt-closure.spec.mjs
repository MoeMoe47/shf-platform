import { test, expect } from "@playwright/test";
import "./phase10-grade7-full-stack.spec.mjs";
import "./phase11-grade8-full-stack.spec.mjs";
import "./phase13-grade9-full-stack.spec.mjs";
import "./phase14-grade10-full-stack.spec.mjs";
import "./phase21-electrical-full-stack.spec.mjs";
import "./phase22-mechanical-hvac-full-stack.spec.mjs";
import "./phase23-security-full-stack.spec.mjs";
import "./phase24-ai-cloud-full-stack.spec.mjs";
import "./phase25-specialization-assignment-full-stack.spec.mjs";
import "./phase26-specialization-request-eligibility-full-stack.spec.mjs";
import "./phase28-grade12-closure-full-stack.spec.mjs";
import "./phase42-final-convergence-closure.spec.mjs";

const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const program = "data-center-specialization-11";
const admin = "Bearer dev-token:user_admin_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const learner = "Bearer dev-token:user_student_001";
const employer = "Bearer dev-token:user_employer_001";
const otherAdmin = "Bearer dev-token:user_other_admin_001";
const json = (token) => ({ Authorization: token, "Content-Type": "application/json" });

test("Phase 43 freshly verifies current gate and privacy denials", { skip: api ? false : "disposable stack URL required", timeout: 120_000 }, async ({ page }) => {
  const noAssignment = await page.request.get(`${api}/programs/${program}/capstone-entry`, { headers: json("Bearer dev-token:user_no_assignment_001") });
  expect(noAssignment.status()).toBe(200);
  expect((await noAssignment.json()).data.status).toBe("CAPSTONE_ENTRY_NOT_ELIGIBLE");

  const selfReview = await page.request.post(`${api}/prepare-prove/evidence/phase43-missing/review`, { headers: json(learner), data: { decision: "DEMONSTRATED" } });
  expect(selfReview.status()).toBe(403);
  const ordinaryStaff = await page.request.post(`${api}/prepare-prove/evidence/phase43-missing/review`, { headers: json("Bearer dev-token:user_instructor_001"), data: { decision: "DEMONSTRATED" } });
  expect(ordinaryStaff.status()).toBe(403);
  const employerGate = await page.request.get(`${api}/programs/${program}/capstone-entry`, { headers: json(employer) });
  expect(employerGate.status()).toBe(403);
  const crossTenantGate = await page.request.get(`${api}/programs/${program}/capstone-entry?learner_id=user_student_001`, { headers: { ...json(otherAdmin), "x-shs-organization-id": "org_other" } });
  expect(crossTenantGate.status()).toBe(403);

  const mismatch = await page.request.post(`${api}/program-course-assignments`, { headers: json(admin), data: { learner_id: "user_assignment_technical_001", program_id: program, course_id: "data-center-electrical-infrastructure-12", specialization_id: "electrical-infrastructure" } });
  expect(mismatch.status()).toBe(400);
  const employerProject = await page.request.post(`${api}/projects`, { headers: json(employer), data: { program_id: program, title: "Phase 43 employer denial", project_type: "GRADE12_CONVERGENCE_FOUNDATION" } });
  expect(employerProject.status()).toBe(403);
  const reviewerProject = await page.request.post(`${api}/projects`, { headers: json(reviewer), data: { program_id: program, title: "Phase 43 reviewer denial", project_type: "GRADE12_CONVERGENCE_FOUNDATION" } });
  expect(reviewerProject.status()).toBe(403);
});
