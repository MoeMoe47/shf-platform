import { test, expect } from "@playwright/test";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const token = "Bearer dev-token:admin_A";

test.describe("OGL-6 authenticated admin acceptance", () => {
  test.skip(!frontend || !api, "SHS_TEST_FRONTEND_URL and SHS_TEST_API_URL are required");
  test("admin can inspect OGL health and create a bounded draft", async ({ page, request }) => {
    const health = await request.get(`${api}/orientation/analytics`, { headers: { authorization: token } });
    const healthPayload = await health.json();
    expect(health.ok()).toBeTruthy();
    expect(healthPayload.data.health.basis).toBe("OGL_EXPERIENCE_TELEMETRY_ONLY");
    await page.addInitScript(({ value }) => localStorage.setItem("shfOperatorToken", value), { value: token.slice(7) });
    await page.route("**/*", async (route) => {
      if (["fetch", "xhr"].includes(route.request().resourceType())) return route.continue({ headers: { ...route.request().headers(), authorization: token } });
      return route.continue();
    });
    await page.goto(`${frontend}/admin.html#/orientation`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.getByRole("heading", { name: "Orientation & Guidance" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: "OGL system health" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create draft" })).toBeVisible();
    await page.getByLabel("Change summary").fill("Acceptance-only presentation review");
    await page.getByRole("button", { name: "Create draft" }).click();
    await expect(page.locator(".ogl-admin__notice")).toContainText("Draft created");
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.locator(".ogl-admin__notice")).toContainText("published as the active presentation overlay");
  });

  test("unauthorized actor cannot access OGL authoring API", async ({ request }) => {
    const response = await request.get(`${api}/orientation/admin`, { headers: { authorization: "Bearer dev-token:learner_A1" } });
    expect(response.status()).toBe(403);
  });

  test("public destination does not expose OGL admin health", async ({ page }) => {
    await page.goto(`${frontend}/solutions.html#/home`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toContainText("OGL system health");
  });
});
