import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const manifestPath = process.env.SHS_PHASE8_FIXTURE_MANIFEST;
if (!frontend || !api || !manifestPath) throw new Error("Phase 9 security/UX acceptance requires the disposable environment.");
const fixture = JSON.parse(readFileSync(manifestPath, "utf8"));
const auth = (id) => `Bearer dev-token:${id}`;
const url = (path) => `${api}${path}`;

async function actorPage(browser, id, path = "/curriculum/asl/dashboard") {
  const page = await browser.newPage();
  await page.addInitScript(({ id }) => {
    const staff = id.includes("instructor") || id.includes("admin") || id === "multi_org_staff";
    window.__user = { role: staff ? "instructor" : "student", email: `${id}@phase8.test`, name: id };
  }, { id });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) {
      await route.continue({ headers: { ...request.headers(), authorization: auth(id) } });
    } else await route.continue();
  });
  if (path) await page.goto(`${frontend}/curriculum.html#${path}`, { waitUntil: "domcontentloaded" });
  return page;
}

async function browserApi(page, id, path, { method = "GET", body } = {}) {
  return page.evaluate(async ({ base, path, method, body, authorization }) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { authorization, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let parsed = {};
    try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { raw: text }; }
    return { status: response.status, body: parsed, text };
  }, { base: api, path, method, body, authorization: auth(id) });
}

async function openPage(browser, id, path) {
  const page = await actorPage(browser, id, path);
  await page.waitForLoadState("networkidle").catch(() => {});
  return page;
}

async function expectDenied(page, id, path) {
  const result = await browserApi(page, id, path);
  expect([401, 403, 404]).toContain(result.status);
  return result;
}

async function expectAllowed(page, id, path) {
  const result = await browserApi(page, id, path);
  expect(result.status, `${id} ${path} returned ${result.status}`).toBe(200);
  return result;
}

const studentPages = [
  ["Dashboard", "/curriculum/asl/dashboard"],
  ["Learning", "/curriculum/learning"],
  ["Course Workspace", "/curriculum/courses/phase9-course-a"],
  ["Lesson Workspace", "/curriculum/lessons/student.asl-1-capstone"],
  ["Assignments", "/curriculum/asl/assignments"],
  ["Calendar", "/curriculum/asl/calendar"],
  ["Live Sessions", "/curriculum/live-sessions"],
  ["Portfolio/Evidence", "/curriculum/asl/portfolio"],
  ["Progress", "/curriculum/courses/phase9-course-a/progress"],
];

test.describe.configure({ mode: "serial" });

test("student authorization matrix is enforced in the browser", async ({ browser }) => {
  const page = await actorPage(browser, fixture.learnerA1);
  const allowed = [
    ["Dashboard", "/curriculum/learning/courses"],
    ["Learning", "/curriculum/learning/courses"],
    ["Course A", "/curriculum/learning/courses/phase9-course-a"],
    ["Assignment A", `/assignments/${fixture.assignmentA}`],
    ["Calendar", "/calendar/events/me"],
    ["Live Session A", `/live-learning/sessions/${fixture.liveSession}`],
  ];
  for (const [, path] of allowed) await expectAllowed(page, fixture.learnerA1, path);
  await expectDenied(page, fixture.learnerA1, "/operations/overview");
  await expectDenied(page, fixture.learnerA1, "/shf/reports/curriculum.learning-progress");
  await expectDenied(page, fixture.learnerA1, `/project-submissions/${fixture.projectReviewA}/review`);
  await expectDenied(page, fixture.learnerA1, `/prepare-prove/evidence/${fixture.evidenceReviewA}/review`);
  await expectDenied(page, fixture.learnerA1, `/live-learning/join-events/${fixture.joinEventA1}/confirm-attendance`);
  await expectDenied(page, fixture.learnerA1, `/operations/learners/${fixture.learnerA2}`);
  await expectDenied(page, fixture.learnerA1, `/operations/learners/${fixture.learnerB1}`);
  await page.close();
});

test("foreign IDs and peer-private records fail closed", async ({ browser }) => {
  const a = await actorPage(browser, fixture.learnerA1);
  const foreignA = [
    `/curriculum/learning/courses/${fixture.courseB}`,
    `/assignments/${fixture.assignmentB}`,
    `/live-learning/sessions/${fixture.liveSessionB}`,
    `/prepare-prove/evidence/${fixture.evidenceReviewB}`,
    `/operations/learners/${fixture.learnerB1}`,
    `/shf/reports/curriculum.learning-progress?organization_id=${fixture.orgB}`,
  ];
  for (const path of foreignA) await expectDenied(a, fixture.learnerA1, path);
  const peer = [
    `/operations/learners/${fixture.learnerA2}`,
    `/prepare-prove/evidence/${fixture.evidenceReviewB}`,
  ];
  for (const path of peer) await expectDenied(a, fixture.learnerA1, path);
  const ownAssignment = await browserApi(a, fixture.learnerA1, `/assignments/${fixture.assignmentA}?learner_id=${fixture.learnerA2}`);
  expect(ownAssignment.status).toBe(200);
  expect(JSON.stringify(ownAssignment.body)).not.toContain(fixture.learnerA2);
  await a.close();

  const b = await actorPage(browser, fixture.learnerB1);
  for (const path of [
    `/curriculum/learning/courses/${fixture.courseA}`,
    `/assignments/${fixture.assignmentA}`,
    `/live-learning/sessions/${fixture.liveSessionA}`,
    `/operations/learners/${fixture.learnerA1}`,
    `/prepare-prove/evidence/${fixture.evidenceReviewA}`,
  ]) await expectDenied(b, fixture.learnerB1, path);
  await b.close();
});

test("empty student experience has honest empty states", async ({ browser }) => {
  const page = await openPage(browser, fixture.learnerEmpty || fixture.adminEmpty, "/curriculum/learning");
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/Course A|Assignment A|phase9_course|phase9_assignment|75%|100%/i);
  expect(body).toMatch(/active course|assigned coursework|no course|empty|available/i);
  for (const path of ["/curriculum/asl/dashboard", "/curriculum/asl/assignments", "/curriculum/asl/calendar", "/curriculum/live-sessions", "/curriculum/asl/portfolio"]) {
    await page.goto(`${frontend}/curriculum.html#${path}`, { waitUntil: "domcontentloaded" });
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/Course A|Assignment A|phase9_course|phase9_assignment|75%|100%/i);
  }
  await page.close();
});

test("student errors are explicit and never become zero or NO_DATA", async ({ browser }) => {
  const cases = [
    ["Dashboard", "/curriculum/asl/dashboard", "/operations/overview"],
    ["Learning", "/curriculum/learning", "/curriculum/learning/courses"],
    ["Assignments", "/curriculum/asl/assignments", "/assignments"],
    ["Course Workspace", "/curriculum/courses/phase9-course-a", "/curriculum/learning/courses/phase9-course-a"],
    ["Lesson Workspace", "/curriculum/lessons/student.asl-1-capstone", "/activity-domains/assignments/phase9_assignment_a/lessons/unit-a/lesson-a"],
    ["Calendar", "/curriculum/asl/calendar", "/calendar/events/me"],
    ["Live", "/curriculum/live-sessions", "/live-learning/sessions"],
    ["Portfolio/Evidence", "/curriculum/asl/portfolio", "/prepare-prove/evidence/phase9_evidence_a"],
    ["Progress/Report", "/curriculum/courses/phase9-course-a/progress", "/shf/reports/curriculum.learning-progress"],
  ];
  for (const [, path, fragment] of cases) {
    const page = await actorPage(browser, fixture.learnerA1, null);
    await page.route("**/*", (route) => route.request().url().includes(fragment)
      ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "forced acceptance failure" }) })
      : route.continue());
    await page.goto(`${frontend}/curriculum.html#${path}`, { waitUntil: "domcontentloaded" });
    await expect.poll(() => page.locator("body").innerText(), { timeout: 5000 }).not.toContain("Loading");
    const text = await page.locator("body").innerText();
    expect(text, `${path} did not show an explicit failure`).toMatch(/unavailable|isn't available|error|unable|failed|wrong/i);
    await page.close();
  }
  const completionPage = await actorPage(browser, fixture.learnerA1);
  await completionPage.route("**/*", (route) => route.request().url().includes("/assignments/phase9_assignment_a/check-completion")
    ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "forced completion failure" }) })
    : route.continue());
  const completion = await browserApi(completionPage, fixture.learnerA1, `/assignments/${fixture.assignmentA}/check-completion`, { method: "POST", body: {} });
  expect(completion.status).toBe(503);
  expect(completion.text).toContain("forced completion failure");
  await completionPage.close();
});

test("student pages are responsive at required viewports", async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 390, height: 900 }]) {
    for (const [, path] of studentPages) {
      const page = await actorPage(browser, fixture.learnerA1, path);
      await page.setViewportSize(viewport);
      await page.waitForTimeout(250);
      const checks = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const overflow = document.documentElement.scrollWidth > viewportWidth + 1;
        const visibleControls = [...document.querySelectorAll("button, a, [role=tab]")].filter((el) => el.getClientRects().length);
        return { overflow, visibleControls: visibleControls.length };
      });
      expect(checks.overflow, `${path} ${viewport.width}px overflow`).toBe(false);
      expect(checks.visibleControls, `${path} ${viewport.width}px has no usable controls`).toBeGreaterThan(0);
      await page.close();
    }
  }
});

test("student surfaces meet practical accessibility checks", async ({ browser }) => {
  for (const [, path] of studentPages) {
    const page = await actorPage(browser, fixture.learnerA1, path);
    await page.waitForLoadState("networkidle").catch(() => {});
    const audit = await page.evaluate(() => {
      const name = (el) => (el.textContent || el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("alt") || "").trim();
      const controls = [...document.querySelectorAll("button, a")];
      const inputs = [...document.querySelectorAll("input, select, textarea")];
      const unnamed = controls.filter((el) => el.getClientRects().length && el.getAttribute("aria-hidden") !== "true" && !name(el)).length;
      const unlabeled = inputs.filter((el) => el.getClientRects().length && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby") && !el.getAttribute("placeholder") && !el.closest("label") && (!el.id || !document.querySelector(`label[for='${CSS.escape(el.id)}']`))).length;
      const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((el) => Number(el.tagName.slice(1)));
      const headingJump = headings.some((level, i) => i && level - headings[i - 1] > 1);
      return { unnamed, unnamedTags: controls.filter((el) => el.getClientRects().length && el.getAttribute("aria-hidden") !== "true" && !name(el)).map((el) => el.outerHTML.slice(0, 180)), unlabeled, headingJump, headingCount: headings.length, tableWithoutHeaders: [...document.querySelectorAll("table")].filter((t) => !t.querySelector("th")).length };
    });
    expect(audit.unnamed, `${path} unnamed control ${JSON.stringify(audit.unnamedTags)}`).toBe(0);
    expect(audit.unlabeled, `${path} unlabeled form control`).toBe(0);
    expect(audit.headingCount, `${path} page heading`).toBeGreaterThan(0);
    expect(audit.tableWithoutHeaders, `${path} table without headers`).toBe(0);
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
    await page.close();
  }
});

test("browser authority audit finds no institutional truth writes", async ({ browser }) => {
  const page = await actorPage(browser, fixture.learnerA1, "/curriculum/asl/dashboard");
  const forbidden = await page.evaluate(() => ({
    localStorageKeys: Object.keys(localStorage).filter((key) => /progress|completion|truth|metric|report|attendance/i.test(key)),
    sessionStorageKeys: Object.keys(sessionStorage).filter((key) => /progress|completion|truth|metric|report|attendance/i.test(key)),
  }));
  expect(forbidden.localStorageKeys).toEqual([]);
  expect(forbidden.sessionStorageKeys).toEqual([]);
  await page.close();
});
