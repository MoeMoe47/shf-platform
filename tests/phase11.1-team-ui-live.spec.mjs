import { test, expect } from "@playwright/test";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
if (!frontend || !api) throw new Error("Phase 11.1 UI acceptance requires the disposable environment.");
const token = (id) => `Bearer dev-token:${id}`;

async function pageFor(browser, id, viewport) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript((userId) => { window.__user = { id: userId, role: userId.startsWith("admin") ? "admin" : "student", email: `${userId}@phase11.test`, name: userId }; }, id);
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    return route.continue();
  });
  return page;
}

async function createTeam(request) {
  const response = await request.fetch(`${api}/studio/teams`, { method: "POST", headers: { Authorization: token("admin_A"), "Content-Type": "application/json" }, data: { name: `UI Team ${Date.now()}` } });
  const body = await response.json();
  expect(response.status()).toBe(201);
  return body.data.teamId;
}

test("Team management is usable at desktop, tablet, and mobile widths", async ({ browser, request }) => {
  const teamId = await createTeam(request);
  const add = await request.fetch(`${api}/studio/teams/${teamId}/members`, { method: "POST", headers: { Authorization: token("admin_A"), "Content-Type": "application/json" }, data: { userId: "learner_A1", role: "LEAD" } });
  expect(add.status()).toBe(201);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 900 }]) {
    const page = await pageFor(browser, "admin_A", viewport);
    await page.goto(`${frontend}/curriculum.html#/studio/teams`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main").getByRole("heading", { name: "Teams" })).toBeVisible();
    await expect(page.getByText(/UI Team/)).toBeVisible();
    await page.getByRole("button", { name: "View members" }).first().click();
    await expect(page.getByText("learner_A1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
    await page.close();
  }
});

test("Team page exposes work and empty-state semantics", async ({ browser }) => {
  const page = await pageFor(browser, "learner_B1", { width: 1440, height: 900 });
  await page.goto(`${frontend}/curriculum.html#/studio/teams`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main").getByRole("heading", { name: "Teams" })).toBeVisible();
  await expect(page.getByText("You are not currently on a team.", { exact: true })).toBeVisible();
  const snapshot = await page.getByRole("main", { name: "Teams" }).ariaSnapshot();
  expect(snapshot).toContain("Teams");
  expect(snapshot).toContain("not currently on a team");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("You are not currently on a team.", { exact: true })).toBeVisible();
  await page.close();
});
