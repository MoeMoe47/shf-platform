import { test, expect } from "@playwright/test";

const frontend = process.env.SHS_LOCALHOST_FRONTEND_URL || "http://localhost:5173";
const api = process.env.SHS_LOCALHOST_API_URL || "http://127.0.0.1:8091";
const token = "Bearer dev-token:learner_A1";

test("actual localhost keyboard creation and Studio AT smoke", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.addInitScript(() => { window.__user = { id: "learner_A1", role: "student", email: "learner_A1@localhost.test", name: "Learner A1" }; });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token } });
    return route.continue();
  });
  await page.goto(`${frontend}/curriculum.html#/studio/new?type=WEBSITE`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Continue" }).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Project name").focus();
  await page.keyboard.type(`Phase 14 localhost ${Date.now()}`);
  await page.getByRole("button", { name: "Continue" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Start Project" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/studio\/projects\//);
  await page.goto(`${page.url()}/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Build Your Website" })).toBeVisible();
  await expect(page.getByText("Personal Project", { exact: true })).toBeVisible();
  const snapshot = await page.locator("main").ariaSnapshot();
  expect(snapshot).toContain("Progress");
  expect(snapshot).toContain("Next step");
  await page.close();
});

test("actual localhost context failure keeps the builder usable", async ({ browser, request }) => {
  const create = await request.fetch(`${api}/studio/projects`, { method: "POST", headers: { Authorization: token, "Content-Type": "application/json" }, data: { projectType: "WEBSITE", title: `Phase 14 localhost error ${Date.now()}` } });
  expect(create.status()).toBe(201);
  const project = await create.json();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => { window.__user = { id: "learner_A1", role: "student", email: "learner_A1@localhost.test", name: "Learner A1" }; });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.resourceType() === "fetch" || request.resourceType() === "xhr") return route.continue({ headers: { ...request.headers(), authorization: token } });
    return route.continue();
  });
  await page.route("**/studio/projects/*/learning-context", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false }) }));
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${project.data.projectId}/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Build Your Website" })).toBeVisible();
  await expect(page.getByText("Learning context is unavailable", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Page content")).toBeVisible();
  await page.close();
});
