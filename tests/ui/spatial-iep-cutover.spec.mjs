import { test, expect } from "@playwright/test";

const routeUrl = `${process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5174"}/capital.html#/iep-command-v2`;

test("default development IEP route uses the Spatial county path", async ({ page }) => {
  await page.goto(routeUrl);
  await expect(page.locator(".ohio-official-map-v2")).toHaveAttribute("data-iep-map-source", "spatial");
  await expect(page.locator("svg path")).toHaveCount(88);
});

test("explicit development rollback uses the legacy path with parity preserved", async ({ page }) => {
  await page.goto(`${routeUrl}?iepLegacyMap=1`);
  await expect(page.locator(".ohio-official-map-v2")).toHaveAttribute("data-iep-map-source", "legacy");
  await expect(page.locator("svg path")).toHaveCount(88);
  await expect(page.locator("[data-testid=iep-spatial-dual-run]")).toHaveCount(0);
});
