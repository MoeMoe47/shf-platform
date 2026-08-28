import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/curriculum.html";
const DASHBOARD = `${BASE}#/curriculum/asl/dashboard`;

test("Curriculum entry renders the Learning Dashboard (no blank screen)", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(DASHBOARD, { waitUntil: "networkidle" });

  await expect(page.locator(".ld-shell")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Learning Dashboard", level: 1 })).toBeVisible();
  await expect(page.locator(".ld-card")).toHaveCount(6);

  expect(errors).toEqual([]);
});

test("sidebar and header are laid out side by side (no duplicate shell)", async ({ page }) => {
  await page.goto(DASHBOARD, { waitUntil: "networkidle" });

  await expect(page.locator(".ld-shell")).toHaveCount(1);
  await expect(page.locator(".ld-sidebar")).toHaveCount(1);

  const sidebarBox = await page.locator(".ld-sidebar").boundingBox();
  const bodyBox = await page.locator(".ld-body").boundingBox();
  expect(bodyBox.x).toBeGreaterThanOrEqual(sidebarBox.x + sidebarBox.width - 1);
  expect(bodyBox.y).toBeLessThan(50);
});

test("Dashboard sidebar item shows active state", async ({ page }) => {
  await page.goto(DASHBOARD, { waitUntil: "networkidle" });
  await expect(page.locator(".ld-navItem.is-active", { hasText: "Dashboard" })).toBeVisible();
});

const SIDEBAR_ROUTES = [
  ["#/curriculum/asl/dashboard", "Dashboard"],
  ["#/curriculum/asl/calendar", "Calendar"],
  ["#/curriculum/asl/portfolio", "Portfolio"],
  ["#/curriculum/lessons", "Lessons"],
  ["#/curriculum/asl/assignments", "Assignments"],
  ["#/curriculum/instructor", "Instructor"],
  ["#/curriculum/master", "Master View"],
];

for (const [hash, label] of SIDEBAR_ROUTES) {
  test(`sidebar route ${label} resolves without console errors`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(`${BASE}${hash}`, { waitUntil: "networkidle" });

    await expect(page.locator(".ld-main")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("no horizontal overflow on the dashboard", async ({ page }) => {
  await page.goto(DASHBOARD, { waitUntil: "networkidle" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("no horizontal overflow at 320px width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(DASHBOARD, { waitUntil: "networkidle" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("mobile menu toggle opens and closes the sidebar drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(DASHBOARD, { waitUntil: "networkidle" });

  const menuBtn = page.locator(".ld-mobileMenuBtn");
  await expect(menuBtn).toBeVisible();

  await menuBtn.click();
  await expect(page.locator(".ld-sidebarWrap")).toHaveClass(/is-open/);

  await page.locator(".ld-scrim").click();
  await expect(page.locator(".ld-sidebarWrap")).not.toHaveClass(/is-open/);
});

test("Brainiact opens the Coach panel (replaces the old AI Tutor button)", async ({ page }) => {
  await page.goto(DASHBOARD, { waitUntil: "networkidle" });

  await page.locator(".brainiact-fab").click();
  await page.getByRole("button", { name: "Ask Coach →" }).click();
  await expect(page.getByRole("dialog", { name: "Coach Mode" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Coach Mode" })).toHaveCount(0);
});

test("search field accepts input", async ({ page }) => {
  await page.goto(DASHBOARD, { waitUntil: "networkidle" });
  const search = page.locator("#curriculum-search");
  await search.fill("machine learning");
  await expect(search).toHaveValue("machine learning");
});

test("calendar navigation advances the month and back", async ({ page }) => {
  await page.goto(DASHBOARD, { waitUntil: "networkidle" });
  await expect(page.locator(".ld-calTitle")).toHaveText("August 2026");

  await page.getByRole("button", { name: "Next month" }).click();
  await expect(page.locator(".ld-calTitle")).toHaveText("September 2026");

  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(page.locator(".ld-calTitle")).toHaveText("August 2026");
});

test("direct nested route refresh works", async ({ page }) => {
  await page.goto(`${BASE}#/curriculum/asl/calendar`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".ld-main")).toBeVisible();
});
