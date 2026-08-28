// Regression protection for the SHF Career Calendar
// (src/pages/career/CareerCalendar.jsx and src/pages/career/calendar/*).
// Curriculum has a separate domain adapter over the same view primitives;
// this suite remains focused on Career behavior.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/career.html";

async function gotoCalendar(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}#/calendar`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Calendar", level: 1 })).toBeVisible();
  return errors;
}

async function selectTheme(page, label) {
  await page.getByRole("button", { name: /Theme, currently/ }).click();
  await expect(page.locator(".theme-switch__menu")).toBeVisible();
  await page.getByRole("menuitemradio", { name: new RegExp(label) }).click();
}

test.describe("Canonical route + no-crash", () => {
  test("route resolves, mounts once, and throws no page errors", async ({ page }) => {
    const errors = await gotoCalendar(page);
    await expect(page.locator(".sh-shell")).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("hard refresh re-renders the same page", async ({ page }) => {
    await gotoCalendar(page);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Calendar", level: 1 })).toBeVisible();
  });

  test("existing Career routes remain operational", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Career Center" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("Toolbar: Today / navigation / views", () => {
  test("Today button and prev/next update the visible period", async ({ page }) => {
    await gotoCalendar(page);
    const label = page.locator(".cal-periodLabel");
    const initial = await label.textContent();

    await page.getByRole("button", { name: "Previous month" }).click();
    await expect(label).not.toHaveText(initial);

    await page.getByRole("button", { name: "Today" }).click();
    await expect(label).toHaveText(initial);
  });

  test("month navigation crosses a year boundary correctly", async ({ page }) => {
    await gotoCalendar(page);
    for (let i = 0; i < 12; i++) {
      await page.getByRole("button", { name: "Next month" }).click();
    }
    // 12 months forward always lands on the same month name, next year —
    // regardless of what "today" is when this test runs.
    const today = new Date();
    const expectedYear = today.getFullYear() + 1;
    await expect(page.locator(".cal-periodLabel")).toContainText(String(expectedYear));
  });

  test("Month, Week and Agenda views each render their own region", async ({ page }) => {
    await gotoCalendar(page);
    await expect(page.locator(".cal-month")).toBeVisible();

    await page.getByRole("button", { name: "Week" }).click();
    await expect(page.locator(".cal-week")).toBeVisible();

    await page.getByRole("button", { name: "Agenda", exact: true }).click();
    await expect(page.locator(".cal-agenda, .cal-emptyState")).toBeVisible();
  });
});

test.describe("Event selection and detail dialog", () => {
  test("selecting an event opens an accessible dialog with its title", async ({ page }) => {
    await gotoCalendar(page);
    await page.getByRole("button", { name: "Agenda", exact: true }).click();
    const firstItem = page.locator(".cal-agendaItem").first();
    await expect(firstItem).toBeVisible();
    const title = await firstItem.locator(".cal-agendaTitle").textContent();

    await firstItem.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(title.trim());
  });

  test("Escape closes the dialog and returns focus to the triggering event", async ({ page }) => {
    await gotoCalendar(page);
    await page.getByRole("button", { name: "Agenda", exact: true }).click();
    const firstItem = page.locator(".cal-agendaItem").first();
    await firstItem.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(firstItem).toBeFocused();
  });

  test("dialog stays fully within the viewport and above Ask Coach", async ({ page }) => {
    await gotoCalendar(page);
    await page.getByRole("button", { name: "Agenda", exact: true }).click();
    await page.locator(".cal-agendaItem").first().click();
    const dialog = page.getByRole("dialog");
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);

    const dialogZ = await dialog.evaluate((el) => Number(getComputedStyle(el.closest(".cal-dialogScrim")).zIndex));
    const coachZ = await page.evaluate(() => {
      const el = document.querySelector(".brainiact-root, .brainiact-fab");
      return el ? Number(getComputedStyle(el).zIndex) : 0;
    });
    expect(dialogZ).toBeGreaterThan(coachZ);
  });
});

test.describe("Filtering", () => {
  test("filtering to Assignments shows only assignment events", async ({ page }) => {
    await gotoCalendar(page);
    await page.getByRole("button", { name: "Agenda", exact: true }).click();
    await page.getByRole("button", { name: "Assignments" }).click();
    const labels = page.locator(".cal-agendaTypeLabel");
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(labels.nth(i)).toHaveText("Assignment");
    }
  });

  test("filtering to a source with no events shows the empty-filter state, not a blank calendar", async ({ page }) => {
    await gotoCalendar(page);
    await page.getByRole("button", { name: "Agenda", exact: true }).click();
    // Arcade and Credentials are registered as explicit empty providers
    // (see adapters.js) — filtering to them must explain why, not go blank.
    await page.getByRole("button", { name: "Arcade" }).click();
    await expect(page.getByText("No events match your filters.")).toBeVisible();
  });
});

test.describe("Personal reminders: validation + persistence", () => {
  test("submitting an empty title shows an accessible validation error", async ({ page }) => {
    await gotoCalendar(page);
    await page.getByRole("button", { name: "+ Personal reminder" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Title is required.")).toBeVisible();
  });

  test("a saved reminder persists across a hard refresh, then can be deleted", async ({ page }) => {
    await gotoCalendar(page);
    await page.getByRole("button", { name: "+ Personal reminder" }).click();
    await page.getByLabel("Title").fill("Playwright test reminder");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    const upcomingItem = page.locator(".cal-upcomingItemTitle", { hasText: "Playwright test reminder" });
    await expect(upcomingItem).toBeVisible();

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".cal-upcomingItemTitle", { hasText: "Playwright test reminder" })).toBeVisible();

    await page.locator(".cal-upcomingItemBtn", { hasText: "Playwright test reminder" }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator(".cal-upcomingItemTitle", { hasText: "Playwright test reminder" })).toHaveCount(0);
  });
});

test.describe("Theme", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Dark applies to the Calendar page and persists across refresh", async ({ page }) => {
    await gotoCalendar(page);
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
    await expect.poll(() => page.evaluate(() => document.body.getAttribute("data-dark-scope"))).toContain("calendar");

    await page.reload({ waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
    // Dark-scope is set by the mounted page's own effect, not persisted —
    // confirm it's re-applied on the fresh mount rather than assuming carryover.
    await expect.poll(() => page.evaluate(() => document.body.getAttribute("data-dark-scope"))).toContain("calendar");
  });

  test("leaving the Calendar clears its dark-scope so other pages aren't affected", async ({ page }) => {
    await gotoCalendar(page);
    await selectTheme(page, "Dark");
    await expect.poll(() => page.evaluate(() => document.body.getAttribute("data-dark-scope"))).toContain("calendar");

    // A real in-app navigation (not page.goto, which can behave like a fresh
    // navigation rather than an SPA route change) — click the shared header's
    // brand link, exactly as a student would.
    await page.locator(".brand-link").click();
    await expect(page.getByRole("heading", { name: "Career Center" })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.body.getAttribute("data-dark-scope") || ""))
      .not.toContain("calendar");
  });

  test("System theme follows OS color-scheme live", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await gotoCalendar(page);
    await selectTheme(page, "System");
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.emulateMedia({ colorScheme: "light" });
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
  });
});

test.describe("Responsive", () => {
  test("no horizontal overflow at 390px, agenda-first mobile layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoCalendar(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
    const targetBox = await page.getByRole("button", { name: "Today" }).boundingBox();
    expect(targetBox.height).toBeGreaterThanOrEqual(44);
  });

  test("no horizontal overflow at 768x1024", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await gotoCalendar(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test("no horizontal overflow at 1024x768", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await gotoCalendar(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test("no horizontal overflow at 1440x900, upcoming rail visible", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoCalendar(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
    await expect(page.locator(".cal-upcomingRail")).toBeVisible();
  });
});
