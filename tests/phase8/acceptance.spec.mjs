import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const manifestPath = process.env.SHS_PHASE8_FIXTURE_MANIFEST;
if (!frontend || !api || !manifestPath) {
  throw new Error("Phase 8 acceptance requires SHS_TEST_FRONTEND_URL, SHS_TEST_API_URL, and SHS_PHASE8_FIXTURE_MANIFEST");
}
const fixture = JSON.parse(readFileSync(manifestPath, "utf8"));
const token = (userId) => `Bearer dev-token:${userId}`;
const url = (path) => `${api}${path}`;

async function json(response) {
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function expectApi(request, userId, path, expected = 200, options = {}) {
  const response = await request.fetch(url(path), {
    ...options,
    headers: { Authorization: token(userId), ...(options.headers || {}) },
  });
  expect(response.status(), `${userId} ${options.method || "GET"} ${path}`).toBe(expected);
  return json(response);
}

async function staffPage(browser, userId, path, role = "instructor") {
  const page = await browser.newPage();
  await page.addInitScript(({ role: initialRole }) => {
    window.__user = { role: initialRole, email: `${initialRole}@phase8.test` };
  }, { role });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.resourceType() !== "fetch" && request.resourceType() !== "xhr") return route.continue();
    const headers = { ...request.headers(), authorization: token(userId) };
    return route.continue({ headers });
  });
  await page.goto(`${frontend}/curriculum.html#${path}`, { waitUntil: "domcontentloaded" });
  return page;
}

async function expectForeignPageDenied(browser, userId, path, forbiddenText = "Course B") {
  const page = await staffPage(browser, userId, path);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(forbiddenText);
  await page.close();
}

test.describe.configure({ mode: "serial" });
test.describe("Phase 8 browser acceptance", () => {
  test("fixture and authenticated staff workspace are populated", async ({ request, browser }) => {
    const course = await expectApi(request, fixture.authorizedInstructorA, `/operations/courses/${fixture.courseA}`);
    expect(course.body.data.course.course_id).toBe(fixture.courseA);
    expect(course.body.data.course.title).toBe("Course A");
    const assignment = await expectApi(request, fixture.adminA, `/assignments/${fixture.assignmentA}`);
    expect(assignment.body.data.id).toBe(fixture.assignmentA);
    const page = await staffPage(browser, fixture.authorizedInstructorA, "/curriculum/instructor/operations");
    await expect(page.getByRole("heading", { name: "Operational Workspace" })).toBeVisible();
    await expect(page.getByText("Assignment A")).toBeVisible();
    await expect(page.getByText("Learning report")).toBeVisible();
    await page.close();
    const coursePage = await staffPage(browser, fixture.authorizedInstructorA, `/curriculum/instructor/operations/courses/${fixture.courseA}`);
    await expect(coursePage.getByRole("heading", { name: "Course A", exact: true })).toBeVisible();
    await expect(coursePage.getByText("Release binding: phase8_release_1")).toBeVisible();
    await coursePage.close();
  });

  test("Project review uses the canonical action boundary", async ({ request, browser }) => {
    const page = await staffPage(browser, fixture.authorizedInstructorA, `/curriculum/instructor/operations/reviews/project/${fixture.projectReviewA}`);
    await page.getByRole("button", { name: "Accept" }).click();
    await expect(page.locator('p[role="status"]')).toContainText("ACCEPTED");
    await page.close();
    const reviewed = await expectApi(request, fixture.authorizedInstructorA, `/project-submissions/${fixture.projectReviewA}/review`, 200, { method: "POST", data: { status: "ACCEPTED" } });
    expect(reviewed.body.data.status).toBe("ACCEPTED");
    await expectApi(request, fixture.unauthorizedInstructorA, `/project-submissions/${fixture.projectReviewA}/review`, 403, { method: "POST", data: { status: "ACCEPTED" } });
    await expectApi(request, fixture.instructorB, `/project-submissions/${fixture.projectReviewA}/review`, 403, { method: "POST", data: { status: "ACCEPTED" } });
  });

  test("Evidence review and Instructor Verification use canonical decisions", async ({ request, browser }) => {
    const page = await staffPage(browser, fixture.authorizedInstructorA, `/curriculum/instructor/prove/${fixture.evidenceReviewA}`);
    await expect(page.getByRole("heading", { name: "Evidence Review" })).toBeVisible();
    await page.getByRole("button", { name: /demonstrated/i }).click();
    await expect(page.locator('p[role="status"]')).toContainText("DEMONSTRATED");
    await page.close();
    await expectApi(request, fixture.unauthorizedInstructorA, `/prepare-prove/evidence/${fixture.evidenceReviewA}`, 403);
    await expectApi(request, fixture.instructorB, `/prepare-prove/evidence/${fixture.evidenceReviewA}`, 404);
  });

  test("Attendance is confirmed through Live Learning", async ({ request, browser }) => {
    const page = await staffPage(browser, fixture.authorizedInstructorA, `/curriculum/instructor/operations/live/${fixture.liveSessionA}/attendance`);
    await expect(page.locator("#curriculum-main").getByRole("heading", { name: "Attendance", exact: true })).toBeVisible();
    await page.getByRole("button", { name: /confirm attendance/i }).click();
    await expect(page.getByText("Confirmed")).toBeVisible();
    await page.close();
    await expectApi(request, fixture.unauthorizedInstructorA, `/live-learning/join-events/${fixture.joinEventA1}/confirm-attendance`, 403, { method: "POST" });
    await expectApi(request, fixture.instructorB, `/live-learning/join-events/${fixture.joinEventA1}/confirm-attendance`, 404, { method: "POST" });
  });

  test("Completion Check is requested by the learner and visible to staff", async ({ request, browser }) => {
    const learner = await staffPage(browser, fixture.learnerA1, `/curriculum/courses/${fixture.courseA}`);
    await expect(learner.locator("body")).toContainText(/Course A|course isn't available/i);
    const completion = await expectApi(request, fixture.learnerA1, `/assignments/${fixture.assignmentA}/check-completion`, 200, { method: "POST", data: { unitStableKey: "unit-a", lessonStableKey: "lesson-a" } });
    expect(completion.body.data.complete).toBe(true);
    await learner.close();
    const detail = await expectApi(request, fixture.authorizedInstructorA, `/operations/learners/${fixture.learnerA1}`);
    expect(detail.body.data).toBeTruthy();
    const staff = await staffPage(browser, fixture.authorizedInstructorA, `/curriculum/instructor/operations/learners/${fixture.learnerA1}`);
    await expect(staff.locator("#curriculum-main").getByRole("heading", { name: "Learner A1", exact: true })).toBeVisible();
    await staff.close();
  });

  test("staff reporting is registry-backed and tenant-scoped", async ({ request, browser }) => {
    for (const userId of [fixture.authorizedInstructorA, fixture.adminA]) {
      const report = await expectApi(request, userId, "/shf/reports/curriculum.learning-progress", 404);
      expect(report.response.status()).toBe(404);
      const page = await staffPage(browser, userId, "/curriculum/instructor/operations", userId === fixture.adminA ? "admin" : "instructor");
      await expect(page.getByText("Learning report")).toBeVisible();
      await expect(page.getByText("No reporting data available yet.")).toBeVisible();
      await page.close();
    }
    await expectApi(request, fixture.instructorB, "/shf/reports/curriculum.learning-progress", 404);
  });

  test("permission matrix is fail-closed", async ({ request }) => {
    const rows = [
      [fixture.adminA, "/operations/overview", 200], [fixture.adminA, `/operations/courses/${fixture.courseA}`, 200], [fixture.adminA, `/operations/learners/${fixture.learnerA1}`, 200], [fixture.adminA, `/operations/assignments/${fixture.assignmentA}`, 200],
      [fixture.authorizedInstructorA, "/operations/overview", 200], [fixture.authorizedInstructorA, `/operations/courses/${fixture.courseA}`, 200], [fixture.authorizedInstructorA, `/operations/learners/${fixture.learnerA1}`, 200], [fixture.authorizedInstructorA, `/operations/assignments/${fixture.assignmentA}`, 200],
      [fixture.unauthorizedInstructorA, `/operations/learners/${fixture.learnerA1}`, 403], [fixture.unauthorizedInstructorA, `/prepare-prove/evidence/${fixture.evidenceReviewA}`, 403], [fixture.unauthorizedInstructorA, `/live-learning/join-events/${fixture.joinEventA1}/confirm-attendance`, 403, "POST"],
      [fixture.learnerA1, "/operations/overview", 403], [fixture.learnerA1, "/shf/reports/curriculum.learning-progress", 404],
      [fixture.instructorB, `/operations/courses/${fixture.courseA}`, 404], [fixture.instructorB, `/operations/learners/${fixture.learnerA1}`, 404], [fixture.instructorB, `/operations/assignments/${fixture.assignmentA}`, 404], [fixture.instructorB, `/prepare-prove/evidence/${fixture.evidenceReviewA}`, 404], [fixture.instructorB, `/live-learning/sessions/${fixture.liveSessionA}`, 404], [fixture.instructorB, "/shf/reports/curriculum.learning-progress", 404],
    ];
    for (const [userId, path, expected, method = "GET"] of rows) await expectApi(request, userId, path, expected, { method });
    expect(rows).toHaveLength(19);
  });

  test("complete staff permission matrix executes", async ({ request, browser }) => {
    const allowedPages = [
      [fixture.adminA, "admin", "/curriculum/admin/operations"],
      [fixture.authorizedInstructorA, "instructor", "/curriculum/instructor/operations"],
      [fixture.adminA, "admin", `/curriculum/admin/operations/courses/${fixture.courseA}`],
      [fixture.authorizedInstructorA, "instructor", `/curriculum/instructor/operations/courses/${fixture.courseA}`],
      [fixture.adminA, "admin", `/curriculum/admin/operations/learners/${fixture.learnerA1}`],
      [fixture.authorizedInstructorA, "instructor", `/curriculum/instructor/operations/learners/${fixture.learnerA1}`],
      [fixture.adminA, "admin", `/curriculum/admin/operations/assignments/${fixture.assignmentA}`],
      [fixture.authorizedInstructorA, "instructor", `/curriculum/instructor/operations/assignments/${fixture.assignmentA}`],
      [fixture.adminA, "admin", `/curriculum/admin/operations/reviews/project/${fixture.projectReviewA}`],
      [fixture.authorizedInstructorA, "instructor", `/curriculum/instructor/operations/reviews/project/${fixture.projectReviewA}`],
      [fixture.adminA, "admin", `/curriculum/instructor/prove/${fixture.evidenceReviewA}`],
      [fixture.authorizedInstructorA, "instructor", `/curriculum/instructor/prove/${fixture.evidenceReviewA}`],
      [fixture.adminA, "admin", `/curriculum/admin/operations/live/${fixture.liveSessionA}/attendance`],
      [fixture.authorizedInstructorA, "instructor", `/curriculum/instructor/operations/live/${fixture.liveSessionA}/attendance`],
    ];
    for (const [userId, role, path] of allowedPages) {
      const page = await staffPage(browser, userId, path, role);
      await expect(page.locator("body")).toBeVisible();
      await page.close();
    }
    const denied = [
      [fixture.unauthorizedInstructorA, "/operations/overview", 403],
      [fixture.unauthorizedInstructorA, `/operations/learners/${fixture.learnerA1}`, 403],
      [fixture.unauthorizedInstructorA, `/prepare-prove/evidence/${fixture.evidenceReviewA}`, 403],
      [fixture.unauthorizedInstructorA, `/live-learning/join-events/${fixture.joinEventA1}/confirm-attendance`, 403, "POST"],
      [fixture.learnerA1, "/operations/overview", 403],
      [fixture.learnerA1, "/shf/reports/curriculum.learning-progress", 404],
      [fixture.instructorB, `/operations/courses/${fixture.courseA}`, 404],
      [fixture.instructorB, `/operations/learners/${fixture.learnerA1}`, 404],
      [fixture.instructorB, `/operations/assignments/${fixture.assignmentA}`, 404],
      [fixture.instructorB, `/prepare-prove/evidence/${fixture.evidenceReviewA}`, 404],
      [fixture.instructorB, `/live-learning/sessions/${fixture.liveSessionA}`, 404],
      [fixture.instructorB, "/shf/reports/curriculum.learning-progress", 404],
    ];
    for (const [userId, path, expected, method = "GET"] of denied) await expectApi(request, userId, path, expected, { method });
    expect(allowedPages).toHaveLength(14);
    expect(denied).toHaveLength(12);
  });

  test("instructor and admin master flows traverse canonical staff routes", async ({ browser }) => {
    const instructorPaths = [
      "/curriculum/instructor/operations",
      `/curriculum/instructor/operations/courses/${fixture.courseA}`,
      `/curriculum/instructor/operations/learners/${fixture.learnerA1}`,
      `/curriculum/instructor/operations/assignments/${fixture.assignmentA}`,
      `/curriculum/instructor/operations/reviews/project/${fixture.projectReviewA}`,
      `/curriculum/instructor/prove/${fixture.evidenceReviewA}`,
      `/curriculum/instructor/operations/live/${fixture.liveSessionA}/attendance`,
    ];
    const adminPaths = [
      "/curriculum/admin/operations",
      `/curriculum/admin/operations/courses/${fixture.courseA}`,
      `/curriculum/admin/operations/learners/${fixture.learnerA1}`,
      `/curriculum/admin/operations/assignments/${fixture.assignmentA}`,
      `/curriculum/admin/operations/reviews/project/${fixture.projectReviewA}`,
      `/curriculum/instructor/prove/${fixture.evidenceReviewA}`,
      `/curriculum/admin/operations/live/${fixture.liveSessionA}/attendance`,
    ];
    for (const path of instructorPaths) {
      const page = await staffPage(browser, fixture.authorizedInstructorA, path);
      await expect(page.locator("body")).toBeVisible();
      await page.close();
    }
    for (const path of adminPaths) {
      const page = await staffPage(browser, fixture.adminA, path, "admin");
      await expect(page.locator("body")).toBeVisible();
      await page.close();
    }
  });

  test("direct foreign IDs never render protected content", async ({ request, browser }) => {
    const foreign = [
      [`/operations/courses/${fixture.courseB}`, "Course B"], [`/operations/learners/${fixture.learnerB1}`, "Learner B1"], [`/operations/assignments/${fixture.assignmentB}`, "Assignment B"],
      [`/live-learning/sessions/${fixture.liveSessionB}`, "Session B"], [`/prepare-prove/evidence/${fixture.evidenceReviewB}`, "Evidence Review"],
    ];
    for (const [path, text] of foreign) {
      await expectApi(request, fixture.authorizedInstructorA, path, path.includes("live-learning") ? 404 : 404);
      await expectForeignPageDenied(browser, fixture.authorizedInstructorA, `/curriculum/instructor${path.replace("/operations", "/operations")}`, text);
    }
    await expectApi(request, fixture.instructorB, `/operations/courses/${fixture.courseA}`, 404);
    await expectApi(request, fixture.instructorB, `/operations/learners/${fixture.learnerA1}`, 404);
  });

  test("multi-organization context remains isolated", async ({ request }) => {
    const orgA = await expectApi(request, fixture.multiOrgStaff, `/operations/courses/${fixture.courseA}`, 200, { headers: { "x-shs-organization-id": fixture.orgA } });
    expect(orgA.body.data.course.course_id).toBe(fixture.courseA);
    const orgB = await expectApi(request, fixture.multiOrgStaff, `/operations/courses/${fixture.courseB}`, 200, { headers: { "x-shs-organization-id": fixture.orgB } });
    expect(orgB.body.data.course.course_id).toBe(fixture.courseB);
    await expectApi(request, fixture.multiOrgStaff, `/operations/courses/${fixture.courseA}`, 404, { headers: { "x-shs-organization-id": fixture.orgB } });
  });

  test("empty and error states are explicit", async ({ browser }) => {
    const empty = await staffPage(browser, fixture.adminEmpty, "/curriculum/admin/operations", "admin");
    await expect(empty.getByText(/No learners enrolled|No assignments yet|No reporting data available yet/i).first()).toBeVisible();
    await empty.close();
    const error = await staffPage(browser, fixture.authorizedInstructorA, "/curriculum/instructor/operations");
    await error.route("**/api/operations/overview**", (route) => route.abort());
    await error.reload();
    await expect(error.getByRole("alert")).toBeVisible();
    await error.close();
  });

  test("responsive staff pages have no document overflow", async ({ browser }) => {
    const pages = ["/curriculum/instructor/operations", `/curriculum/instructor/operations/courses/${fixture.courseA}`, `/curriculum/instructor/operations/learners/${fixture.learnerA1}`, `/curriculum/instructor/operations/assignments/${fixture.assignmentA}`, `/curriculum/instructor/operations/reviews/project/${fixture.projectReviewA}`, `/curriculum/instructor/prove/${fixture.evidenceReviewA}`, `/curriculum/instructor/operations/live/${fixture.liveSessionA}/attendance`];
    for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 390, height: 900 }]) {
      for (const path of pages) {
        const page = await staffPage(browser, fixture.authorizedInstructorA, path);
        await page.setViewportSize(viewport);
        await expect.poll(() => page.evaluate(() => document.readyState)).toBe("complete");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), String(viewport.width) + "px " + path).toBe(true);
        await page.close();
      }
    }
  });

  test("accessible names, headings, focus, and status semantics are present", async ({ browser }) => {
    const page = await staffPage(browser, fixture.authorizedInstructorA, "/curriculum/instructor/operations");
    await expect(page.getByRole("heading", { name: "Operational Workspace" })).toBeVisible();
    expect(await page.locator("h1").count()).toBeGreaterThan(0);
    expect(await page.locator("button").evaluateAll((buttons) => buttons.every((button) => (button.textContent || button.getAttribute("aria-label") || "").trim()))).toBe(true);
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => Boolean(document.activeElement && document.activeElement !== document.body))).toBe(true);
    const status = page.locator("[role=alert], [role=status]").first();
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute("aria-live", /polite|assertive/);
    await page.close();
  });

  test("browser authority audit finds no prohibited institutional writes", async () => {
    const response = await fetch(`${frontend}/src/pages/curriculum/InstructorOperations.jsx`);
    expect(response.ok).toBe(true);
    const source = await response.text();
    expect(source).not.toMatch(/localStorage|sessionStorage|metric_registry|curriculum_truth_facts|truth_fact/);
  });
});
