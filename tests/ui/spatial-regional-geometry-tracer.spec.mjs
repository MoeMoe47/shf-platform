import { test, expect } from "@playwright/test";

const base = String(process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173").replace(/\/$/, "");
const productionBase = process.env.SHS_TEST_PRODUCTION_URL ? String(process.env.SHS_TEST_PRODUCTION_URL).replace(/\/$/, "") : null;

test("normal Oil Rig route has no geometry tracer", async ({ page }) => {
  await page.goto(`${base}/metaverse/oil-rig?metaverseDev=1&metSceneTime=DAY`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-regional-geometry-tracer-panel]")).toHaveCount(0);
  await expect(page.locator("[data-metaverse-geometry-tracer]")).toHaveCount(0);
});

test("DEV-gated Oil Rig tracer supports draft Polygon authoring", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/metaverse/oil-rig?metaverseDev=1&regionalGeometryAuthoring=1&metSceneTime=DAY`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-regional-geometry-tracer-panel]")).toBeVisible();
  const overlay = page.locator("[data-metaverse-geometry-tracer]");
  await expect(overlay).toBeVisible();
  const box = await overlay.boundingBox();
  expect(box?.width).toBeGreaterThan(0);
  expect(box?.height).toBeGreaterThan(0);
  await overlay.click({ position: { x: box.width * 0.45, y: box.height * 0.15 } });
  await overlay.click({ position: { x: box.width * 0.6, y: box.height * 0.15 } });
  await overlay.click({ position: { x: box.width * 0.6, y: box.height * 0.45 } });
  await page.getByRole("button", { name: "Close Polygon", exact: true }).click();
  await expect(page.getByText(/Vertices: 4 · closed · VALID/)).toBeVisible();
  await expect(page.getByText(/outer ring requires at least four coordinates/)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("production-equivalent route cannot expose the tracer", async ({ page }) => {
  test.skip(!productionBase, "set SHS_TEST_PRODUCTION_URL to run the production-preview check");
  await page.goto(`${productionBase}/metaverse/oil-rig?metaverseDev=1&regionalGeometryAuthoring=1`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-regional-geometry-tracer-panel]")).toHaveCount(0);
  await expect(page.locator("[data-metaverse-geometry-tracer]")).toHaveCount(0);
});
