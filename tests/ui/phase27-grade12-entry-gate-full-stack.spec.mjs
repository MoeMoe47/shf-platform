import { test, expect } from "@playwright/test";

const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const frontend = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const admin = "Bearer dev-token:user_admin_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const student = "Bearer dev-token:user_student_001";
const noAssignmentStudent = "Bearer dev-token:user_no_assignment_001";
const operator = "Bearer dev-token:user_operator_001";
const headers = (token) => ({ Authorization: token, "Content-Type": "application/json" });
const program = "data-center-specialization-11";
const shared = ["data-center-specialization-11-safety-professional-practice", "data-center-specialization-11-technical-communication", "data-center-specialization-11-reliability-systems-thinking", "data-center-specialization-11-evidence-and-feedback", "data-center-specialization-11-career-transition-planning"];
const branches = [
  ["technical-operations", "user_assignment_technical_001", ["data-center-specialization-11-monitoring-proof", "data-center-specialization-11-linux-inspection", "data-center-specialization-11-telemetry-troubleshooting"], ["grade11-technical-operations-monitoring-proof", "grade11-technical-operations-linux-inspection", "grade11-technical-operations-troubleshooting-documentation"]],
  ["networking-fiber", "user_assignment_networking_001", ["data-center-specialization-11-network-topology", "data-center-specialization-11-connectivity-troubleshooting", "data-center-specialization-11-networking-fiber-project"], ["grade11-networking-fiber-topology-interpretation", "grade11-networking-fiber-connectivity-troubleshooting", "grade11-networking-fiber-cabling-documentation"]],
  ["electrical-infrastructure", "user_assignment_electrical_001", ["data-center-specialization-11-power-paths", "data-center-specialization-11-load-capacity", "data-center-specialization-11-electrical-incident-project"], ["grade11-electrical-power-path-interpretation", "grade11-electrical-load-capacity-reasoning", "grade11-electrical-infrastructure-incident-analysis"]],
  ["mechanical-hvac", "user_assignment_mechanical_001", ["data-center-specialization-11-airflow-management", "data-center-specialization-11-cooling-capacity", "data-center-specialization-11-thermal-incident-project"], ["grade11-mechanical-hvac-thermal-airflow-interpretation", "grade11-mechanical-hvac-cooling-capacity-reliability", "grade11-mechanical-hvac-cooling-incident-analysis"]],
  ["cybersecurity-security", "user_assignment_security_001", ["data-center-specialization-11-authorization-least-privilege", "data-center-specialization-11-security-monitoring-logs", "data-center-specialization-11-security-incident-project"], ["grade11-security-access-control-analysis", "grade11-security-log-alert-interpretation", "grade11-security-incident-documentation-escalation"]],
  ["ai-cloud-infrastructure", "user_assignment_ai_001", ["data-center-specialization-11-cpu-gpu-workloads", "data-center-specialization-11-capacity-bottlenecks", "data-center-specialization-11-ai-cloud-project"], ["grade11-ai-cloud-workload-analysis", "grade11-ai-cloud-capacity-bottleneck-analysis", "grade11-ai-cloud-reliability-operations-analysis"]],
];

async function call(page, method, path, token, data, expected = 200) {
  const response = await page.request[method](`${api}${path}`, { headers: headers(token), data });
  const text = await response.text();
  expect(response.status(), `${method} ${path}: ${text}`).toBe(expected);
  return text ? JSON.parse(text).data : undefined;
}

test("learner and authorized staff complete the real request/confirmation browser flow", { skip: api && frontend ? false : "stack URLs required", timeout: 120_000 }, async ({ page, browser }) => {
  await page.setExtraHTTPHeaders({ Authorization: student });
  await page.goto(`${frontend}/curriculum.html#/curriculum/asl/dashboard`);
  await expect(page.getByRole("heading", { name: "Choose your specialization" })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(6);
  await page.getByRole("radio", { name: "Networking and Fiber" }).check();
  await page.getByLabel("Why are you interested? (optional)").fill("I want to understand reliable network paths.");
  await page.getByRole("button", { name: "Request this specialization" }).click();
  await expect(page.getByText("Request pending confirmation.")).toBeVisible();
  const pending = await call(page, "get", "/program-specialization-requests?program_id=data-center-specialization-11", student);
  expect(pending[0].status).toBe("PENDING");
  expect(await call(page, "get", "/program-specialization-assignments", student)).toHaveLength(0);
  expect(await call(page, "get", "/program-specialization-requests/pending?program_id=data-center-specialization-11", admin)).toHaveLength(1);

  const staffContext = await browser.newContext({ extraHTTPHeaders: { Authorization: admin } });
  const staffPage = await staffContext.newPage();
  await staffPage.goto(`${frontend}/curriculum.html#/curriculum/asl/dashboard`);
  await expect(staffPage.getByRole("heading", { name: "Pending confirmations" })).toBeVisible();
  await staffPage.getByRole("button", { name: "Confirm assignment" }).click();
  await expect(staffPage.getByText("Specialization confirmed.")).toBeVisible();
  await staffContext.close();
  await page.reload();
  await expect(page.getByText("Current specialization: networking-fiber")).toBeVisible();
});

test("all six branches derive eligibility and the Grade 12 entry gate enforces it", { skip: api ? false : "stack URL required", timeout: 120_000 }, async ({ page }) => {
  for (const [specialization, learnerId, lessons, activities] of branches) {
    await call(page, "post", "/program-specialization-assignments", admin, { learner_id: learnerId, program_id: program, specialization_id: specialization, grade: 11 }, 201);
    for (const lessonId of [...shared, ...lessons]) await call(page, "post", `/curriculum/lessons/${lessonId}/complete`, `Bearer dev-token:${learnerId}`, { curriculum: program });
    for (const activityId of activities) {
      const result = await call(page, "post", "/prepare-prove/activity-results", `Bearer dev-token:${learnerId}`, { result: { activity_id: activityId, observations: ["Synthetic evidence recorded for Grade 12 entry proof."], uncertainty: "Scenario uncertainty is documented.", safe_next_step: "Escalate through an authorized program process." } }, 201);
      const evidence = await call(page, "post", "/prepare-prove/evidence", `Bearer dev-token:${learnerId}`, { source_result_id: result.result_id, criterion: "grade12-entry" }, 201);
      await call(page, "post", `/prepare-prove/evidence/${evidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" });
    }
    const eligibility = await call(page, "get", `/programs/${program}/grade12-eligibility`, `Bearer dev-token:${learnerId}`);
    expect(eligibility.status, specialization).toBe("ELIGIBLE");
    expect(eligibility.policy_version).toBe("grade12-entry-v1");
    const gate = await call(page, "get", `/programs/${program}/grade12-entry`, `Bearer dev-token:${learnerId}`);
    expect(gate.gate).toBe("OPEN_PLACEHOLDER_ONLY");
  }

  const noAssignment = await call(page, "get", `/programs/${program}/grade12-eligibility`, noAssignmentStudent);
  expect(noAssignment.status).toBe("NOT_ELIGIBLE");
  expect(noAssignment.missing_requirements.map((item) => item.code)).toContain("NO_ACTIVE_SPECIALIZATION_ASSIGNMENT");
  const blocked = await page.request.get(`${api}/programs/${program}/grade12-entry`, { headers: headers(noAssignmentStudent) });
  expect(blocked.status()).toBe(403);
  const pendingRequest = await call(page, "post", "/program-specialization-requests", student, { program_id: program, specialization_id: "networking-fiber" }, 201);
  expect((await call(page, "get", `/programs/${program}/grade12-eligibility`, student)).status).toBe("NOT_ELIGIBLE");
  const selfConfirm = await page.request.post(`${api}/program-specialization-requests/${pendingRequest.request_id}/confirm`, { headers: headers(student), data: {} });
  expect(selfConfirm.status()).toBe(403);
  const staffDenied = await page.request.post(`${api}/program-specialization-requests/${pendingRequest.request_id}/confirm`, { headers: headers(operator), data: {} });
  expect(staffDenied.status()).toBe(403);
});
