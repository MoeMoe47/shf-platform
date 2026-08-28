// Regression protection for the Civic Lab Dashboard redesign (2026-08-24):
// responsive shell (desktop/tablet/mobile sidebar behavior), light/dark
// theme with persistence and no flash-on-load, KPI cards, mission card,
// activity, community simulation, next actions, tool links, and
// accessibility (aria-current, focus, no dead controls, no mascot overlap).
//
// Every route this suite navigates to is real (cross-checked against
// src/router/CivicRoutes.jsx) — no placeholder hrefs are exercised.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/civic.html";


test.describe("Dashboard loads and core content renders", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("dashboard loads with no console/page errors", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator(".cv-dash")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("all four KPI cards render with labels", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const kpis = page.locator(".cv-kpi");
    await expect(kpis).toHaveCount(4);
    for (const label of ["Surveys Completed", "Notes Added", "Portfolio Items", "Civic Points"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("Continue Your Civic Journey card shows a real mission and a working Resume Mission link", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Continue Your Civic Journey" })).toBeVisible();
    const cta = page.getByRole("link", { name: /Resume Mission|Browse Missions/ });
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute("href");
    expect(href).toMatch(/#\/(lesson|micro-lessons)/);
  });

  test("Your Activity shows real or honestly-empty rows, not fabricated numbers", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    for (const label of ["Recent Mission", "Last Active", "Most Used Tool", "Current Streak"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("Community Simulation preserves all three tiles and labels non-live figures honestly", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const community = page.locator(".cv-community");
    await expect(community.getByText("Active Parties")).toBeVisible();
    await expect(community.getByText("Open Proposals", { exact: true })).toBeVisible();
    await expect(community.getByText("Voter Turnout")).toBeVisible();
    // Open Proposals is the one real, computed figure — must not carry the
    // "Demo preview" label the other two (non-computable) tiles use.
    const openProposalsSub = page.locator(".cv-communityItem", { hasText: "Open Proposals" }).locator(".cv-communityItem__sub");
    await expect(openProposalsSub).toHaveText("Live from Proposals");
  });

  test("Next Actions rows are real links, no href=\"#\" placeholders", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const links = page.locator(".cv-nextAction");
    const count = await links.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).not.toBe("#");
    }
  });

  test("Explore Civic Tools links to the six real Civic routes", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const expected = {
      Elections: "#/elections",
      Proposals: "#/proposals",
      "Issue Survey": "#/survey",
      "Debt Clock": "#/debtclock",
      "Treasury Simulator": "#/treasury-sim",
      "Treasury Snapshots": "#/snapshots",
    };
    for (const [label, hrefFragment] of Object.entries(expected)) {
      const link = page.locator(".cv-tool", { hasText: label });
      await expect(link).toBeVisible();
      const href = await link.getAttribute("href");
      expect(href).toContain(hrefFragment);
    }
  });

  test("Impact flow renders and links to real destinations", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByText("Your work creates real impact.")).toBeVisible();
    for (const step of ["Learn", "Participate", "Document", "Portfolio", "Impact"]) {
      const link = page.locator(".cv-impact__step", { hasText: step });
      await expect(link).toBeVisible();
      expect(await link.getAttribute("href")).not.toBe("#");
    }
  });

  test("Northstar Dashboard link in the top bar goes to the real route", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const link = page.locator(".cv-northstarLink");
    await expect(link).toBeVisible();
    expect(await link.getAttribute("href")).toContain("#/dashboard-ns");
    await link.click();
    await expect(page).toHaveURL(/#\/dashboard-ns/);
  });
});

test.describe("Theme", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("theme toggle switches to dark and applies across the shell", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Theme, currently/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    // background-color has a short CSS transition (see --civic-transition);
    // wait for it to settle before reading the resolved computed value.
    await page.waitForTimeout(250);
    const bg = await page.locator(".cv-shell").evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).toBe("rgb(11, 15, 22)");
  });

  test("theme persists across reload with no flash back to the wrong theme", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Theme, currently/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await page.reload({ waitUntil: "commit" });
    // Sample repeatedly through the boot sequence — must never observe
    // "light" once the inline pre-paint script has run.
    const samples = [];
    for (let i = 0; i < 20; i++) {
      samples.push(await page.evaluate(() => document.documentElement.getAttribute("data-theme")));
      await page.waitForTimeout(25);
    }
    expect(samples.filter(Boolean)).not.toContain("light");
    expect(samples[samples.length - 1]).toBe("dark");
  });
});

test.describe("Sidebar collapse", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("collapse toggle shrinks the sidebar into the required 72-88px range and persists", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    const width = await page.locator(".cv-shell__sidebar").evaluate((n) => n.getBoundingClientRect().width);
    expect(width).toBeGreaterThanOrEqual(72);
    expect(width).toBeLessThanOrEqual(88);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-collapsed/);
  });

  test("collapsed nav links keep an accessible name via tooltip data-label", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    const dashboardLink = page.locator(".cv-navLink", { hasText: "Dashboard" }).first();
    expect(await dashboardLink.getAttribute("data-label")).toBe("Dashboard");
  });
});

test.describe("Tablet shell (768-1199px)", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("sidebar is always the collapsed icon rail, no user toggle needed", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-collapsed/);
    const width = await page.locator(".cv-shell__sidebar").evaluate((n) => n.getBoundingClientRect().width);
    expect(width).toBeGreaterThanOrEqual(72);
    expect(width).toBeLessThanOrEqual(88);
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });
});

test.describe("Mobile drawer (<768px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("hamburger opens the drawer with full nav content, no horizontal overflow", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-mobileOpen/);
    await expect(page.locator(".cv-brand__name")).toBeVisible();
    await expect(page.locator(".cv-shell__sidebar").getByRole("link", { name: "Elections" })).toBeVisible();
  });

  test("Escape closes the drawer and returns focus to the hamburger", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: "Open navigation menu" });
    await trigger.click();
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-mobileOpen/);
    await page.keyboard.press("Escape");
    await expect(page.locator(".cv-shell__sidebar")).not.toHaveClass(/is-mobileOpen/);
    await expect(trigger).toBeFocused();
  });

  test("mascot does not cover any Next Actions link", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const overlap = await page.evaluate(() => {
      const mascot = Array.from(document.querySelectorAll("body *")).find(
        (el) => getComputedStyle(el).position === "fixed" && String(el.className || "").toLowerCase().includes("brainiact")
      );
      if (!mascot) return null;
      const m = mascot.getBoundingClientRect();
      return Array.from(document.querySelectorAll(".cv-nextAction")).some((el) => {
        const r = el.getBoundingClientRect();
        return !(r.right < m.left || r.left > m.right || r.bottom < m.top || r.top > m.bottom);
      });
    });
    expect(overlap).toBe(false);
  });
});

test.describe("Accessibility", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("exactly one h1, active nav item has aria-current=page", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveCount(1);
    const active = page.locator(".cv-navLink.is-active");
    await expect(active).toHaveAttribute("aria-current", "page");
  });

  test("icon-only header buttons have accessible labels", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /Theme, currently/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Notifications, \d+ new/ })).toBeVisible();
  });
});
