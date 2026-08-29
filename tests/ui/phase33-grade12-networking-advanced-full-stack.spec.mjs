import { test, expect } from "@playwright/test";

const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const frontend = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const program = "data-center-specialization-11";
const learnerId = "user_assignment_networking_001";
const learner = `Bearer dev-token:${learnerId}`;
const admin = "Bearer dev-token:user_admin_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const technical = "Bearer dev-token:user_assignment_technical_001";
const json = (token) => ({ Authorization: token, "Content-Type": "application/json" });
const shared11 = ["data-center-specialization-11-safety-professional-practice", "data-center-specialization-11-technical-communication", "data-center-specialization-11-reliability-systems-thinking", "data-center-specialization-11-evidence-and-feedback", "data-center-specialization-11-career-transition-planning"];
const branch11 = ["data-center-specialization-11-network-topology", "data-center-specialization-11-connectivity-troubleshooting", "data-center-specialization-11-networking-fiber-project"];
const grade12 = ["data-center-specialization-12-network-architecture-dependencies", "data-center-specialization-12-routing-path-selection", "data-center-specialization-12-network-resilience-failure-domains", "data-center-specialization-12-network-performance-capacity", "data-center-specialization-12-fiber-path-reliability", "data-center-specialization-12-controlled-network-change", "data-center-specialization-12-network-incident-coordination", "data-center-specialization-12-advanced-networking-project"];

async function call(page, method, path, token, data, expected = 200) {
  const response = await page.request[method](`${api}${path}`, { headers: json(token), data });
  const body = await response.text();
  expect(response.status(), `${method} ${path}: ${body}`).toBe(expected);
  return body ? JSON.parse(body).data : undefined;
}
async function complete(page, token, lessonId, curriculum) { return call(page, "post", `/curriculum/lessons/${lessonId}/complete`, token, { curriculum }, 200); }
async function proof(page, token, activityId, criterion) {
  const result = await call(page, "post", "/prepare-prove/activity-results", token, { result: { activity_id: activityId, observations: ["Synthetic path and telemetry observations."], uncertainty: "The scenario does not establish a single root cause.", safe_next_step: "Document the evidence and escalate through the approved sandbox workflow." } }, 201);
  const evidence = await call(page, "post", "/prepare-prove/evidence", token, { source_result_id: result.result_id, criterion }, 201);
  return evidence;
}

test("Phase 33 proves the Grade 12 Networking and Fiber advanced branch", { skip: api && frontend ? false : "disposable stack URLs required", timeout: 240_000 }, async ({ page, browser }) => {
  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: learnerId, program_id: program, specialization_id: "networking-fiber", grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
  for (const lesson of [...shared11, ...branch11]) await complete(page, learner, lesson, program);
  for (const [activity, criterion] of [["grade11-networking-fiber-topology-interpretation", "phase33-entry"], ["grade11-networking-fiber-connectivity-troubleshooting", "phase33-entry"], ["grade11-networking-fiber-cabling-documentation", "phase33-entry"]]) {
    const evidence = await proof(page, learner, activity, criterion);
    await call(page, "post", `/prepare-prove/evidence/${evidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" }, 200);
  }
  const eligibility = await call(page, "get", `/programs/${program}/grade12-eligibility`, learner);
  expect(eligibility.status).toBe("ELIGIBLE");
  const assignment = await call(page, "post", "/program-course-assignments", admin, { learner_id: learnerId, program_id: program, course_id: "data-center-networking-fiber-12", specialization_id: "networking-fiber" }, 201);
  expect(assignment.specialization_id).toBe("networking-fiber");
  const repeated = await call(page, "post", "/program-course-assignments", admin, { learner_id: learnerId, program_id: program, course_id: "data-center-networking-fiber-12", specialization_id: "networking-fiber" }, 201);
  expect(repeated.assignment_id).toBe(assignment.assignment_id);

  const mismatch = await page.request.post(`${api}/program-course-assignments`, { headers: json(admin), data: { learner_id: "user_assignment_technical_001", program_id: program, course_id: "data-center-networking-fiber-12", specialization_id: "networking-fiber" } });
  expect(mismatch.status()).toBe(400);
  const wrongCompletion = await page.request.post(`${api}/curriculum/lessons/${grade12[0]}/complete`, { headers: json(technical), data: { curriculum: "data-center-networking-fiber-12" } });
  expect(wrongCompletion.status()).toBe(403);
  const wrongProof = await page.request.post(`${api}/prepare-prove/activity-results`, { headers: json(technical), data: { result: { activity_id: "grade12-networking-fiber-resilient-network-path-analysis", observations: ["Wrong branch."], safe_next_step: "Escalate." } } });
  expect(wrongProof.status()).toBe(403);

  for (const id of grade12) {
    await page.goto(`${frontend}/curriculum.html#/curriculum/lessons/${id}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();
  }
  for (const id of [grade12[0], grade12[3], grade12[7]]) await complete(page, learner, id, "data-center-networking-fiber-12");

  const firstEvidence = await proof(page, learner, "grade12-networking-fiber-resilient-network-path-analysis", "phase33-advanced");
  await page.setExtraHTTPHeaders(json(reviewer));
  await page.goto(`${frontend}/curriculum.html#/curriculum/instructor/prove/${firstEvidence.evidence_id}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("prepare-prove-review")).toBeVisible();
  await page.getByRole("button", { name: "Record demonstrated" }).click();
  await expect(page.getByText("Review recorded: DEMONSTRATED")).toBeVisible();
  const secondEvidence = await proof(page, learner, "grade12-networking-fiber-change-incident-coordination", "phase33-advanced");
  await call(page, "post", `/prepare-prove/evidence/${secondEvidence.evidence_id}/review`, reviewer, { decision: "EVIDENCE_INSUFFICIENT" }, 200);
  const reassessed = await proof(page, learner, "grade12-networking-fiber-change-incident-coordination-reassessment", "phase33-reassessment");
  await call(page, "post", `/prepare-prove/evidence/${reassessed.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" }, 200);
  const status = await call(page, "get", "/prepare-prove/proof-status?activity_id=grade12-networking-fiber-change-incident-coordination", learner);
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
