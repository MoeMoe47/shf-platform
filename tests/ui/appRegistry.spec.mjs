import { test, expect } from "@playwright/test";

test("App Registry renders contract layout", async ({ page }) => {
  await page.goto("http://localhost:5173/admin.html#/alignment/app-registry", {
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
