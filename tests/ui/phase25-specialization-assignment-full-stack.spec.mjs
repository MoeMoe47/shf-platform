import { test, expect } from "@playwright/test";

const base = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const admin = "Bearer dev-token:user_admin_001";
const learner = "Bearer dev-token:user_student_001";
const operator = "Bearer dev-token:user_operator_001";
const headers = (token, extra = {}) => ({ Authorization: token, ...extra });

async function request(page, method, path, token, data, expected) {
  const response = await page.request[method](`${api}${path}`, { headers: headers(token), data });
  const body = await response.text();
  expect(response.status(), `${method} ${path}: ${body}`).toBe(expected);
  return body ? JSON.parse(body).data : undefined;
}

test("specialization assignment is canonical, scoped, idempotent, and protects branch evidence", { skip: base && api ? false : "stack URLs required", timeout: 120_000 }, async ({ page }) => {
  const available = await request(page, "get", "/program-specialization-assignments/available", admin, undefined, 200);
  expect(available).toHaveLength(6);
  expect(available.map((item) => item.specialization_id)).toEqual([
    "technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure",
  ]);

  const fixtures = [
    ["user_assignment_technical_001", "technical-operations"],
    ["user_assignment_networking_001", "networking-fiber"],
    ["user_assignment_electrical_001", "electrical-infrastructure"],
    ["user_assignment_mechanical_001", "mechanical-hvac"],
    ["user_assignment_security_001", "cybersecurity-security"],
    ["user_assignment_ai_001", "ai-cloud-infrastructure"],
  ];
  for (const [learnerId, specializationId] of fixtures) {
    const assignment = await request(page, "post", "/program-specialization-assignments", admin, { learner_id: learnerId, program_id: "data-center-specialization-11", specialization_id: specializationId, grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
    const repeated = await request(page, "post", "/program-specialization-assignments", admin, { learner_id: learnerId, program_id: "data-center-specialization-11", specialization_id: specializationId, grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
    expect(repeated.assignment_id).toBe(assignment.assignment_id);
    expect((await request(page, "get", `/program-specialization-assignments/${learnerId}?program_id=data-center-specialization-11`, admin, undefined, 200)).filter((row) => row.status === "ACTIVE")).toHaveLength(1);
  }

  const learnerAssignment = await request(page, "post", "/program-specialization-assignments", admin, { learner_id: "user_student_001", program_id: "data-center-specialization-11", specialization_id: "networking-fiber", grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
  const own = await request(page, "get", "/program-specialization-assignments", learner, undefined, 200);
  expect(own.find((row) => row.status === "ACTIVE").specialization_id).toBe("networking-fiber");

  const wrongBranch = await page.request.post(`${api}/prepare-prove/activity-results`, { headers: headers(learner), data: { result: { activity_id: "grade11-ai-cloud-workload-analysis", observations: ["Synthetic workload evidence."], affected_system: "AI workload", uncertainty: "Root cause is uncertain.", safe_next_step: "Document and escalate safely." } } });
  expect(wrongBranch.status()).toBe(403);

  const changed = await request(page, "post", `/program-specialization-assignments/${learnerAssignment.assignment_id}/change`, admin, { specialization_id: "ai-cloud-infrastructure" }, 200);
  expect(changed.specialization_id).toBe("ai-cloud-infrastructure");
  const history = await request(page, "get", "/program-specialization-assignments/user_student_001?program_id=data-center-specialization-11", admin, undefined, 200);
  expect(history.filter((row) => row.status === "ACTIVE")).toHaveLength(1);
  expect(history.find((row) => row.specialization_id === "networking-fiber").status).toBe("TRANSFERRED");
  expect(history.find((row) => row.specialization_id === "ai-cloud-infrastructure").assigned_by_user_id).toBe("user_admin_001");

  const allowed = await request(page, "post", "/prepare-prove/activity-results", learner, { result: { activity_id: "grade11-ai-cloud-workload-analysis", observations: ["Synthetic workload evidence."], affected_system: "AI workload", uncertainty: "Root cause is uncertain.", safe_next_step: "Document and escalate safely." } }, 201);
  expect(allowed.activity_id).toBe("grade11-ai-cloud-workload-analysis");

  const learnerMutation = await page.request.post(`${api}/program-specialization-assignments`, { headers: headers(learner), data: { learner_id: "user_student_001", program_id: "data-center-specialization-11", specialization_id: "electrical-infrastructure" } });
  expect(learnerMutation.status()).toBe(403);
  const staffMutation = await page.request.post(`${api}/program-specialization-assignments`, { headers: headers(operator), data: { learner_id: "user_student_001", program_id: "data-center-specialization-11", specialization_id: "networking-fiber" } });
  expect(staffMutation.status()).toBe(403);
  const invalid = await page.request.post(`${api}/program-specialization-assignments`, { headers: headers(admin), data: { learner_id: "user_student_001", program_id: "data-center-specialization-11", specialization_id: "not-a-specialization" } });
  expect(invalid.status()).toBe(403);
  const crossTenant = await page.request.get(`${api}/program-specialization-assignments/user_student_001`, { headers: headers(admin, { "x-shs-organization-id": "org_other" }) });
  expect(crossTenant.status()).toBe(403);
});
