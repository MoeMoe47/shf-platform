import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const manifestPath = process.env.SHS_PHASE8_FIXTURE_MANIFEST;
if (!frontend || !api || !manifestPath) {
  throw new Error("Phase 9 acceptance requires the disposable Phase 8 environment variables.");
}

const fixture = JSON.parse(readFileSync(manifestPath, "utf8"));
const token = (userId) => `Bearer dev-token:${userId}`;
const apiUrl = (path) => `${api}${path}`;

async function apiJson(request, userId, path, options = {}) {
  const response = await request.fetch(apiUrl(path), {
    ...options,
    headers: { Authorization: token(userId), ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.ok(), `${userId} ${options.method || "GET"} ${path}: ${JSON.stringify(body)}`).toBe(true);
  return body?.data ?? body;
}

async function studentPage(browser, userId, path) {
  const page = await browser.newPage();
  await page.addInitScript(({ id }) => {
    window.__user = { role: "student", email: `${id}@phase8.test`, name: id };
  }, { id: userId });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.resourceType() !== "fetch" && request.resourceType() !== "xhr") return route.continue();
    return route.continue({ headers: { ...request.headers(), authorization: token(userId) } });
  });
  await page.goto(`${frontend}/curriculum.html#${path}`, { waitUntil: "domcontentloaded" });
  return page;
}

test.describe.configure({ mode: "serial" });
test.describe("Phase 9 student reconciliation", () => {
  test("one canonical learning plan feeds courses, assignments, and calendar", async ({ request }) => {
    const courses = await apiJson(request, fixture.learnerA1, "/curriculum/learning/courses");
    const assignments = await apiJson(request, fixture.learnerA1, "/assignments");
    const calendar = await apiJson(request, fixture.learnerA1, "/calendar/events/me");
    expect(courses.items.some((course) => course.courseId === fixture.courseA)).toBe(true);
    const assignment = assignments.items.find((item) => item.id === fixture.assignmentA);
    expect(assignment).toBeTruthy();
    expect(assignment.curriculumRelease.releaseId).toBe(fixture.releaseA1);
    expect(calendar.items.some((item) => item.sourceId === fixture.assignmentA || item.id?.includes(fixture.assignmentA))).toBe(true);
  });

  test("course workspace preserves release, ordering, entitlement, and server progress", async ({ request, browser }) => {
    const course = await apiJson(request, fixture.learnerA1, "/curriculum/learning/courses/phase8-course-a");
    expect(course.stableKey).toBe("phase8-course-a");
    expect(course.units[0].stableKey).toBe("unit-a");
    expect(course.units[0].lessons[0].lessonStableKey).toBe("lesson-a");
    expect(course.progressPercent).toBe(0);
    const page = await studentPage(browser, fixture.learnerA1, "/curriculum/courses/phase8-course-a");
    await expect(page.getByRole("heading", { name: "Course A", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Lessons" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Assignments" })).toBeVisible();
    await page.getByRole("tab", { name: "Lessons" }).click();
    await expect(page.getByText(/0 of 1 lessons completed/)).toBeVisible();
    await page.close();
  });

  test("completion is evaluated and persisted only by the server completion boundary", async ({ request }) => {
    const result = await apiJson(request, fixture.learnerA2, `/assignments/${fixture.assignmentA}/check-completion`, {
      method: "POST",
      data: { unitStableKey: "unit-a", lessonStableKey: "lesson-a" },
    });
    expect(result.complete).toBe(true);
    expect(result.completion).toBeTruthy();
    expect(Array.isArray(result.requirements)).toBe(true);
  });

  test("calendar and live views are read-only projections of entitled backend state", async ({ request, browser }) => {
    const sessions = await apiJson(request, fixture.learnerA1, "/live-learning/sessions");
    expect(sessions.items.some((session) => session.id === fixture.liveSessionA)).toBe(true);
    const page = await studentPage(browser, fixture.learnerA1, "/curriculum/asl/calendar");
    await expect(page.getByRole("heading", { name: "Learning Calendar" })).toBeVisible();
    await page.close();
  });

  test("foreign course access and staff routes fail closed for a learner", async ({ request, browser }) => {
    const foreignCourse = await request.fetch(apiUrl(`/curriculum/learning/courses/${fixture.courseA}`), { headers: { Authorization: token(fixture.learnerB1) } });
    expect(foreignCourse.status()).toBe(404);
    const staff = await studentPage(browser, fixture.learnerA1, "/curriculum/instructor/operations");
    await expect(staff.locator("body")).not.toContainText("Operational Workspace");
    await staff.close();
  });

  test("empty learner state remains honest", async ({ request, browser }) => {
    const courses = await apiJson(request, fixture.adminEmpty, "/curriculum/learning/courses");
    expect(courses.items).toEqual([]);
    const page = await studentPage(browser, fixture.adminEmpty, "/curriculum/learning");
    await expect(page.getByText(/active course yet|assigned coursework/i).first()).toBeVisible();
    await page.close();
  });

  test("release history does not silently rebind assignment work", async ({ request }) => {
    const assignment = await apiJson(request, fixture.learnerA1, `/assignments/${fixture.assignmentA}`);
    expect(assignment.curriculumRelease.releaseId).toBe(fixture.releaseA1);
    expect(assignment.curriculumRelease.versionNumber || assignment.curriculumRelease.releaseVersion).toBe(1);
  });

  test("student learning remains responsive and keyboard reachable", async ({ browser }) => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 390, height: 900 }]) {
      const page = await studentPage(browser, fixture.learnerA1, "/curriculum/learning");
      await page.setViewportSize(viewport);
      await expect.poll(() => page.evaluate(() => document.readyState)).toBe("complete");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.width}px overflow`).toBe(true);
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
      await page.close();
    }
  });
});
