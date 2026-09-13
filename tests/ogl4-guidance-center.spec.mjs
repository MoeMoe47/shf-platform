import { test, expect } from "@playwright/test";

test("authenticated Hub Guidance Center composes current context and existing tour", async ({ page }) => {
  test.setTimeout(90000);
  const frontend = process.env.SHS_TEST_FRONTEND_URL;
  if (!frontend) throw new Error("SHS_TEST_FRONTEND_URL is required");
  const token = "Bearer dev-token:instructor_A_authorized";
  await page.addInitScript(() => { window.__user = { id: "instructor_A_authorized", role: "instructor", email: "instructor.authorized@phase8.test" }; });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.resourceType() !== "fetch" && request.resourceType() !== "xhr") return route.continue();
    return route.continue({ headers: { ...request.headers(), authorization: token } });
  });
  await page.goto(`${frontend}/admin.html#/hub`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const launch = page.getByRole("button", { name: "Open Guidance Center" });
  await expect(launch).toBeVisible({ timeout: 10000 });
  await launch.click();
  const panel = page.getByRole("dialog", { name: "Guidance" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "About this area" })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Your next steps" })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Documentation" })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Ask Companion" })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "What's changed" })).toBeVisible();
  await panel.getByRole("button", { name: "Close Guidance Center" }).click();
  await expect(panel).toBeHidden();
  await expect(launch).toBeFocused();
  await launch.press("Enter");
  await panel.getByRole("button", { name: /Take the tour|Resume tour|Replay tour/ }).click();
  await expect(page.locator('[data-tour-overlay="active"], [data-tour-overlay="waiting"]')).toHaveCount(1, { timeout: 5000 });
});
