// Regression protection for the Resume Builder Light/Dark/System theme.
// See src/utils/careerTheme.js, src/components/ThemeSwitch.jsx,
// src/pages/resume-builder/resumeBuilderDark.css. The theme control lives
// in the shared AppShellLayout header (locked placement standard), but
// the visual dark treatment is gated to pages with real dark support via
// document.body[data-dark-scope] — currently Resume Builder only.
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
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.reload({ waitUntil: "networkidle" });
    const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(theme).toBe("dark");
  });

  test("an explicit Light choice overrides a dark system preference", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await selectTheme(page, "Light");
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
    await page.reload({ waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
  });

  test("System follows the OS color-scheme preference live", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await selectTheme(page, "System");
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.emulateMedia({ colorScheme: "light" });
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
  });

  test("theme trigger has an accessible name and exposes the selected option", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: /Theme, currently/ });
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByRole("menuitemradio", { name: /System/ })).toHaveAttribute("aria-checked", "true");
  });

  test("Escape closes the menu and returns focus to the trigger", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: /Theme, currently/ });
    await trigger.click();
    await expect(page.locator(".theme-switch__menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".theme-switch__menu")).not.toBeVisible();
    const returned = await page.evaluate(() => document.activeElement?.classList?.contains("theme-switch__trigger"));
    expect(returned).toBe(true);
  });

  test("the theme dropdown does not get covered by Resume Builder's own sticky content (regression: header stacking)", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: /Theme, currently/ });
    const tbox = await trigger.boundingBox();
    await page.mouse.click(tbox.x + tbox.width / 2, tbox.y + tbox.height / 2);
    const item = page.getByRole("menuitemradio", { name: "Dark" });
    const ibox = await item.boundingBox();
    const el = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest(".theme-switch__item")?.textContent,
      [ibox.x + ibox.width / 2, ibox.y + ibox.height / 2]
    );
    expect(el).toContain("Dark");
  });
});

test.describe("Dark theme at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("applies, has no horizontal overflow, A4 paper stays white, mobile export still works", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await page.getByRole("tab", { name: "Preview" }).click();
    const a4Bg = await page.locator(".resume-a4").first().evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(a4Bg).toBe("rgb(255, 255, 255)");
    await page.getByRole("tab", { name: "Edit" }).click();

    // Mobile nav + Export must still function in dark mode (mobile-shell.spec.mjs regressions)
    await page.locator(".sh-mobileMenuBtn").click();
    await expect(page.locator(".sh-scrim.is-visible")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".sh-scrim.is-visible")).not.toBeVisible();

    const exportBtn = page.getByRole("button", { name: /Export/ }).last();
    await exportBtn.scrollIntoViewIfNeeded();
    await exportBtn.click({ timeout: 5000 });
    await expect(page.locator(".rb2-sheet")).toBeVisible();
    await expect(page.locator("text=Your AI Coach")).not.toBeVisible();
    const sheetBg = await page.locator(".rb2-sheet").evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(sheetBg).not.toBe("rgba(0, 0, 0, 0)");

    expect(errors).toEqual([]);
  });
});

test.describe("Dark theme at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("applies, has no horizontal overflow, Career Intelligence drawer is opaque and above Ask Coach", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await page.getByRole("button", { name: "Improve", exact: true }).click();
    const drawer = page.locator(".rb2-drawer");
    await expect(drawer).toBeVisible();
    const drawerBg = await drawer.evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(drawerBg).not.toBe("rgba(0, 0, 0, 0)");

    // Brainiact (the floating companion) is suppressed for the whole
    // Resume Builder route (matches the approved mock, which shows no
    // floating chat affordance at all), so it can never overlap the
    // drawer in the first place — a stronger guarantee than winning a
    // stacking fight. The equivalent header Coach entry stays reachable
    // regardless.
    await expect(page.locator(".brainiact-root")).toBeHidden();
    await expect(page.locator(".car-headerCoachBtn")).toBeVisible();
  });
});

test.describe("A4 document isolation", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("exported HTML never contains dark app tokens and keeps a white paper background", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await page.evaluate(() => {
      window.__cap = [];
      HTMLAnchorElement.prototype.click = function () { window.__cap.push({ href: this.href }); };
      URL.revokeObjectURL = function () {};
    });
    await page.getByRole("button", { name: "Export menu" }).click();
    await page.getByRole("menuitem", { name: /HTML/ }).click();
    const html = await page.evaluate(async () => {
      const c = window.__cap[window.__cap.length - 1];
      return fetch(c.href).then((r) => r.text());
    });
    expect(/0D0F12|171A20|1E222A/i.test(html)).toBe(false);
    expect(html.toLowerCase()).toContain("background: #fff");
  });
});

test.describe("Scope containment — dark preference does not bleed onto other pages", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Dashboard stays visually light even while the Dark preference is active", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await selectTheme(page, "Dark");
    await page.evaluate(() => { window.location.hash = "#/dashboard"; });
    await page.waitForTimeout(400);
    const dataTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(dataTheme).toBe("dark"); // preference is still global/shared
    const darkScope = await page.evaluate(() => document.body.getAttribute("data-dark-scope"));
    expect(darkScope).toBeNull(); // but Dashboard has no dark styling scope active
  });
});

test.describe("Existing light mode is unchanged", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("default theme is still light with the original ivory shell background", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(theme).toBe("light");
    const bg = await page.locator(".rb2-shell").evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).toBe("rgb(250, 248, 243)");
  });
});
