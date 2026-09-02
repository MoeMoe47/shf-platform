import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const manifestPath = process.env.SHS_PHASE8_FIXTURE_MANIFEST;
if (!frontend || !api || !manifestPath) throw new Error("Phase 9.5 acceptance requires the disposable environment.");

const fixture = JSON.parse(readFileSync(manifestPath, "utf8"));
const bearer = (userId) => `Bearer dev-token:${userId}`;
const url = (path) => `${api}${path}`;

async function readJson(request, userId, path, options = {}) {
  const response = await request.fetch(url(path), {
    ...options,
    headers: { Authorization: bearer(userId), ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.ok(), `${path}: ${JSON.stringify(body)}`).toBe(true);
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
    return route.continue({ headers: { ...request.headers(), authorization: bearer(userId) } });
  });
  await page.goto(`${frontend}/curriculum.html#${path}`, { waitUntil: "domcontentloaded" });
  return page;
}

test.describe.configure({ mode: "serial" });
test("canonical completion projects one deduplicated milestone and shared celebration", async ({ request, browser }) => {
  const before = await readJson(request, fixture.learnerA1, "/journey/milestones/me");
  expect(before.items.some((item) => item.type === "LESSON_COMPLETED")).toBe(false);

  // This is the real learner completion boundary. The acceptance test never
  // writes a completion or milestone row directly.
  const completion = await readJson(request, fixture.learnerA1, `/assignments/${fixture.assignmentA}/check-completion`, {
    method: "POST",
    data: { unitStableKey: "unit-a", lessonStableKey: "lesson-a" },
  });
  expect(completion.complete).toBe(true);

  const after = await readJson(request, fixture.learnerA1, "/journey/milestones/me");
  const lessonMilestones = after.items.filter((item) => item.type === "LESSON_COMPLETED");
  expect(lessonMilestones).toHaveLength(1);
  expect(lessonMilestones[0].organizationId).toBe(fixture.orgA);
  expect(lessonMilestones[0].learnerId).toBe(fixture.learnerA1);
  expect(lessonMilestones[0].assignmentId).toBe(fixture.assignmentA);
  expect(lessonMilestones[0].curriculumReleaseId).toBe(fixture.releaseA1);

  const page = await studentPage(browser, fixture.learnerA1, "/curriculum/asl/calendar");
  await expect(page.getByRole("heading", { name: "Learning Calendar" })).toBeVisible();
  await expect(page.locator(".lc-milestoneItem").filter({ hasText: "LESSON COMPLETED" })).toBeVisible();
  await expect(page.locator(".shf-celebration")).toBeVisible();
  await expect(page.locator(".shf-celebration")).toHaveAttribute("data-tier", /^(ACKNOWLEDGEMENT|ACHIEVEMENT|MAJOR_MILESTONE)$/);
  const shownCount = await page.evaluate(() => JSON.parse(localStorage.getItem("shf:celebrations:shown:v1") || "[]").length);
  expect(shownCount).toBeGreaterThan(0);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".lc-milestoneItem").filter({ hasText: "LESSON COMPLETED" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("shf:celebrations:shown:v1") || "[]").length)).toBe(shownCount);
  await page.close();
});

test("milestone projection is tenant-safe and empty/error states remain honest", async ({ request, browser }) => {
  const foreign = await request.fetch(url("/journey/milestones/me"), { headers: { Authorization: bearer(fixture.learnerB1) } });
  expect(foreign.ok()).toBe(true);
  const foreignBody = await foreign.json();
  expect(foreignBody.data.items.some((item) => item.organizationId === fixture.orgA)).toBe(false);

  const page = await studentPage(browser, fixture.learnerA1, "/curriculum/asl/calendar");
  await page.route(`${api}/journey/milestones/me`, (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "unavailable" }) }));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Journey milestones are unavailable/i)).toBeVisible();
  await page.close();
});

test("celebration remains accessible and responsive with reduced motion", async ({ browser }) => {
  const page = await studentPage(browser, fixture.learnerA1, "/curriculum/asl/calendar");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => localStorage.removeItem("shf:celebrations:shown:v1"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".shf-celebration")).toBeVisible();
  await expect(page.locator(".shf-celebration")).toHaveAttribute("role", "status");
  expect(await page.locator(".shf-celebration__effect").count()).toBe(0);
  await expect(page.getByRole("button", { name: "Dismiss celebration" })).toBeVisible();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 390, height: 900 }]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.width}px overflow`).toBe(true);
  }
  await page.close();
});
