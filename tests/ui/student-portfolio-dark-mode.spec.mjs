// Regression protection for the Student Portfolio Light/Dark/System theme.
// See src/utils/careerTheme.js, src/components/ThemeSwitch.jsx,
// src/styles/student-portfolio-dark.css. The theme control lives in the
// shared AppShellLayout header (locked placement standard); the visual
// dark treatment is gated to this page via document.body[data-dark-scope]
// carrying "student-portfolio" (this page's own .sp-* rules) and
// "resume-builder" (reused so the shared shell chrome, already dark on
// Resume Builder, goes dark here too without rewriting its CSS — the same
// approach already taken by Career Pathways).
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/career.html";

async function selectTheme(page, label) {
  await page.getByRole("button", { name: /Theme, currently/ }).click();
  await expect(page.locator(".theme-switch__menu")).toBeVisible();
  await page.getByRole("menuitemradio", { name: new RegExp(label) }).click();
}

test.describe("Theme selection and persistence", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("selecting Dark applies data-theme=dark and persists across refresh", async ({ page }) => {
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.reload({ waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
  });

  test("an explicit Light choice overrides a dark system preference", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    await selectTheme(page, "Light");
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
    await page.reload({ waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
  });

  test("System follows the OS color-scheme preference live", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    await selectTheme(page, "System");
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.emulateMedia({ colorScheme: "light" });
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
  });

  test("preference persists across Career routes and direct navigation", async ({ page }) => {
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.evaluate(() => { window.location.hash = "#/resume"; });
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
  });
});

test.describe("Dark scope activation", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Student Portfolio activates both its own and the shared-shell dark scope tokens", async ({ page }) => {
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.body.getAttribute("data-dark-scope"))).toContain("student-portfolio");
    const scope = await page.evaluate(() => document.body.getAttribute("data-dark-scope"));
    expect(scope).toContain("resume-builder");
  });

  test("navigating away clears this page's dark scope token (no leakage)", async ({ page }) => {
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.body.getAttribute("data-dark-scope"))).toContain("student-portfolio");

    await page.evaluate(() => { window.location.hash = "#/dashboard"; });
    await page.waitForTimeout(400);
    const scope = await page.evaluate(() => document.body.getAttribute("data-dark-scope"));
    expect(scope || "").not.toContain("student-portfolio");
  });

  test("Dashboard stays visually light even while the Dark preference is active", async ({ page }) => {
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await page.evaluate(() => { window.location.hash = "#/dashboard"; });
    await page.waitForTimeout(400);
    const dataTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(dataTheme).toBe("dark"); // preference is still global/shared
    const darkScope = await page.evaluate(() => document.body.getAttribute("data-dark-scope"));
    expect(darkScope).toBeNull(); // but Dashboard has no dark styling scope active
  });
});

test.describe("Cross-page scope sharing with Resume Builder", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Resume Builder stays dark-styled after visiting Portfolio in the same session", async ({ page }) => {
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await expect.poll(() => page.evaluate(() => document.body.getAttribute("data-dark-scope"))).toContain("resume-builder");
    const bg = await page.locator(".rb2-shell").evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).not.toBe("rgb(250, 248, 243)"); // not the light ivory shell background
  });

  test("Resume Builder A4 preview paper stays white even in dark mode after visiting Portfolio", async ({ page }) => {
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    // Desktop (1440px) shows Editor and Live Preview side by side already —
    // no tab switch needed (that only exists in the mobile single-column
    // layout, see resume-dark-mode.spec.mjs's 390px test).
    const a4Bg = await page.locator(".resume-a4").first().evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(a4Bg).toBe("rgb(255, 255, 255)");
  });
});

test.describe("Dialog and panel dark rendering", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Notifications panel renders with a dark (non-white) background", async ({ page }) => {
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await page.getByRole("button", { name: /Notifications/ }).click();
    const panel = page.getByRole("dialog", { name: "Notifications" });
    await expect(panel).toBeVisible();
    const bg = await panel.evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).not.toBe("rgb(255, 255, 255)");
  });

  test("Edit profile panel (avatar uploader) renders with a dark (non-white) background", async ({ page }) => {
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await page.getByRole("button", { name: "Edit profile" }).click();
    const panel = page.locator("#sp-edit-panel");
    await expect(panel).toBeVisible();
    const bg = await panel.evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).not.toBe("rgb(255, 255, 255)");
  });
});

test.describe("Sidebar collapse/expand under dark theme", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("theme stays correct through collapse and expand", async ({ page }) => {
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await page.getByRole("button", { name: /Collapse sidebar/ }).click();
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
    await page.getByRole("button", { name: /Expand sidebar/ }).click();
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
  });
});

test.describe("Existing light mode is unchanged", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("default theme is still light and the page keeps its original ivory background", async ({ page }) => {
    await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
    const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(theme).toBe("light");
    const bg = await page.locator(".sp-page").evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).not.toBe("rgb(13, 15, 18)"); // not the dark canvas color
  });
});

for (const vp of [
  { name: "1440px desktop", width: 1440, height: 900 },
  { name: "1024px tablet", width: 1024, height: 900 },
  { name: "768px tablet", width: 768, height: 1024 },
  { name: "390px mobile", width: 390, height: 844 },
  { name: "320px minimum width", width: 320, height: 780 },
]) {
  test.describe(`Responsive dark theme — ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("applies with no horizontal overflow", async ({ page }) => {
      await page.goto(`${BASE}#/portfolio`, { waitUntil: "networkidle" });
      await selectTheme(page, "Dark");
      await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}
