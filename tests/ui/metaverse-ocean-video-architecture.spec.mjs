import { test, expect } from "@playwright/test";

const base = String(process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173").replace(/\/$/, "");
const url = `${base}/metaverse/oil-rig?metaverseDev=1&metSceneTime=DAY`;

test("Oil Rig defaults to the cinematic plate contract and keeps procedural ocean dev-only", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(url, { waitUntil: "networkidle" });
  await expect(page.locator("[data-ocean-video-layer]")).toHaveCount(1);
  await expect(page.locator("[data-ocean-video-layer]")).toHaveAttribute("data-ocean-video-status", "missing");
  await expect(page.getByText("OCEAN VIDEO ASSET MISSING", { exact: true })).toBeVisible();
  await expect(page.locator("[data-ocean-runtime]")).toHaveCount(0);
  await expect(page.locator(".met-regional-foreground-depth")).toHaveCount(1);

  await page.getByRole("button", { name: "Procedural Debug", exact: true }).click();
  await expect(page.locator("[data-ocean-video-layer]")).toHaveCount(0);
  await expect(page.locator("[data-ocean-runtime]")).toHaveCount(1);
  await page.getByRole("button", { name: "Cinematic Plate", exact: true }).click();
  await expect(page.locator("[data-ocean-video-layer]")).toHaveCount(1);
  await expect(page.locator("[data-ocean-runtime]")).toHaveCount(0);
  expect(errors).toEqual([]);
});
