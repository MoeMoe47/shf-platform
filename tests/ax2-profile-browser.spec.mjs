import { test, expect } from "@playwright/test";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const base = `${frontend}/curriculum.html`;
const token = (id) => `Bearer dev-token:${id}`;

function bootUser(page, id) {
  return page.addInitScript(({ userId }) => {
    const activeId = sessionStorage.getItem("ax2-browser-user") || userId;
    sessionStorage.setItem("ax2-browser-user", activeId);
    window.__user = { id: activeId, role: "student", email: `${activeId}@phase8.test`, name: activeId };
  }, { userId: id });
}

test.describe("AX-2 authenticated accessibility profile", () => {
  test.skip(!frontend || !api, "SHS_TEST_FRONTEND_URL and SHS_TEST_API_URL are required");

  test("authenticated save survives reload and user switching", async ({ page }) => {
    await bootUser(page, "learner_A1");
    await page.goto(`${base}#/curriculum/accessibility`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("section[aria-label='Accessibility preferences']")).toBeVisible();
    const before = await page.request.get(`${api}/accessibility/profile/me`, { headers: { Authorization: token("learner_A1") } });
    expect(before.ok()).toBeTruthy();
    const beforeBody = await before.json();
    expect(beforeBody.data.userId).toBe("learner_A1");

    await page.getByRole("checkbox", { name: "Higher contrast" }).check();
    await expect(page.getByTestId("accessibility-profile-status")).toContainText("Accessibility preferences saved.", { timeout: 10000 });

    const saved = await page.request.get(`${api}/accessibility/profile/me`, { headers: { Authorization: token("learner_A1") } });
    expect((await saved.json()).data.preferences.presentation.contrastMode).toBe("HIGH");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("checkbox", { name: "Higher contrast" })).toBeChecked();

    await page.evaluate(() => {
      sessionStorage.setItem("ax2-browser-user", "learner_A2");
      window.location.reload();
    });
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("section[aria-label='Accessibility preferences']")).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Higher contrast" })).not.toBeChecked();
    const switched = await page.request.get(`${api}/accessibility/profile/me`, { headers: { Authorization: token("learner_A2") } });
    expect((await switched.json()).data.userId).toBe("learner_A2");
  });

  test("anonymous mode uses fallback and never exposes an authenticated profile", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(() => { delete window.__user; });
    await page.goto(`${base}#/curriculum/accessibility`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("accessibility-profile-status")).toContainText("Anonymous preferences stay in this browser session.");
    const response = await page.request.get(`${api}/accessibility/profile/me`);
    expect(response.status()).toBe(401);
    await context.close();
  });
});
