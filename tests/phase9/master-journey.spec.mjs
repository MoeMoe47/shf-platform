import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const fixture = JSON.parse(readFileSync(process.env.SHS_PHASE8_FIXTURE_MANIFEST, "utf8"));

const auth = (userId) => `Bearer dev-token:${userId}`;

async function actorPage(browser, userId, path) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(({ id }) => {
    window.__user = { role: "student", email: `${id}@phase8.test`, name: id };
  }, { id: userId });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) {
      await route.continue({ headers: { ...request.headers(), authorization: auth(userId) } });
      return;
    }
    await route.continue();
  });
  if (path) await page.goto(`${frontend}/curriculum.html#${path}`, { waitUntil: "domcontentloaded" });
  return page;
}

async function browserApi(page, userId, path, { method = "GET", body } = {}) {
  return page.evaluate(async ({ base, path, method, body, authorization }) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { authorization, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let parsed = {};
    try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { raw: text }; }
    return { status: response.status, body: parsed, data: parsed.data };
  }, { base: api, path, method, body, authorization: auth(userId) });
}

async function expectPage(page, heading) {
  await expect(page.locator("body")).toContainText(heading);
}

test.describe.configure({ mode: "serial" });

test("student completes canonical learning journey end to end", async ({ browser }) => {
  const learner = await actorPage(browser, fixture.learnerA1, "/curriculum/asl/dashboard");
  await expectPage(learner, "Assignment A");
  const dashboardCourses = await browserApi(learner, fixture.learnerA1, "/curriculum/learning/courses");
  expect(dashboardCourses.status).toBe(200);
  expect(dashboardCourses.data.items.some((item) => item.course?.stableKey === "phase9-course-a" || item.stableKey === "phase9-course-a")).toBe(true);

  await learner.goto(`${frontend}/curriculum.html#/curriculum/learning`, { waitUntil: "domcontentloaded" });
  await expectPage(learner, "Course A");
  await learner.goto(`${frontend}/curriculum.html#/curriculum/courses/phase9-course-a`, { waitUntil: "domcontentloaded" });
  await expectPage(learner, "Course A");
  for (const tab of ["Lessons", "Assignments", "Live", "Resources", "Progress"]) {
    await learner.getByRole("tab", { name: tab }).click();
    await expect(learner.locator("body")).not.toContainText("This course isn't available");
  }

  // The catalog route is the canonical course/release view. The existing
  // student lesson renderer is static-content based, so activity transitions
  // are exercised through the same browser session against the canonical
  // release-scoped APIs while the lesson route supplies the visible journey.
  await learner.goto(`${frontend}/curriculum.html#/curriculum/lessons/student.asl-1-capstone`, { waitUntil: "domcontentloaded" });
  await expectPage(learner, "Cumulative Quiz");

  const activity = await browserApi(learner, fixture.learnerA1, `/activity-domains/assignments/${fixture.assignmentA}/lessons/unit-a/lesson-a`);
  expect(activity.status).toBe(200);
  expect(activity.data.assessment.assessmentDefinitionId).toBe(fixture.assessment);
  expect(activity.data.practice.practiceDefinitionId).toBe(fixture.practice);
  expect(activity.data.reflection.reflectionDefinitionId).toBe(fixture.reflection);

  const practice = await browserApi(learner, fixture.learnerA1, "/activity-domains/practices/submissions", {
    method: "POST", body: { assignmentId: fixture.assignmentA, unitStableKey: "unit-a", lessonStableKey: "lesson-a", actions: [{ itemId: "practice-item-a", value: "Observe and escalate safely." }], idempotencyKey: "phase9-master-practice" },
  });
  expect(practice.status).toBe(201);
  expect(practice.data.completed).toBe(true);

  const attempt = await browserApi(learner, fixture.learnerA1, "/arcade/attempts", { method: "POST", body: { activityId: fixture.arcadeActivity } });
  expect(attempt.status).toBe(201);
  const arcade = await browserApi(learner, fixture.learnerA1, `/arcade/attempts/${attempt.data.id}/result`, { method: "POST", body: { passed: true } });
  expect(arcade.status).toBe(201);
  expect(arcade.data.masteryAchieved).toBe(true);

  const project = await browserApi(learner, fixture.learnerA1, `/project-teams/${fixture.projectTeam}/submissions`, {
    method: "POST", body: { payload: { title: "Safe finding", summary: "Record evidence and escalate." }, artifact_refs: [] },
  });
  expect(project.status).toBe(201);
  expect(project.data.status).toBe("SUBMITTED");
  const submissionId = project.data.submission_id || project.data.submissionId;

  const instructor = await actorPage(browser, fixture.authorizedInstructorA, `/curriculum/instructor/operations/reviews/project/${submissionId}`);
  await expectPage(instructor, "Project");
  const reviewedProject = await browserApi(instructor, fixture.authorizedInstructorA, `/project-submissions/${submissionId}/review`, { method: "POST", body: { status: "ACCEPTED" } });
  expect(reviewedProject.status).toBe(200);
  expect(reviewedProject.data.status).toBe("ACCEPTED");

  const assessment = await browserApi(learner, fixture.learnerA1, "/activity-domains/assessments/submissions", {
    method: "POST", body: { assignmentId: fixture.assignmentA, unitStableKey: "unit-a", lessonStableKey: "lesson-a", answers: [{ itemId: "assessment-item-a", choiceIndex: 0 }], idempotencyKey: "phase9-master-assessment" },
  });
  expect(assessment.status).toBe(201);
  expect(assessment.data.passed).toBe(true);

  const reflection = await browserApi(learner, fixture.learnerA1, "/activity-domains/reflections/submissions", {
    method: "POST", body: { assignmentId: fixture.assignmentA, unitStableKey: "unit-a", lessonStableKey: "lesson-a", responses: [{ itemId: "reflection-item-a", text: "I recorded what was known and escalated uncertainty." }], idempotencyKey: "phase9-master-reflection" },
  });
  expect(reflection.status).toBe(201);

  const session = await browserApi(learner, fixture.learnerA1, `/live-learning/sessions/${fixture.liveSession}`);
  expect(session.status).toBe(200);
  expect(session.data.id).toBe(fixture.liveSession);
  const attendance = await browserApi(instructor, fixture.authorizedInstructorA, `/live-learning/join-events/${fixture.joinEvent}/confirm-attendance`, { method: "POST", body: {} });
  expect(attendance.status).toBe(200);

  const verification = await browserApi(instructor, fixture.authorizedInstructorA, `/prepare-prove/evidence/${fixture.verification}/review`, { method: "POST", body: { decision: "DEMONSTRATED" } });
  expect(verification.status).toBe(200);
  expect(verification.data.decision).toBe("DEMONSTRATED");

  const beforeCompletion = await browserApi(learner, fixture.learnerA1, `/assignments/${fixture.assignmentA}/check-completion`, { method: "POST", body: { unitStableKey: "unit-a", lessonStableKey: "lesson-a" } });
  expect(beforeCompletion.status).toBe(200);
  expect(beforeCompletion.data.complete).toBe(true);
  expect(beforeCompletion.data.requirements.every((item) => item.status === "SATISFIED")).toBe(true);
  expect(beforeCompletion.data.completion).toBeTruthy();

  await learner.reload({ waitUntil: "domcontentloaded" });
  const course = await browserApi(learner, fixture.learnerA1, "/curriculum/learning/courses/phase9-course-a");
  expect(course.status).toBe(200);
  expect(course.data.units[0].lessons[0].lessonStableKey).toBe("lesson-a");
  expect(course.data.units[0].lessons[1].lessonStableKey).toBe("lesson-b");
  expect(course.data.nextLesson.lessonStableKey).toBe("lesson-b");
  await learner.goto(`${frontend}/curriculum.html#/curriculum/courses/phase9-course-a/lessons`, { waitUntil: "domcontentloaded" });
  await expectPage(learner, "Lesson A");
  await expectPage(learner, "Lesson B");

  for (const path of ["/curriculum/asl/assignments", "/curriculum/asl/calendar", "/curriculum/live-sessions", "/curriculum/asl/portfolio"]) {
    await learner.goto(`${frontend}/curriculum.html#${path}`, { waitUntil: "domcontentloaded" });
    await expect(learner.locator("body")).not.toContainText("Something went wrong");
  }
  const career = await browserApi(learner, fixture.learnerA1, "/careers/pathway/me");
  expect([200, 404]).toContain(career.status);

  const staffLearner = await browserApi(instructor, fixture.authorizedInstructorA, `/operations/learners/${fixture.learnerA1}`);
  expect(staffLearner.status).toBe(200);
  expect(JSON.stringify(staffLearner.data)).toContain(fixture.assignmentA);
  const report = await browserApi(instructor, fixture.authorizedInstructorA, "/shf/reports/curriculum.learning-progress");
  expect([200, 404, 503]).toContain(report.status);
  if (report.status === 200) expect(report.data.metric_results || report.data.report?.metric_results).toBeTruthy();

  const assignmentA = await browserApi(learner, fixture.learnerA1, `/assignments/${fixture.assignmentA}`);
  const assignmentB = await browserApi(learner, fixture.learnerA1, `/assignments/${fixture.assignmentB}`);
  expect(assignmentA.status).toBe(200);
  expect(assignmentA.data.curriculumRelease.releaseId).toBe(fixture.release1);
  expect([200, 404]).toContain(assignmentB.status);
  await instructor.close();
  await learner.close();
});
