import { test, expect } from "@playwright/test";

const BASE = String(process.env.SHS_TEST_FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const APP_REGISTRY_URL = `${BASE}/admin.html#/app-registry`;

test("App Registry renders contract layout", async ({ page }) => {
  await page.goto(APP_REGISTRY_URL, {
    waitUntil: "networkidle",
  });

  // Exclude the hidden contract sentinel node(s)
  const wrap = page.locator('.ar-wrap:not([aria-hidden="true"])');
  const grid = page.locator('.ar-grid:not([aria-hidden="true"])');
  const firstCard = page.locator('.ar-card:not([aria-hidden="true"])').first();

  await expect(wrap).toBeVisible();
  await expect(grid).toBeVisible();
  await expect(firstCard).toBeVisible();

  // Visual snapshot (golden)
  await expect(page).toHaveScreenshot("app-registry.png", { fullPage: true });
});
