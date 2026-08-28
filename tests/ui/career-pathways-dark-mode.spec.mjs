// Regression protection for the Career Pathways Light/Dark/System theme.
// See src/utils/careerTheme.js, src/components/ThemeSwitch.jsx,
// src/styles/career-pathways.css. The theme control lives in the shared
// AppShellLayout header (locked placement standard); the visual dark
// treatment is gated to this page via document.body[data-dark-scope]
// carrying "career-pathways" (this page's own .cpw-*/.pd-*/.pp-* rules)
// and "resume-builder" (reused so the shared shell chrome, already dark
// on Resume Builder, goes dark here too without rewriting its CSS).
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
    await page.goto(`${BASE}#/career/pathways`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.reload({ waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
  });

  test("an explicit Light choice overrides a dark system preference", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`${BASE}#/career/pathways`, { waitUntil: "networkidle" });
    await selectTheme(page, "Light");
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
    await page.reload({ waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
  });

  test("System follows the OS color-scheme preference live", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`${BASE}#/career/pathways`, { waitUntil: "networkidle" });
    await selectTheme(page, "System");
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.emulateMedia({ colorScheme: "light" });
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
  });

  test("preference persists across Career routes and direct navigation", async ({ page }) => {
    await page.goto(`${BASE}#/career/pathways`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.evaluate(() => { window.location.hash = "#/portfolio"; });
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.goto(`${BASE}#/career/pathways`, { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
  });
});

test.describe("Dark scope activation", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Career Pathways activates both its own and the shared-shell dark scope tokens", async ({ page }) => {
    await page.goto(`${BASE}#/career/pathways`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.body.getAttribute("data-dark-scope"))).toContain("career-pathways");
    const scope = await page.evaluate(() => document.body.getAttribute("data-dark-scope"));
    expect(scope).toContain("resume-builder");
  });

  test("navigating away clears this page's dark scope tokens (no leakage)", async ({ page }) => {
    await page.goto(`${BASE}#/career/pathways`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.body.getAttribute("data-dark-scope"))).toContain("career-pathways");

    await page.evaluate(() => { window.location.hash = "#/portfolio"; });
    await page.waitForTimeout(400);
    const scope = await page.evaluate(() => document.body.getAttribute("data-dark-scope"));
    expect(scope || "").not.toContain("career-pathways");
  });
});

test.describe("Dialog and panel dark rendering", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Personalizer sheet renders with a dark (non-white) background", async ({ page }) => {
    await page.goto(`${BASE}#/career/pathways`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await page.getByRole("button", { name: /Personalize My Plan/ }).click();
    const sheet = page.locator(".pp-sheet");
    await expect(sheet).toBeVisible();
    const bg = await sheet.evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).not.toBe("rgb(255, 255, 255)");
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("Pathway Detail Drawer renders with a dark (non-white) background", async ({ page }) => {
    await page.goto(`${BASE}#/career/pathways`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await page.getByRole("button", { name: "View Details" }).first().click();
    const modal = page.locator(".pd-modal");
    await expect(modal).toBeVisible();
    const bg = await modal.evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).not.toBe("rgb(255, 255, 255)");
    const headBg = await page.locator(".pd-head").evaluate((n) => getComputedStyle(n).backgroundImage || getComputedStyle(n).backgroundColor);
    expect(headBg).not.toContain("255, 255, 255");
  });

  test("Admin Impact-editor Modal renders with a dark (non-white) background", async ({ page }) => {
    await page.goto(`${BASE}#/career/pathways`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await page.getByRole("button", { name: /Admin: OFF/ }).click();
    await page.getByRole("button", { name: "✏️ Edit Impact" }).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "✏️ Edit Impact" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit Impact JSON" });
    await expect(dialog).toBeVisible();
    const bg = await dialog.evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).not.toBe("rgb(255, 255, 255)");
    const textarea = dialog.locator("textarea");
    const taBg = await textarea.evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(taBg).not.toBe("rgb(255, 255, 255)");
  });
});

test.describe("Sidebar collapse/expand under dark theme", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("theme stays correct through collapse and expand", async ({ page }) => {
    await page.goto(`${BASE}#/career/pathways`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await page.getByRole("button", { name: /Collapse sidebar/ }).click();
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
    await page.getByRole("button", { name: /Expand sidebar/ }).click();
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
  });
});

test.describe("Existing light mode is unchanged", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("default theme is still light and the page matches the approved mock background", async ({ page }) => {
    await page.goto(`${BASE}#/career/pathways`, { waitUntil: "networkidle" });
    const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(theme).toBe("light");
    // The dark-scope tokens mount structurally regardless of theme (see
    // markDarkScope in CareerPathways.jsx) — only html[data-theme="dark"]
    // makes the dark CSS paint. So light mode is verified by computed
    // background, not by the scope attribute being absent.
    const bg = await page.locator(".cpw-page").evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).not.toBe("rgb(13, 15, 18)"); // not the dark canvas color
  });
});
