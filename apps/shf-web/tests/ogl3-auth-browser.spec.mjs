import { test, expect } from "@playwright/test";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const token = "dev-token:learner_A1";

test("authenticated API and Hub canonical runtime smoke", async ({ browser }) => {
  const apiMe = await fetch(`${api}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  console.log("AUTH_ME", apiMe.status, await apiMe.text());
  expect(apiMe.ok).toBeTruthy();
  const context = await fetch(`${api}/orientation/context?destinationId=curriculum`, { headers: { Authorization: `Bearer ${token}` } });
  console.log("ORIENTATION_CONTEXT", context.status, await context.text());
  expect(context.status).toBe(200);

  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  await page.addInitScript(({ value }) => localStorage.setItem("shfOperatorToken", value), { value: token });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: `Bearer ${token}` } });
    return route.continue();
  });
  await page.goto(`${frontend}/admin.html#/hub`, { waitUntil: "networkidle" });
  console.log("PAGE", page.url(), await page.title());
  console.log("BODY_HEAD", (await page.locator("body").innerText()).slice(0, 500));
  await expect(page.getByRole("button", { name: /Start Hub tour/i })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: /Start Hub tour/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  console.log("TOUR_DIALOG", (await page.getByRole("dialog").innerText()).slice(0, 400));
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText(/Step 2 of/i)).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();
  await page.close();
});
