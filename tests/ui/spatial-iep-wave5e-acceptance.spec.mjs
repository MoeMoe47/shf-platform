import { test, expect } from "@playwright/test";

const baseUrl = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5174";
const routeUrl = `${baseUrl}/capital.html#/iep-command-v2`;

test("Spatial preparation failure stays controlled and does not fall back silently", async ({ page }) => {
  await page.route("**/assets/maps/ohio-counties.geojson", (route) => route.abort());
  await page.goto(routeUrl);

  await expect(page.locator(".ohio-official-map-v2")).toHaveAttribute(
    "data-iep-map-source",
    "spatial-error",
  );
  await expect(page.getByRole("alert")).toContainText("Spatial county preparation unavailable");
  await expect(page.locator("svg path")).toHaveCount(0);
});

test("production query flags cannot activate the DEV rollback or dual-run paths", async ({ page }) => {
  const productionUrl = `${process.env.SHS_TEST_PRODUCTION_URL || "http://127.0.0.1:5180"}/capital.html#/iep-command-v2`;
  await page.goto(`${productionUrl}?iepLegacyMap=1&iepSpatialDualRun=1`);

  await expect(page.locator(".ohio-official-map-v2")).not.toHaveAttribute("data-iep-map-source", "legacy");
  await expect(page.locator("[data-testid=iep-spatial-dual-run]")).toHaveCount(0);
  await expect(page.locator("svg path")).toHaveCount(88);
});
