import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/career.html";

const ROUTES = [
  "dashboard",
  "dashboard-ns",
  "assignments",
  "calendar",
  "portfolio",
  "learn",
  "learn/1",
  "vocab",
  "planner",
  "explore",
  "career/pathways",
  "resume",
  "rewards",
  "credit/report",
  "marketplace",
  "coach",
  "help",
  "settings",
];

test("Career entry renders and mounts the dashboard (no blank screen)", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });

  await expect(page.locator(".sh-shell")).toBeVisible();
  await expect(page.locator(".sh-sidebar")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Career Center" })).toBeVisible();

  expect(errors).toEqual([]);
});

test("only one router/shell instance is mounted", async ({ page }) => {
  await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
  await expect(page.locator(".sh-shell")).toHaveCount(1);
  await expect(page.locator(".sh-header.app-header")).toHaveCount(1);
});

for (const route of ROUTES) {
  test(`route /${route} resolves without console errors`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(`${BASE}#/${route}`, { waitUntil: "networkidle" });

    await expect(page.locator(".sh-main")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("unknown route redirects to dashboard instead of looping", async ({ page }) => {
  await page.goto(`${BASE}#/this-route-does-not-exist`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  expect(page.url()).toBe(`${BASE}#/dashboard`);
});

test("no horizontal overflow on the dashboard", async ({ page }) => {
  await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
