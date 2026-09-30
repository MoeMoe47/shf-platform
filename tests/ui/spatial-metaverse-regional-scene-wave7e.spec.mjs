import { expect, test } from "@playwright/test";

const base = String(process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173").replace(/\/$/, "");
const fixtureUrl = `${base}/metaverse/oil-rig?metaverseDev=1&spatialIntelligenceFixture=oil-rig-contains-point&metSceneTime=DAY`;

test("Oil Rig DEV fixture renders a sanitized Spatial Intelligence inspection surface", async ({ page }) => {
  await page.goto(fixtureUrl, { waitUntil: "domcontentloaded" });
  const panel = page.getByRole("region", { name: "Spatial Intelligence" });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("CONTAINS");
  await expect(panel).toContainText("true");
  await expect(panel).toContainText("metaverse.regional-scene");
  await expect(panel).not.toContainText("201e189ef24d2adb");
  await expect(panel).not.toContainText("/private/");
});

test("fixture is absent without the DEV gate or fixture query", async ({ page }) => {
  for (const url of [
    `${base}/metaverse/oil-rig?spatialIntelligenceFixture=oil-rig-contains-point&metSceneTime=DAY`,
    `${base}/metaverse/oil-rig?metaverseDev=1&metSceneTime=DAY`,
  ]) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("region", { name: "Spatial Intelligence" })).toHaveCount(0);
  }
});

test("unknown fixture and non-Oil-Rig scenes fail closed", async ({ page }) => {
  for (const url of [
    `${base}/metaverse/oil-rig?metaverseDev=1&spatialIntelligenceFixture=unknown`,
    `${base}/metaverse/open-sea?metaverseDev=1&spatialIntelligenceFixture=oil-rig-contains-point`,
  ]) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("region", { name: "Spatial Intelligence" })).toHaveCount(0);
  }
});

test("inspection is keyboard operable with a visible result status", async ({ page }) => {
  await page.goto(fixtureUrl, { waitUntil: "domcontentloaded" });
  const activate = page.getByRole("button", { name: /Spatial Intelligence/i });
  await activate.focus();
  await expect(activate).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText(/CONTAINS|Spatial Intelligence/);
});

test("inspection does not navigate away from the Oil Rig route", async ({ page }) => {
  await page.goto(fixtureUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Spatial Intelligence/i }).press("Enter");
  await expect(page).toHaveURL(/\/metaverse\/oil-rig\?/);
});
