// Regression protection for the shared Career mobile shell (AppShellLayout.jsx
// + career-shell.css) and the "Ask Coach" floating action. Added after fixing
// two confirmed defects: (1) below 1024px the sidebar had no explicit width
// and, as a flex item, sized to its content (~236px), compressing
// `.sh-main` to ~154px at 390px; (2) the inline-styled Ask Coach button
// overlapped and stole taps from Resume Builder's sticky mobile Export
// button. See src/layouts/AppShellLayout.jsx and src/styles/career-shell.css.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/career.html";

test.describe("Mobile shell — sidebar drawer (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("`.sh-main` receives the full viewport width, not compressed by the sidebar", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const main = await page.locator(".sh-main").boundingBox();
    // Regression: this was ~154px before the fix (sidebar ate ~236px as an
    // uncollapsed flex item). Main must now claim (approximately) the full
    // 390px viewport, not share it with a persistent sidebar column.
    expect(main.width).toBeGreaterThan(350);
  });

  test("no page-level horizontal overflow", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("sidebar is off-canvas by default and opens as a drawer via the hamburger", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const closedBox = await page.locator(".sh-sidebar").boundingBox();
    expect(closedBox.x).toBeLessThan(0); // off-screen to the left

    const hamburger = page.locator(".sh-mobileMenuBtn");
    await expect(hamburger).toBeVisible();
    const box = await hamburger.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);

    await hamburger.click();
    await expect(page.locator(".sh-scrim.is-visible")).toBeVisible();
    // The drawer slides in over `.2s`; wait for the transform transition to
    // settle before asserting its resting position.
    await expect(page.locator(".sh-sidebar")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    const openBox = await page.locator(".sh-sidebar").boundingBox();
    expect(openBox.x).toBe(0);
  });

  test("Escape closes the drawer and returns focus to the hamburger", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const hamburger = page.locator(".sh-mobileMenuBtn");
    await hamburger.click();
    await expect(page.locator(".sh-scrim.is-visible")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator(".sh-scrim.is-visible")).not.toBeVisible();
    const focused = await page.evaluate(() => document.activeElement?.classList?.contains("sh-mobileMenuBtn"));
    expect(focused).toBe(true);
  });

  test("clicking the scrim also closes the drawer", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.locator(".sh-mobileMenuBtn").click();
    await expect(page.locator(".sh-scrim.is-visible")).toBeVisible();
    await page.locator(".sh-scrim").click({ position: { x: 350, y: 50 } });
    await expect(page.locator(".sh-scrim.is-visible")).not.toBeVisible();
  });
});

test.describe("Mobile shell — desktop unchanged (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("sidebar stays in normal flow beside main content; hamburger is hidden", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator(".sh-mobileMenuBtn")).not.toBeVisible();
    const sidebar = await page.locator(".sh-sidebar").boundingBox();
    const main = await page.locator(".sh-main").boundingBox();
    expect(sidebar.x).toBe(0);
    expect(main.x).toBeGreaterThan(sidebar.width - 1); // main sits beside, not under, the sidebar
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("Ask Coach vs. Resume Builder Export collision (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a real click on the sticky mobile Export button opens Export, not Coach", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const exportBtn = page.getByRole("button", { name: /Export/ }).last();
    await exportBtn.scrollIntoViewIfNeeded();

    // No `force: true` here on purpose — this must succeed as a normal,
    // unobstructed click, which is exactly what was failing before the fix
    // (Playwright reported the coach-fab intercepting pointer events, and a
    // forced click actually landed on the Coach panel instead of Export).
    await exportBtn.click({ timeout: 5000 });
    await expect(page.locator(".rb2-sheet")).toBeVisible();
    await expect(page.locator("text=Your AI Coach")).not.toBeVisible();
  });

  test("a real click on the header Coach entry still opens Coach", async ({ page }) => {
    // Brainiact (the floating companion, replaces the old .coach-fab) is
    // suppressed for the whole Resume Builder route now (matches the
    // approved mock, which shows no floating chat affordance at all) —
    // the header's always-visible Coach button is the equivalent,
    // capability-preserving entry point on this route.
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await expect(page.locator(".brainiact-root")).toBeHidden();
    await page.locator(".car-headerCoachBtn").click({ timeout: 5000 });
    await expect(page.locator("text=Your AI Coach")).toBeVisible();
  });
});
