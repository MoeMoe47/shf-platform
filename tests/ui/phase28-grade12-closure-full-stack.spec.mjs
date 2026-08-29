import { test, expect } from "@playwright/test";

const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const frontend = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const program = "data-center-specialization-11";
const admin = "Bearer dev-token:user_admin_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const student = "Bearer dev-token:user_student_001";
const operator = "Bearer dev-token:user_operator_001";
const noAssignment = "Bearer dev-token:user_no_assignment_001";
const headers = (token, extra = {}) => ({ Authorization: token, "Content-Type": "application/json", ...extra });
const shared = ["data-center-specialization-11-safety-professional-practice", "data-center-specialization-11-technical-communication", "data-center-specialization-11-reliability-systems-thinking", "data-center-specialization-11-evidence-and-feedback", "data-center-specialization-11-career-transition-planning"];
const branches = [
  ["technical-operations", "user_assignment_technical_001", ["data-center-specialization-11-monitoring-proof", "data-center-specialization-11-linux-inspection", "data-center-specialization-11-telemetry-troubleshooting"], ["grade11-technical-operations-monitoring-proof", "grade11-technical-operations-linux-inspection", "grade11-technical-operations-troubleshooting-documentation"]],
  ["networking-fiber", "user_assignment_networking_001", ["data-center-specialization-11-network-topology", "data-center-specialization-11-connectivity-troubleshooting", "data-center-specialization-11-networking-fiber-project"], ["grade11-networking-fiber-topology-interpretation", "grade11-networking-fiber-connectivity-troubleshooting", "grade11-networking-fiber-cabling-documentation"]],
  ["electrical-infrastructure", "user_assignment_electrical_001", ["data-center-specialization-11-power-paths", "data-center-specialization-11-load-capacity", "data-center-specialization-11-electrical-incident-project"], ["grade11-electrical-power-path-interpretation", "grade11-electrical-load-capacity-reasoning", "grade11-electrical-infrastructure-incident-analysis"]],
  ["mechanical-hvac", "user_assignment_mechanical_001", ["data-center-specialization-11-airflow-management", "data-center-specialization-11-cooling-capacity", "data-center-specialization-11-thermal-incident-project"], ["grade11-mechanical-hvac-thermal-airflow-interpretation", "grade11-mechanical-hvac-cooling-capacity-reliability", "grade11-mechanical-hvac-cooling-incident-analysis"]],
  ["cybersecurity-security", "user_assignment_security_001", ["data-center-specialization-11-authorization-least-privilege", "data-center-specialization-11-security-monitoring-logs", "data-center-specialization-11-security-incident-project"], ["grade11-security-access-control-analysis", "grade11-security-log-alert-interpretation", "grade11-security-incident-documentation-escalation"]],
  ["ai-cloud-infrastructure", "user_assignment_ai_001", ["data-center-specialization-11-cpu-gpu-workloads", "data-center-specialization-11-capacity-bottlenecks", "data-center-specialization-11-ai-cloud-project"], ["grade11-ai-cloud-workload-analysis", "grade11-ai-cloud-capacity-bottleneck-analysis", "grade11-ai-cloud-reliability-operations-analysis"]],
];

async function call(page, method, path, token, data, expected = 200, extra = {}) {
  const response = await page.request[method](`${api}${path}`, { headers: headers(token, extra), data });
  const body = await response.text();
  expect(response.status(), `${method} ${path}: ${body}`).toBe(expected);
  return body ? JSON.parse(body).data : undefined;
}

async function complete(page, token, lessonId) {
  return call(page, "post", `/curriculum/lessons/${lessonId}/complete`, token, { curriculum: program }, 200);
}

async function proof(page, token, activityId, safeNextStep = "Document the evidence and escalate through an authorized process.") {
  const result = await call(page, "post", "/prepare-prove/activity-results", token, { result: { activity_id: activityId, observations: ["Synthetic evidence was reviewed."], uncertainty: "The scenario does not confirm root cause.", safe_next_step: safeNextStep } }, 201);
  const evidence = await call(page, "post", "/prepare-prove/evidence", token, { source_result_id: result.result_id, criterion: "phase28-entry-proof" }, 201);
  return { result, evidence };
}

test("Phase 28 closes eligibility, transfer, privacy, accessibility, and gate proof", { skip: api && frontend ? false : "disposable stack URLs required", timeout: 180_000 }, async ({ page, browser }) => {
  // Establish the no-assignment and pending-request gates before the browser confirmation flow creates an assignment.
  const noAssignmentEligibility = await call(page, "get", `/programs/${program}/grade12-eligibility`, noAssignment);
  expect(noAssignmentEligibility.status).toBe("NOT_ELIGIBLE");
  expect(noAssignmentEligibility.missing_requirements[0].code).toBe("NO_ACTIVE_SPECIALIZATION_ASSIGNMENT");
  const pendingRequest = await call(page, "post", "/program-specialization-requests", student, { program_id: program, specialization_id: "networking-fiber" }, 201);
  const pendingEligibility = await call(page, "get", `/programs/${program}/grade12-eligibility`, student);
  expect(pendingEligibility.status).toBe("NOT_ELIGIBLE");
  expect(pendingEligibility.missing_requirements.some((entry) => entry.code === "NO_ACTIVE_SPECIALIZATION_ASSIGNMENT")).toBe(true);

  // A confirmed assignment with incomplete branch facts exercises the remaining negative gate states.
  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: "user_no_assignment_001", program_id: program, specialization_id: "electrical-infrastructure", grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
  const missingBranch = await call(page, "get", `/programs/${program}/grade12-eligibility`, noAssignment);
  expect(missingBranch.status).toBe("NOT_ELIGIBLE");
  expect(missingBranch.missing_requirements.some((entry) => entry.code === "SHARED_CORE_REQUIREMENT_MISSING")).toBe(true);
  for (const lessonId of [...shared, "data-center-specialization-11-power-paths", "data-center-specialization-11-load-capacity", "data-center-specialization-11-electrical-incident-project"]) await complete(page, noAssignment, lessonId);
  const electricalPending = await proof(page, noAssignment, "grade11-electrical-power-path-interpretation");
  const pendingCompetency = await call(page, "get", `/programs/${program}/grade12-eligibility`, noAssignment);
  expect(pendingCompetency.status).toBe("NOT_ELIGIBLE");
  expect(pendingCompetency.missing_requirements.some((entry) => entry.detail === "electrical-power-path-interpretation")).toBe(true);
  await call(page, "post", `/prepare-prove/evidence/${electricalPending.evidence.evidence_id}/review`, reviewer, { decision: "EVIDENCE_INSUFFICIENT" });
  const insufficientCompetency = await call(page, "get", `/programs/${program}/grade12-eligibility`, noAssignment);
  expect(insufficientCompetency.status).toBe("NOT_ELIGIBLE");
  expect(insufficientCompetency.missing_requirements.some((entry) => entry.detail === "electrical-power-path-interpretation")).toBe(true);

  // Exercise all six policy branches with canonical assignments, completions, results, evidence, and reviews.
  let networkingAssignment;
  for (const [specialization, learnerId, lessons, activities] of branches) {
    const assignment = await call(page, "post", "/program-specialization-assignments", admin, { learner_id: learnerId, program_id: program, specialization_id: specialization, grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
    if (specialization === "networking-fiber") networkingAssignment = assignment;
    for (const lessonId of [...shared, ...lessons]) await complete(page, `Bearer dev-token:${learnerId}`, lessonId);
    for (const activityId of activities) {
      const item = await proof(page, `Bearer dev-token:${learnerId}`, activityId);
      if (specialization === "networking-fiber" && activityId === activities[1]) {
        const pending = await call(page, "get", `/programs/${program}/grade12-eligibility`, `Bearer dev-token:${learnerId}`);
        expect(pending.status).toBe("NOT_ELIGIBLE");
        expect(pending.missing_requirements.some((entry) => entry.detail === "network-connectivity-troubleshooting")).toBe(true);
        const insufficient = await call(page, "post", `/prepare-prove/evidence/${item.evidence.evidence_id}/review`, reviewer, { decision: "EVIDENCE_INSUFFICIENT" });
        expect(insufficient.decision).toBe("EVIDENCE_INSUFFICIENT");
        const insufficientEligibility = await call(page, "get", `/programs/${program}/grade12-eligibility`, `Bearer dev-token:${learnerId}`);
        expect(insufficientEligibility.status).toBe("NOT_ELIGIBLE");
        const reassessed = await proof(page, `Bearer dev-token:${learnerId}`, "grade11-networking-fiber-connectivity-troubleshooting-reassessment");
        const demonstrated = await call(page, "post", `/prepare-prove/evidence/${reassessed.evidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" });
        expect(demonstrated.decision).toBe("DEMONSTRATED");
        const repeated = await call(page, "post", `/prepare-prove/evidence/${reassessed.evidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" });
        expect(repeated.decision_id).toBe(demonstrated.decision_id);
        const oldStatus = await call(page, "get", `/prepare-prove/proof-status?activity_id=${activityId}`, `Bearer dev-token:${learnerId}`);
        expect(oldStatus.decision.decision).toBe("EVIDENCE_INSUFFICIENT");
      } else {
        await call(page, "post", `/prepare-prove/evidence/${item.evidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" });
      }
    }
    const eligibility = await call(page, "get", `/programs/${program}/grade12-eligibility`, `Bearer dev-token:${learnerId}`);
    expect(eligibility.status, specialization).toBe("ELIGIBLE");
    expect(eligibility.policy_version).toBe("grade12-entry-v1");
  }

  // Cross-branch evidence cannot be injected into an Electrical learner's institutional record.
  const wrongBranch = await page.request.post(`${api}/prepare-prove/activity-results`, { headers: headers(`Bearer dev-token:user_assignment_electrical_001`), data: { result: { activity_id: "grade11-networking-fiber-topology-interpretation", observations: ["Wrong branch attempt."], safe_next_step: "Escalate." } } });
  expect(wrongBranch.status()).toBe(403);

  const networkingLearner = "Bearer dev-token:user_assignment_networking_001";
  const networkingGate = await call(page, "get", `/programs/${program}/grade12-entry`, networkingLearner);
  expect(networkingGate.gate).toBe("OPEN_PLACEHOLDER_ONLY");
  const transfer = await call(page, "post", `/program-specialization-assignments/${networkingAssignment.assignment_id}/change`, admin, { specialization_id: "ai-cloud-infrastructure" });
  expect(transfer.specialization_id).toBe("ai-cloud-infrastructure");
  const transferred = await call(page, "get", `/programs/${program}/grade12-eligibility`, networkingLearner);
  expect(transferred.status).toBe("NOT_ELIGIBLE");
  expect(transferred.missing_requirements.some((entry) => entry.detail === "ai-cloud-workload-infrastructure-analysis")).toBe(true);
  const history = await call(page, "get", "/program-specialization-assignments/user_assignment_networking_001?program_id=data-center-specialization-11", admin);
  expect(history.find((row) => row.specialization_id === "networking-fiber").status).toBe("TRANSFERRED");
  expect(history.filter((row) => row.status === "ACTIVE")).toHaveLength(1);

  // Tenant and ordinary-membership boundaries apply to requests and eligibility, not only proof evidence.
  const crossHeaders = { "x-shs-organization-id": "org_other" };
  expect((await page.request.get(`${api}/program-specialization-requests?program_id=${program}&learner_id=user_student_001`, { headers: headers(admin, crossHeaders) })).status()).toBe(403);
  expect((await page.request.post(`${api}/program-specialization-requests/${pendingRequest.request_id}/confirm`, { headers: headers(admin, crossHeaders), data: {} })).status()).toBe(403);
  expect((await page.request.get(`${api}/programs/${program}/grade12-eligibility?learner_id=user_assignment_ai_001`, { headers: headers(admin, crossHeaders) })).status()).toBe(403);
  expect((await page.request.get(`${api}/program-specialization-requests?program_id=${program}`, { headers: headers(operator) })).status()).toBe(403);
  expect((await page.request.get(`${api}/program-specialization-requests/pending?program_id=${program}`, { headers: headers(operator) })).status()).toBe(403);

  // Real learner request UI: six native choices, keyboard-friendly semantics, refresh persistence, and pending state.
  await page.setExtraHTTPHeaders(headers(student));
  await page.goto(`${frontend}/curriculum.html#/curriculum/asl/dashboard`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Choose your specialization" })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(6);
  await expect(page.locator("fieldset")).toHaveCount(1);
  await expect(page.locator("legend")).toContainText("specialization options");
  await page.getByRole("radio", { name: "Networking and Fiber" }).check();
  await page.getByLabel("Why are you interested? (optional)").fill("I want to understand reliable network paths.");
  await page.getByRole("button", { name: "Request this specialization" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Request pending confirmation.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Request pending confirmation", { exact: true })).toBeVisible();

  // Real staff UI confirms a different branch and leaves the learner's request unchanged.
  const staffContext = await browser.newContext({ extraHTTPHeaders: headers(admin) });
  const staffPage = await staffContext.newPage();
  await staffPage.goto(`${frontend}/curriculum.html#/curriculum/asl/dashboard`, { waitUntil: "networkidle" });
  await expect(staffPage.getByRole("heading", { name: "Pending confirmations" })).toBeVisible();
  await expect(staffPage.getByLabel("Confirmed specialization").first()).toBeVisible();
  await staffPage.getByLabel("Confirmed specialization").first().selectOption("ai-cloud-infrastructure");
  await staffPage.getByRole("button", { name: "Confirm assignment" }).first().focus();
  await staffPage.keyboard.press("Enter");
  await expect(staffPage.getByText("Specialization confirmed.")).toBeVisible();
  await staffContext.close();
  await page.reload();
  await expect(page.getByText("Current specialization: ai-cloud-infrastructure")).toBeVisible();

  // The assigned Networking learner can request a transfer through the same panel; staff confirms it atomically through the existing service.
  const transferContext = await browser.newContext({ extraHTTPHeaders: headers(networkingLearner) });
  const transferPage = await transferContext.newPage();
  await transferPage.goto(`${frontend}/curriculum.html#/curriculum/asl/dashboard`, { waitUntil: "networkidle" });
  await expect(transferPage.getByText("Current specialization: ai-cloud-infrastructure")).toBeVisible();
  await transferPage.getByRole("radio", { name: "Networking and Fiber" }).check();
  await transferPage.getByRole("button", { name: "Request this specialization" }).click();
  await expect(transferPage.getByText("Request pending confirmation.")).toBeVisible();
  const secondStaffContext = await browser.newContext({ extraHTTPHeaders: headers(admin) });
  const secondStaffPage = await secondStaffContext.newPage();
  await secondStaffPage.goto(`${frontend}/curriculum.html#/curriculum/asl/dashboard`, { waitUntil: "networkidle" });
  const requestEntry = secondStaffPage.locator("div").filter({ hasText: "user_assignment_networking_001" }).last();
  await requestEntry.getByLabel("Confirmed specialization").selectOption("ai-cloud-infrastructure");
  await requestEntry.getByRole("button", { name: "Confirm assignment" }).click();
  await expect(secondStaffPage.getByText("Specialization confirmed.")).toBeVisible();
  await secondStaffContext.close();
  await transferContext.close();

  // Dedicated responsive assertions for learner and staff surfaces.
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    const responsiveStaffContext = await browser.newContext({ extraHTTPHeaders: headers(admin), viewport });
    const responsiveStaffPage = await responsiveStaffContext.newPage();
    await responsiveStaffPage.goto(`${frontend}/curriculum.html#/curriculum/asl/dashboard`, { waitUntil: "networkidle" });
    await expect(responsiveStaffPage.getByRole("heading", { name: "Choose your specialization" })).toBeVisible();
    expect(await responsiveStaffPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await responsiveStaffContext.close();
  }

  // Browser gate proof: eligible placeholder, then direct URL transfer re-lock. Client state is not consulted.
  const gateContext = await browser.newContext({ extraHTTPHeaders: headers("Bearer dev-token:user_assignment_technical_001") });
  const gatePage = await gateContext.newPage();
  await gatePage.goto(`${frontend}/curriculum.html#/curriculum/grade12-entry?eligible=true`, { waitUntil: "networkidle" });
  await expect(gatePage.getByRole("heading", { name: "Grade 12 entry verified" })).toBeVisible();
  await expect(gatePage.getByText(/integrated capstone is not yet active/)).toBeVisible();
  await gateContext.close();

  const blockedContext = await browser.newContext({ extraHTTPHeaders: headers(networkingLearner) });
  const blockedPage = await blockedContext.newPage();
  await blockedPage.addInitScript(() => localStorage.setItem("grade12Eligible", "true"));
  await blockedPage.goto(`${frontend}/curriculum.html#/curriculum/grade12-entry?eligible=true`, { waitUntil: "networkidle" });
  await expect(blockedPage.getByRole("heading", { name: "Grade 12 requirements incomplete" })).toBeVisible();
  await blockedContext.close();
});
