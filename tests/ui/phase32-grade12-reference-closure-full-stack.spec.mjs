import { test, expect } from "@playwright/test";

const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const frontend = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const program = "data-center-specialization-11";
const course = "data-center-technical-operations-12";
const technical = "user_assignment_technical_001";
const learner = `Bearer dev-token:${technical}`;
const admin = "Bearer dev-token:user_admin_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const otherAdmin = "Bearer dev-token:user_other_admin_001";
const employer = "Bearer dev-token:user_employer_001";
const jsonHeaders = (token, extra = {}) => ({ Authorization: token, "Content-Type": "application/json", ...extra });
const shared = ["data-center-specialization-11-safety-professional-practice", "data-center-specialization-11-technical-communication", "data-center-specialization-11-reliability-systems-thinking", "data-center-specialization-11-evidence-and-feedback", "data-center-specialization-11-career-transition-planning"];
const branch = ["data-center-specialization-11-monitoring-proof", "data-center-specialization-11-linux-inspection", "data-center-specialization-11-telemetry-troubleshooting"];

async function request(page, method, path, token, data, expected = 200, extra = {}) {
  const response = await page.request[method](`${api}${path}`, { headers: jsonHeaders(token, extra), data });
  const text = await response.text();
  expect(response.status(), `${method} ${path}: ${text}`).toBe(expected);
  return text ? JSON.parse(text).data : undefined;
}

async function complete(page, token, lessonId, curriculum = program) {
  return request(page, "post", `/curriculum/lessons/${lessonId}/complete`, token, { curriculum }, 200);
}

async function makeProof(page, token, activityId, criterion = "phase32-closure") {
  const result = await request(page, "post", "/prepare-prove/activity-results", token, { result: { activity_id: activityId, observations: ["Synthetic closure evidence."], uncertainty: "The scenario does not establish root cause.", safe_next_step: "Record and escalate through the approved sandbox workflow." } }, 201);
  const evidence = await request(page, "post", "/prepare-prove/evidence", token, { source_result_id: result.result_id, criterion }, 201);
  return { result, evidence };
}

test("Phase 32 closes missing Grade 12 negatives and browser accessibility coverage", { skip: api && frontend ? false : "disposable stack URLs required", timeout: 240_000 }, async ({ page, browser }) => {
  await request(page, "post", "/program-specialization-assignments", admin, { learner_id: technical, program_id: program, specialization_id: "technical-operations", grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
  for (const lesson of [...shared, ...branch]) await complete(page, learner, lesson);
  for (const activity of ["grade11-technical-operations-monitoring-proof", "grade11-technical-operations-linux-inspection", "grade11-technical-operations-troubleshooting-documentation"]) {
    const proof = await makeProof(page, learner, activity);
    await request(page, "post", `/prepare-prove/evidence/${proof.evidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" }, 200);
  }
  expect((await request(page, "get", `/programs/${program}/grade12-eligibility`, learner)).status).toBe("ELIGIBLE");
  await request(page, "post", "/program-course-assignments", admin, { learner_id: technical, program_id: program, course_id: course, specialization_id: "technical-operations" }, 201);

  // Course assignment boundaries: organization context and academic role are enforced server-side.
  const crossTenantCourse = await page.request.post(`${api}/program-course-assignments`, { headers: jsonHeaders(otherAdmin), data: { learner_id: technical, program_id: program, course_id: course, specialization_id: "technical-operations" } });
  expect(crossTenantCourse.status()).toBe(400);
  const employerCourse = await page.request.post(`${api}/program-course-assignments`, { headers: jsonHeaders(employer), data: { learner_id: technical, program_id: program, course_id: course, specialization_id: "technical-operations" } });
  expect(employerCourse.status()).toBe(403);
  await request(page, "post", "/program-specialization-assignments", admin, { learner_id: "user_assignment_networking_001", program_id: program, specialization_id: "networking-fiber", grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
  const mismatch = await page.request.post(`${api}/program-course-assignments`, { headers: jsonHeaders(admin), data: { learner_id: "user_assignment_networking_001", program_id: program, course_id: course, specialization_id: "technical-operations" } });
  expect(mismatch.status()).toBe(400);
  const wrongBranchResult = await page.request.post(`${api}/prepare-prove/activity-results`, { headers: jsonHeaders("Bearer dev-token:user_assignment_networking_001"), data: { result: { activity_id: "grade12-technical-operations-multi-system-operations-analysis", observations: ["Wrong branch."], safe_next_step: "Escalate." } } });
  expect(wrongBranchResult.status()).toBe(403);

  // Transfer deactivates the incompatible course assignment without deleting history.
  await request(page, "post", "/program-specialization-assignments", admin, { learner_id: technical, program_id: program, specialization_id: "networking-fiber", grade: 11, assignment_type: "PRIMARY", assignment_source: "ADVISOR_CHANGE" }, 201);
  const courseHistory = await request(page, "get", `/program-course-assignments/${technical}`, admin);
  expect(courseHistory.some((item) => item.course_id === course && ["TRANSFERRED", "CANCELLED"].includes(item.status))).toBeTruthy();

  // The generic reviewer endpoint keeps tenant and authority checks on both reads and writes.
  await request(page, "post", "/program-specialization-assignments", admin, { learner_id: technical, program_id: program, specialization_id: "technical-operations", grade: 11, assignment_type: "PRIMARY", assignment_source: "ADVISOR_CHANGE" }, 201);
  await request(page, "post", "/program-course-assignments", admin, { learner_id: technical, program_id: program, course_id: course, specialization_id: "technical-operations" }, 201);
  const proof = await makeProof(page, learner, "grade12-technical-operations-multi-system-operations-analysis", "phase32-review-matrix");
  await request(page, "post", `/prepare-prove/evidence/${proof.evidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" }, 200);
  for (const token of [learner, "Bearer dev-token:user_operator_001", employer]) {
    const denied = await page.request.post(`${api}/prepare-prove/evidence/${proof.evidence.evidence_id}/review`, { headers: jsonHeaders(token), data: { decision: "DEMONSTRATED" } });
    expect(denied.status()).toBe(403);
  }
  const crossTenantRead = await page.request.get(`${api}/prepare-prove/proof-status?activity_id=grade12-technical-operations-multi-system-operations-analysis`, { headers: jsonHeaders(reviewer, { "x-shs-organization-id": "org_other" }) });
  expect(crossTenantRead.status()).toBe(403);

  // Project foundation boundaries and duplicate-version protection.
  const project = await request(page, "post", "/projects", admin, { program_id: program, course_id: course, title: "Phase 32 project isolation proof", project_type: "GRADE12_PROJECT_INFRASTRUCTURE_PROOF_ONLY" }, 201);
  const team = await request(page, "post", `/projects/${project.project_id}/teams`, admin, { mode: "COLLABORATIVE_MODE" }, 201);
  await request(page, "post", `/project-teams/${team.team_id}/members`, admin, { learner_id: technical, specialization_id: "technical-operations" }, 201);
  const v1 = await request(page, "post", `/project-teams/${team.team_id}/submissions`, learner, { version: 1, payload: { note: "initial" }, artifact_refs: ["synthetic://phase32-v1"] }, 201);
  const duplicate = await page.request.post(`${api}/project-teams/${team.team_id}/submissions`, { headers: jsonHeaders(learner), data: { version: 1, payload: { note: "duplicate" }, artifact_refs: ["synthetic://duplicate"] } });
  expect(duplicate.status()).toBe(409);
  const otherMember = await page.request.post(`${api}/project-teams/${team.team_id}/members`, { headers: jsonHeaders(otherAdmin), data: { learner_id: "user_assignment_networking_001", specialization_id: "networking-fiber" } });
  expect(otherMember.status()).toBe(403);
  const employerProjectRead = await page.request.get(`${api}/projects/${project.project_id}/submissions`, { headers: jsonHeaders(employer) });
  expect(employerProjectRead.status()).toBe(403);
  const crossProjectRead = await page.request.get(`${api}/projects/${project.project_id}/submissions`, { headers: jsonHeaders(otherAdmin) });
  expect(crossProjectRead.status()).toBe(403);
  expect(v1.version).toBe(1);

  // Dedicated responsive and keyboard smoke checks on real Grade 12 learner/reviewer routes.
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, extraHTTPHeaders: jsonHeaders(learner) });
    const view = await context.newPage();
    await view.goto(`${frontend}/curriculum.html#/curriculum/lessons/data-center-specialization-12-advanced-technical-operations-project`, { waitUntil: "networkidle" });
    expect(await view.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
    await view.keyboard.press("Tab");
    await expect(view.locator(":focus")).toBeVisible();
    await context.close();
  }
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    const reviewerContext = await browser.newContext({ viewport, extraHTTPHeaders: jsonHeaders(reviewer) });
    const reviewerPage = await reviewerContext.newPage();
    await reviewerPage.goto(`${frontend}/curriculum.html#/curriculum/instructor/prove/${proof.evidence.evidence_id}`, { waitUntil: "networkidle" });
    await expect(reviewerPage.getByTestId("prepare-prove-review")).toBeVisible();
    const reviewerOverflow = await reviewerPage.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth, offenders: Array.from(document.querySelectorAll("body *")).map((element) => ({ tag: element.tagName, className: element.className, right: Math.ceil(element.getBoundingClientRect().right) })).filter((item) => item.right > window.innerWidth + 1).slice(0, 8) }));
    expect(reviewerOverflow.width, JSON.stringify(reviewerOverflow)).toBeLessThanOrEqual(reviewerOverflow.viewport + 1);
    await reviewerPage.keyboard.press("Tab");
    await expect(reviewerPage.locator(":focus")).toBeVisible();
    await reviewerContext.close();
  }
  const absentRoster = await page.request.get(`${api}/project-teams/${team.team_id}/members`, { headers: jsonHeaders(otherAdmin) });
  expect(absentRoster.status()).toBe(404);
});
