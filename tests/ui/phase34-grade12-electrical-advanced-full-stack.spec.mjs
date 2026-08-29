import { test, expect } from "@playwright/test";

const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const frontend = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const program = "data-center-specialization-11";
const learnerId = "user_assignment_electrical_001";
const learner = `Bearer dev-token:${learnerId}`;
const admin = "Bearer dev-token:user_admin_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const technical = "Bearer dev-token:user_assignment_technical_001";
const json = (token) => ({ Authorization: token, "Content-Type": "application/json" });
const shared11 = ["data-center-specialization-11-safety-professional-practice", "data-center-specialization-11-technical-communication", "data-center-specialization-11-reliability-systems-thinking", "data-center-specialization-11-evidence-and-feedback", "data-center-specialization-11-career-transition-planning"];
const branch11 = ["data-center-specialization-11-power-paths", "data-center-specialization-11-load-capacity", "data-center-specialization-11-electrical-incident-project"];
const grade12 = ["data-center-specialization-12-critical-power-architecture", "data-center-specialization-12-ab-power-paths-failure-domains", "data-center-specialization-12-electrical-load-capacity-headroom", "data-center-specialization-12-ups-backup-transfer-states", "data-center-specialization-12-electrical-monitoring-telemetry", "data-center-specialization-12-controlled-electrical-change", "data-center-specialization-12-critical-power-incident-coordination", "data-center-specialization-12-advanced-electrical-infrastructure-project"];

async function call(page, method, path, token, data, expected = 200) {
  const response = await page.request[method](`${api}${path}`, { headers: json(token), data });
  const body = await response.text();
  expect(response.status(), `${method} ${path}: ${body}`).toBe(expected);
  return body ? JSON.parse(body).data : undefined;
}
async function complete(page, token, lessonId, curriculum) { return call(page, "post", `/curriculum/lessons/${lessonId}/complete`, token, { curriculum }, 200); }
async function proof(page, token, activityId, criterion) {
  const result = await call(page, "post", "/prepare-prove/activity-results", token, { result: { activity_id: activityId, observations: ["Synthetic power-path and telemetry observations."], uncertainty: "The scenario does not establish a single physical root cause.", safe_next_step: "Document the evidence and escalate through the approved simulation workflow." } }, 201);
  return call(page, "post", "/prepare-prove/evidence", token, { source_result_id: result.result_id, criterion }, 201);
}

test("Phase 34 proves the Grade 12 Electrical Infrastructure advanced branch", { skip: api && frontend ? false : "disposable stack URLs required", timeout: 240_000 }, async ({ page, browser }) => {
  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: learnerId, program_id: program, specialization_id: "electrical-infrastructure", grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
  for (const lesson of [...shared11, ...branch11]) await complete(page, learner, lesson, program);
  for (const [activity, criterion] of [["grade11-electrical-power-path-interpretation", "phase34-entry"], ["grade11-electrical-load-capacity-reasoning", "phase34-entry"], ["grade11-electrical-infrastructure-incident-analysis", "phase34-entry"]]) {
    const evidence = await proof(page, learner, activity, criterion);
    await call(page, "post", `/prepare-prove/evidence/${evidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" }, 200);
  }
  const eligibility = await call(page, "get", `/programs/${program}/grade12-eligibility`, learner);
  expect(eligibility.status).toBe("ELIGIBLE");
  const assignment = await call(page, "post", "/program-course-assignments", admin, { learner_id: learnerId, program_id: program, course_id: "data-center-electrical-infrastructure-12", specialization_id: "electrical-infrastructure" }, 201);
  expect(assignment.specialization_id).toBe("electrical-infrastructure");
  const repeated = await call(page, "post", "/program-course-assignments", admin, { learner_id: learnerId, program_id: program, course_id: "data-center-electrical-infrastructure-12", specialization_id: "electrical-infrastructure" }, 201);
  expect(repeated.assignment_id).toBe(assignment.assignment_id);

  const mismatch = await page.request.post(`${api}/program-course-assignments`, { headers: json(admin), data: { learner_id: "user_assignment_technical_001", program_id: program, course_id: "data-center-electrical-infrastructure-12", specialization_id: "electrical-infrastructure" } });
  expect(mismatch.status()).toBe(400);
  const wrongCompletion = await page.request.post(`${api}/curriculum/lessons/${grade12[0]}/complete`, { headers: json(technical), data: { curriculum: "data-center-electrical-infrastructure-12" } });
  expect(wrongCompletion.status()).toBe(403);
  const wrongProof = await page.request.post(`${api}/prepare-prove/activity-results`, { headers: json(technical), data: { result: { activity_id: "grade12-electrical-infrastructure-critical-power-reliability-analysis", observations: ["Wrong branch."], safe_next_step: "Escalate." } } });
  expect(wrongProof.status()).toBe(403);

  for (const id of grade12) {
    await page.goto(`${frontend}/curriculum.html#/curriculum/lessons/${id}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();
  }
  for (const id of [grade12[0], grade12[3], grade12[7]]) await complete(page, learner, id, "data-center-electrical-infrastructure-12");

  const firstEvidence = await proof(page, learner, "grade12-electrical-infrastructure-critical-power-reliability-analysis", "phase34-advanced");
  await page.setExtraHTTPHeaders(json(reviewer));
  await page.goto(`${frontend}/curriculum.html#/curriculum/instructor/prove/${firstEvidence.evidence_id}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("prepare-prove-review")).toBeVisible();
  await page.getByRole("button", { name: "Record demonstrated" }).click();
  await expect(page.getByText("Review recorded: DEMONSTRATED")).toBeVisible();

  const secondEvidence = await proof(page, learner, "grade12-electrical-infrastructure-change-incident-coordination", "phase34-advanced");
  await call(page, "post", `/prepare-prove/evidence/${secondEvidence.evidence_id}/review`, reviewer, { decision: "EVIDENCE_INSUFFICIENT" }, 200);
  const reassessed = await proof(page, learner, "grade12-electrical-infrastructure-change-incident-coordination-reassessment", "phase34-reassessment");
  await call(page, "post", `/prepare-prove/evidence/${reassessed.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" }, 200);
  const status = await call(page, "get", "/prepare-prove/proof-status?activity_id=grade12-electrical-infrastructure-change-incident-coordination", learner);
  expect(status.decision.decision).toBe("EVIDENCE_INSUFFICIENT");

  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`${frontend}/curriculum.html#/curriculum/lessons/${grade12[7]}`, { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  }
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    const reviewerContext = await browser.newContext({ viewport, extraHTTPHeaders: json(reviewer) });
    const reviewerPage = await reviewerContext.newPage();
    await reviewerPage.goto(`${frontend}/curriculum.html#/curriculum/instructor/prove/${firstEvidence.evidence_id}`, { waitUntil: "networkidle" });
    await expect(reviewerPage.getByTestId("prepare-prove-review")).toBeVisible();
    expect(await reviewerPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
    await reviewerPage.keyboard.press("Tab");
    await expect(reviewerPage.locator(":focus")).toBeVisible();
    await reviewerContext.close();
  }
});
