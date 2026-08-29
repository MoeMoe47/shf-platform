import { test, expect } from "@playwright/test";
import "./phase41-final-convergence-closure.spec.mjs";

const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const program = "data-center-specialization-11";
const admin = "Bearer dev-token:user_admin_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const learner = "Bearer dev-token:user_student_001";
const json = (token) => ({ Authorization: token, "Content-Type": "application/json" });

async function response(page, method, path, token, data) {
  return page.request[method](`${api}${path}`, { headers: json(token), data });
}

async function call(page, method, path, token, data, expected = 200) {
  const result = await response(page, method, path, token, data);
  const body = await result.text();
  expect(result.status(), `${method} ${path}: ${body}`).toBe(expected);
  return body ? JSON.parse(body).data : undefined;
}

test("Phase 42 closes reassessment and Project separation-of-duties boundaries", { skip: api ? false : "disposable stack URL required", timeout: 240_000 }, async ({ page }) => {
  const gateBeforeProof = await call(page, "get", `/programs/${program}/capstone-entry`, learner);
  expect(gateBeforeProof.status).toBe("CAPSTONE_ENTRY_NOT_ELIGIBLE");
  expect(gateBeforeProof.missing_requirements.map((item) => item.code)).toContain("GRADE12_SHARED_CORE_MISSING");

  const learnerReview = await response(page, "post", "/prepare-prove/evidence/fake-phase42-evidence/review", learner, { decision: "DEMONSTRATED" });
  expect(learnerReview.status()).toBe(403);
  const staffReview = await response(page, "post", "/prepare-prove/evidence/fake-phase42-evidence/review", "Bearer dev-token:user_instructor_001", { decision: "DEMONSTRATED" });
  expect(staffReview.status()).toBe(403);
  const employerGate = await response(page, "get", `/programs/${program}/capstone-entry`, "Bearer dev-token:user_employer_001");
  expect(employerGate.status()).toBe(403);
  const crossTenantGate = await page.request.get(`${api}/programs/${program}/capstone-entry?learner_id=user_student_001`, { headers: { ...json("Bearer dev-token:user_other_admin_001"), "x-shs-organization-id": "org_other" } });
  expect(crossTenantGate.status()).toBe(403);

  await page.waitForTimeout(17_000);
  const project = await call(page, "post", "/projects", admin, { program_id: program, title: "Phase 42 authorization matrix", project_type: "GRADE12_CONVERGENCE_FOUNDATION" }, 201);
  const team = await call(page, "post", `/projects/${project.project_id}/teams`, admin, { mode: "INDIVIDUAL_INTEGRATED_MODE" }, 201);
  const learnerManage = await response(page, "post", `/projects/${project.project_id}/teams`, learner, { mode: "COLLABORATIVE_MODE" });
  expect(learnerManage.status()).toBe(403);
  const reviewerManage = await response(page, "post", `/projects/${project.project_id}/teams`, reviewer, { mode: "COLLABORATIVE_MODE" });
  expect(reviewerManage.status()).toBe(403);
  const employerManage = await response(page, "post", `/projects/${project.project_id}/teams`, "Bearer dev-token:user_employer_001", { mode: "COLLABORATIVE_MODE" });
  expect(employerManage.status()).toBe(403);
  const crossTenantManage = await page.request.post(`${api}/projects/${project.project_id}/teams`, { headers: json("Bearer dev-token:user_other_admin_001"), data: { mode: "COLLABORATIVE_MODE" } });
  expect(crossTenantManage.status()).toBe(403);
  expect(team.mode).toBe("INDIVIDUAL_INTEGRATED_MODE");
});
