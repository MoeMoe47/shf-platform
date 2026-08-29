import { test, expect } from "@playwright/test";

const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const frontend = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const program = "data-center-specialization-11";
const course = "data-center-technical-operations-12";
const learnerId = "user_assignment_technical_001";
const learner = `Bearer dev-token:${learnerId}`;
const admin = "Bearer dev-token:user_admin_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const operator = "Bearer dev-token:user_operator_001";
const headers = (token, extra = {}) => ({ Authorization: token, "Content-Type": "application/json", ...extra });
const shared = [
  "data-center-specialization-11-safety-professional-practice",
  "data-center-specialization-11-technical-communication",
  "data-center-specialization-11-reliability-systems-thinking",
  "data-center-specialization-11-evidence-and-feedback",
  "data-center-specialization-11-career-transition-planning",
];
const branch = [
  "data-center-specialization-11-monitoring-proof",
  "data-center-specialization-11-linux-inspection",
  "data-center-specialization-11-telemetry-troubleshooting",
];
const grade12Lessons = [
  "data-center-specialization-12-advanced-technical-communication",
  "data-center-specialization-12-change-risk-escalation",
  "data-center-specialization-12-cross-team-collaboration",
  "data-center-specialization-12-evidence-quality-defense",
  "data-center-specialization-12-career-postsecondary-transition",
  "data-center-specialization-12-advanced-operations-service-dependencies",
  "data-center-specialization-12-linux-system-state-analysis",
  "data-center-specialization-12-controlled-change-deployment",
  "data-center-specialization-12-capacity-reliability-operations",
  "data-center-specialization-12-multi-system-incident-coordination",
  "data-center-specialization-12-runbooks-operational-handoffs",
  "data-center-specialization-12-advanced-technical-operations-project",
];

async function call(page, method, path, token, data, expected = 200, extra = {}) {
  const response = await page.request[method](`${api}${path}`, { headers: headers(token, extra), data });
  const body = await response.text();
  expect(response.status(), `${method} ${path}: ${body}`).toBe(expected);
  return body ? JSON.parse(body).data : undefined;
}

async function complete(page, token, lessonId, curriculum = program, expected = 200) {
  return call(page, "post", `/curriculum/lessons/${lessonId}/complete`, token, { curriculum }, expected);
}

async function proof(page, token, activityId, expectedStatus = 201) {
  const result = await call(page, "post", "/prepare-prove/activity-results", token, {
    result: { activity_id: activityId, observations: ["Synthetic operational evidence was reviewed."], uncertainty: "The scenario does not confirm root cause.", safe_next_step: "Document the observation and escalate through an authorized process." },
  }, expectedStatus);
  if (expectedStatus !== 201) return result;
  return call(page, "post", "/prepare-prove/evidence", token, { source_result_id: result.result_id, criterion: "phase31-runtime-proof" }, 201).then((evidence) => ({ result, evidence }));
}

test("Phase 31 proves the Grade 12 runtime foundation through browser, API, and project boundaries", {
  skip: api && frontend ? false : "disposable stack URLs required",
  timeout: 240_000,
}, async ({ page, browser }) => {
  // Establish Grade 12 eligibility from the same persisted completion, result,
  // evidence, and reviewed competency records used by production routes.
  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: learnerId, program_id: program, specialization_id: "technical-operations", grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
  for (const lessonId of [...shared, ...branch]) await complete(page, learner, lessonId);
  for (const activityId of ["grade11-technical-operations-monitoring-proof", "grade11-technical-operations-linux-inspection", "grade11-technical-operations-troubleshooting-documentation"]) {
    const item = await proof(page, learner, activityId);
    await call(page, "post", `/prepare-prove/evidence/${item.evidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" }, 200);
  }
  const eligibility = await call(page, "get", `/programs/${program}/grade12-eligibility`, learner);
  expect(eligibility.status).toBe("ELIGIBLE");
  expect(eligibility.policy_version).toBe("grade12-entry-v1");

  const ineligibleAssignment = await page.request.post(`${api}/program-course-assignments`, { headers: headers(admin), data: { learner_id: "user_no_assignment_001", program_id: program, course_id: course, specialization_id: "technical-operations" } });
  expect(ineligibleAssignment.status()).toBe(400);
  const assigned = await call(page, "post", "/program-course-assignments", admin, { learner_id: learnerId, program_id: program, course_id: course, specialization_id: "technical-operations" }, 201);
  const repeated = await call(page, "post", "/program-course-assignments", admin, { learner_id: learnerId, program_id: program, course_id: course, specialization_id: "technical-operations" }, 201);
  expect(repeated.assignment_id).toBe(assigned.assignment_id);
  expect((await page.request.post(`${api}/program-course-assignments`, { headers: headers(learner), data: { learner_id: learnerId, program_id: program, course_id: course, specialization_id: "technical-operations" } })).status()).toBe(403);
  expect((await page.request.post(`${api}/program-course-assignments`, { headers: headers(operator), data: { learner_id: learnerId, program_id: program, course_id: course, specialization_id: "technical-operations" } })).status()).toBe(403);

  // Common core and the Technical Operations branch are exercised through the
  // actual lesson route and its server-backed completion control.
  await page.setExtraHTTPHeaders(headers(learner));
  for (const lessonId of grade12Lessons) {
    await page.goto(`${frontend}/curriculum.html#/curriculum/lessons/${lessonId}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const completion = page.waitForResponse((response) => response.url().includes(`/curriculum/lessons/${lessonId}/complete`) && response.request().method() === "POST");
    await page.getByRole("button", { name: "Mark Lesson Complete" }).click();
    expect((await completion).status()).toBe(200);
    await expect(page.getByRole("button", { name: /Lesson Complete/ })).toBeVisible();
  }

  // The final lesson provides the real browser result/evidence entry point.
  await page.goto(`${frontend}/curriculum.html#/curriculum/lessons/data-center-specialization-12-advanced-technical-operations-project`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Apply" }).click();
  await page.getByLabel("Observations (one fact per line)").fill("The service alert and storage pressure are both present.");
  await page.getByLabel("Affected system hypothesis").fill("Synthetic service dependency");
  await page.getByLabel("What remains uncertain?").fill("The evidence does not establish a single root cause.");
  await page.getByLabel("Safe next step or escalation").fill("Record the evidence and escalate within the approved sandbox process.");
  await page.getByRole("button", { name: "Submit evidence for review" }).click();
  await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("pending review", { timeout: 10_000 });
  const status = await call(page, "get", "/prepare-prove/proof-status?activity_id=grade12-technical-operations-multi-system-operations-analysis", learner);
  expect(status.decision).toBeNull();
  const evidenceId = status.evidence.evidence_id;
  await page.setExtraHTTPHeaders(headers(reviewer));
  await page.goto(`${frontend}/curriculum.html#/curriculum/instructor/prove/${evidenceId}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("prepare-prove-review")).toBeVisible();
  await page.getByRole("button", { name: "Record demonstrated" }).click();
  await expect(page.getByTestId("prepare-prove-review").getByRole("status")).toContainText("DEMONSTRATED", { timeout: 10_000 });
  const repeatedReview = await page.request.post(`${api}/prepare-prove/evidence/${evidenceId}/review`, { headers: headers(reviewer), data: { decision: "DEMONSTRATED" } });
  expect(repeatedReview.status()).toBe(200);
  const repeatedDecision = (await repeatedReview.json()).data.decision_id;
  const currentStatus = await page.request.get(`${api}/prepare-prove/proof-status?activity_id=grade12-technical-operations-multi-system-operations-analysis`, { headers: headers(learner) });
  expect(currentStatus.status()).toBe(200);
  expect((await currentStatus.json()).data.decision.decision_id).toBe(repeatedDecision);

  // One insufficient decision followed by a new result/evidence/review keeps
  // history and proves the generic reassessment path still works in Grade 12.
  const insufficient = await proof(page, learner, "grade12-technical-operations-change-incident-coordination");
  await call(page, "post", `/prepare-prove/evidence/${insufficient.evidence.evidence_id}/review`, reviewer, { decision: "EVIDENCE_INSUFFICIENT" }, 200);
  const reassessed = await proof(page, learner, "grade12-technical-operations-change-incident-coordination-reassessment");
  await call(page, "post", `/prepare-prove/evidence/${reassessed.evidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" }, 200);

  // Generic Project/team/submission proof remains separate from individual proof.
  const project = await call(page, "post", "/projects", admin, { program_id: program, course_id: course, title: "Grade 12 runtime foundation proof", project_type: "GRADE12_PROJECT_INFRASTRUCTURE_PROOF_ONLY" }, 201);
  const team = await call(page, "post", `/projects/${project.project_id}/teams`, admin, { mode: "COLLABORATIVE_MODE" }, 201);
  for (const [id, specialization] of [[learnerId, "technical-operations"], ["user_assignment_networking_001", "networking-fiber"], ["user_assignment_ai_001", "ai-cloud-infrastructure"]]) {
    await call(page, "post", `/program-specialization-assignments`, admin, { learner_id: id, program_id: program, specialization_id: specialization, grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
    const member = await call(page, "post", `/project-teams/${team.team_id}/members`, admin, { learner_id: id, specialization_id: specialization }, 201);
    expect(member.role_id).toBe({ "technical-operations": "Operations", "networking-fiber": "Networking", "ai-cloud-infrastructure": "Compute/AI Infrastructure" }[specialization]);
  }
  const individual = await call(page, "post", `/projects/${project.project_id}/teams`, admin, { mode: "INDIVIDUAL_INTEGRATED_MODE" }, 201);
  await call(page, "post", `/project-teams/${individual.team_id}/members`, admin, { learner_id: learnerId, specialization_id: "technical-operations" }, 201);
  const v1 = await call(page, "post", `/project-teams/${team.team_id}/submissions`, learner, { payload: { versionNote: "initial" }, artifact_refs: ["synthetic://v1"] }, 201);
  const v2 = await call(page, "post", `/project-teams/${team.team_id}/submissions`, learner, { payload: { versionNote: "revised" }, artifact_refs: ["synthetic://v2"] }, 201);
  expect(v1.version).toBe(1); expect(v2.version).toBe(2);
  const submissions = await call(page, "get", `/projects/${project.project_id}/submissions`, admin);
  expect(submissions.map((item) => item.version)).toEqual([1, 2]);
  await call(page, "post", `/project-submissions/${v1.submission_id}/review`, admin, { status: "NEEDS_REVISION" }, 200);
  await call(page, "post", `/project-submissions/${v2.submission_id}/review`, admin, { status: "ACCEPTED" }, 200);
  const deniedMember = await page.request.post(`${api}/project-teams/${team.team_id}/members`, { headers: headers(operator), data: { learner_id: learnerId, specialization_id: "technical-operations" } });
  expect(deniedMember.status()).toBe(403);

  const gate = await call(page, "get", `/programs/${program}/grade12-entry`, learner);
  expect(gate.gate).toBe("OPEN_PLACEHOLDER_ONLY");
  await page.setExtraHTTPHeaders(headers(learner));
  await page.goto(`${frontend}/curriculum.html#/curriculum/grade12-entry?eligible=false`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Grade 12 entry verified" })).toBeVisible();
  await expect(page.getByText(/integrated capstone is not yet active/)).toBeVisible();
});
