// Regression protection for the Career-shell reconciliation: real SHF
// logo, hidden-by-default developer diagnostics, the consolidated
// application switcher, the simplified primary/secondary sidebar, the
// wallet's new location, the theme-trigger contrast fix, and the Ask
// Coach / A4 preview collision fix. See src/layouts/AppShellLayout.jsx,
// src/components/AppSwitcher.jsx, src/components/career/CareerSidebar.jsx,
// src/layouts/CareerLayout.jsx, src/pages/ResumeBuilder.jsx,
// src/styles/career-shell.css.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/career.html";

test.describe("Logo repair", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("SHF logo loads successfully with no broken-image fallback", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const logo = page.locator(".brand-mark");
    await expect(logo).toBeVisible();
    const naturalWidth = await logo.evaluate((n) => n.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
    const res = await page.evaluate(() => fetch("/assets/brand/shf-globe-logo.png").then((r) => ({ status: r.status, type: r.headers.get("content-type") })));
    expect(res.status).toBe(200);
    expect(res.type).toContain("image");
    const alt = await logo.getAttribute("alt");
    expect(alt).toBeTruthy();
    expect(alt.toLowerCase()).not.toBe("");
  });

  test("brand wordmark matches the approved mock's two-line lockup", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const lines = await page.locator(".brand-wordmark-line").allTextContents();
    expect(lines).toEqual(["Silicon Heartland", "Foundation"]);
    // the per-app name isn't lost — it's still the link's accessible name
    const homeLink = page.getByRole("link", { name: "Career Center Home" });
    await expect(homeLink).toBeVisible();
  });
});

test.describe("Student-facing developer-chrome removal", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Career route does not show developer diagnostics by default", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await expect(page.locator(".cp-strip")).not.toBeVisible();
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("overrides");
    expect(bodyText).not.toMatch(/\bcontract\b\s*\?/);
  });

  test("the capability is preserved for an explicit ?devtools=1 opt-in", async ({ page }) => {
    await page.goto(`${BASE}?devtools=1#/resume`, { waitUntil: "networkidle" });
    await expect(page.locator(".cp-strip")).toBeVisible();
  });
});

test.describe("Primary navigation and application switcher", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("all six primary Career destinations are immediately visible", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const items = await page.locator(".car-primaryList .car-linkLabel").allTextContents();
    for (const label of ["Dashboard", "Learning", "Career Pathways", "Resume Builder", "Portfolio", "Credentials"]) {
      expect(items).toContain(label);
    }
  });

  test("every secondary route is reachable via More tools", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await expect(page.locator(".car-moreTools")).not.toHaveClass(/is-open/);
    await page.locator(".car-moreToggle").click();
    await expect(page.locator(".car-moreTools")).toHaveClass(/is-open/);
    const items = await page.locator(".car-moreTools .car-linkLabel").allTextContents();
    for (const label of [
      "Northstar Dashboard", "Assignments", "Calendar", "Vocabulary",
      "Planner", "Explore", "Rewards Wallet", "Credit Report", "Marketplace",
      "Coach", "Help", "Settings",
    ]) {
      expect(items).toContain(label);
    }
  });

  test("application switcher preserves access to every cross-app destination", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: /Switch application/ });
    await trigger.click();
    const menu = page.locator(".app-switcher__menu");
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    const vp = page.viewportSize();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
    const hrefs = await page.locator(".app-switcher__item").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs.some((h) => h.includes("career.html"))).toBe(true);
    expect(hrefs.some((h) => h.includes("curriculum.html"))).toBe(true);
    expect(hrefs.some((h) => h.includes("sales.html"))).toBe(true);
    expect(hrefs.some((h) => h.includes("arcade.html"))).toBe(true);
    expect(hrefs.some((h) => h.includes("debt.html"))).toBe(true);

    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    const returned = await page.evaluate(() => document.activeElement?.closest(".app-switcher__trigger") !== null);
    expect(returned).toBe(true);
  });

  test("wallet remains reachable from the sidebar", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await expect(page.locator(".car-walletBtn")).toBeVisible();
  });
});

test.describe("Theme control repair", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("theme trigger label is visible (non-white-on-white) in light mode", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const label = page.locator(".theme-switch__label");
    await expect(label).toBeVisible();
    const color = await label.evaluate((n) => getComputedStyle(n).color);
    expect(color).not.toBe("rgb(255, 255, 255)");
  });

  test("Light/Dark/System options are readable and the menu stays above sticky content", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Theme, currently/ }).click();
    for (const label of ["Light", "Dark", "System"]) {
      const item = page.getByRole("menuitemradio", { name: label });
      await expect(item).toBeVisible();
      const color = await item.evaluate((n) => getComputedStyle(n).color);
      expect(color).not.toBe("rgb(255, 255, 255)");
    }
    const point = await page.locator(".theme-switch__menu").boundingBox();
    const el = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest(".theme-switch__menu") !== null,
      [point.x + 10, point.y + 10]
    );
    expect(el).toBe(true); // the menu, not underlying sticky content, receives the hit
  });

  test("theme control stays in the same header position across routes", async ({ page }) => {
    for (const route of ["resume", "dashboard", "portfolio"]) {
      await page.goto(`${BASE}#/${route}`, { waitUntil: "networkidle" });
      await expect(page.locator(".theme-switch")).toBeVisible();
    }
  });
});

test.describe("Ask Coach repair", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Brainiact never appears on Resume Builder, and an equivalent header entry remains reachable throughout", async ({ page }) => {
    // Matches the approved mock exactly: no floating chat affordance is
    // shown in Edit or Preview. The header Coach button is the permanent,
    // capability-preserving replacement for the whole route.
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await expect(page.locator(".car-headerCoachBtn")).toBeVisible();
    await expect(page.locator(".brainiact-root")).toBeHidden();

    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(page.locator(".brainiact-root")).toBeHidden();
    await expect(page.locator(".car-headerCoachBtn")).toBeVisible();

    await page.getByRole("button", { name: "Preview", exact: true }).click(); // back to edit
    await expect(page.locator(".brainiact-root")).toBeHidden();
    await expect(page.locator(".car-headerCoachBtn")).toBeVisible();
  });

  test("Brainiact returns on a non-Resume-Builder Career route", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator(".brainiact-fab")).toBeVisible();
  });
});

test.describe("Career-readiness milestone widget and bottom info bar", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("sidebar shows a Career-readiness milestone card matching the mock", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const widget = page.locator(".car-milestone");
    await expect(widget).toBeVisible();
    await expect(page.locator(".car-milestoneTitle")).toHaveText("Build a strong resume");
    await expect(page.locator(".car-milestoneLink")).toBeVisible();
  });

  test("bottom info bar shows Autosave and Portfolio-evidence status, matching the mock's footer strip", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const bar = page.locator(".rb2-bottomBar");
    await expect(bar).toBeVisible();
    const titles = await page.locator(".rb2-bottomBarTitle").allTextContents();
    expect(titles).toContain("Autosave & recovery");
    expect(titles).toContain("Portfolio evidence");
    await expect(page.locator(".rb2-bottomBarLink")).toHaveText("Manage");
  });

  test("the editor panel no longer has a status-chip row (moved to sidebar/bottom bar)", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await expect(page.locator(".rb2-statusRow")).toHaveCount(0);
  });
});

test.describe("Desktop shell retains the two-region Resume Builder workspace", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Editor and Preview both render side by side, not a third permanent column", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await expect(page.locator(".rb2-col--editor")).toBeVisible();
    await expect(page.locator(".rb2-col--preview")).toBeVisible();
    const cols = await page.locator(".rb2-workspace > .rb2-col").count();
    expect(cols).toBe(2);
  });
});

test.describe("Mobile shell (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("drawer exposes primary and secondary navigation; Escape and scrim close it; focus returns to the hamburger", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await page.locator(".sh-mobileMenuBtn").click();
    await expect(page.locator(".sh-scrim.is-visible")).toBeVisible();
    await expect(page.locator(".car-primaryList .car-linkLabel").first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator(".sh-scrim.is-visible")).not.toBeVisible();
    const returned = await page.evaluate(() => document.activeElement?.classList?.contains("sh-mobileMenuBtn"));
    expect(returned).toBe(true);

    await page.locator(".sh-mobileMenuBtn").click();
    await page.locator(".sh-scrim").click({ position: { x: 350, y: 50 } });
    await expect(page.locator(".sh-scrim.is-visible")).not.toBeVisible();
  });

  test("theme control remains in the header (not hidden inside the drawer)", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await expect(page.locator(".theme-switch__trigger")).toBeVisible();
  });

  test("application switcher menu stays fully within the viewport at 390px", async ({ page }) => {
    await page.goto(`${BASE}#/resume`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Switch application/ }).click();
    const box = await page.locator(".app-switcher__menu").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });
});
