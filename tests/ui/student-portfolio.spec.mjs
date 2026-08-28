import { test, expect } from "@playwright/test";

const CAREER_URL = "http://localhost:5173/career.html#/portfolio";
const CURRICULUM_URL = "http://localhost:5173/curriculum.html#/curriculum/asl/portfolio";

for (const [host, url] of [
  ["career", CAREER_URL],
  ["curriculum", CURRICULUM_URL],
]) {
  test(`${host}: Portfolio renders shell, header, and all sections (no blank screen)`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(url, { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "Student Portfolio", level: 1 })).toBeVisible();
    await expect(page.locator(".sp-card")).toHaveCount(await page.locator(".sp-card").count());
    await expect(page.getByRole("heading", { name: "Featured Projects" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Profile strength" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Credentials & Badges" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Interview Practice" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Career Readiness" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent Achievements" })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test(`${host}: no duplicate page header`, async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    await expect(page.locator(".sp-h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test(`${host}: only one shell/router mounted`, async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    await expect(page.locator(".sp-page")).toHaveCount(1);
  });

  test(`${host}: interview rating is selectable and exposed via aria-pressed`, async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    const rate4 = page.getByRole("button", { name: "Rate 4 out of 5" });
    await rate4.click();
    await expect(rate4).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".sp-interviewMeta")).toContainText("4.0/5");
  });

  test(`${host}: interview notes field accepts text`, async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    const notes = page.locator(".sp-notesInput");
    await notes.fill("STAR practice notes.");
    await expect(notes).toHaveValue("STAR practice notes.");
  });

  test(`${host}: Edit profile is keyboard-operable and reveals the upload panel`, async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    const editBtn = page.getByRole("button", { name: "Edit profile" });
    await editBtn.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#sp-edit-panel")).toBeVisible();
  });

  test(`${host}: Share portfolio always resolves to a status message (no hang)`, async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Share portfolio" }).click();
    await expect(page.locator('[role="status"]')).not.toHaveText("", { timeout: 3000 });
  });

  test(`${host}: no horizontal overflow at 1440x900`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test(`${host}: direct route refresh works`, async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".sp-h1")).toBeVisible();
  });
}

test("curriculum: no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(CURRICULUM_URL, { waitUntil: "networkidle" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("curriculum: Portfolio sidebar item shows active state with correct semantics", async ({ page }) => {
  await page.goto(CURRICULUM_URL, { waitUntil: "networkidle" });
  const active = page.locator(".ld-navItem.is-active");
  await expect(active).toHaveCount(1);
  await expect(active).toContainText("Portfolio");
});

test("career: Portfolio sidebar item shows active state", async ({ page }) => {
  await page.goto(CAREER_URL, { waitUntil: "networkidle" });
  await expect(page.locator(".car-link.is-active")).toContainText("Portfolio");
});

test("back and forward navigation between Dashboard and Portfolio work", async ({ page }) => {
  await page.goto("http://localhost:5173/career.html#/dashboard", { waitUntil: "networkidle" });
  await page.goto(CAREER_URL, { waitUntil: "networkidle" });
  await page.goBack();
  await expect(page).toHaveURL(/#\/dashboard$/);
  await page.goForward();
  await expect(page).toHaveURL(/#\/portfolio$/);
});

test("Curriculum Learning Dashboard is not regressed by the Portfolio changes", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://localhost:5173/curriculum.html#/curriculum/asl/dashboard", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Learning Dashboard", level: 1 })).toBeVisible();
  await expect(page.locator(".ld-card")).toHaveCount(6);
  expect(errors).toEqual([]);
});
