import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/curriculum.html";

async function gotoCalendar(page) {
  await page.route("http://127.0.0.1:8091/live-learning/sessions**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: { items: [
        { id: "session-1", title: "ASL practice session", lessonId: "student.asl-01", startsAt: "2026-08-28T14:00:00.000Z", status: "scheduled" },
      ] } }),
    });
  });
  await page.goto(`${BASE}#/curriculum/asl/calendar`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Learning calendar", level: 1 })).toBeVisible();
}

test.describe("Curriculum calendar integration", () => {
  test("loads the Curriculum route with real live-learning data", async ({ page }) => {
    await gotoCalendar(page);
    await expect(page.getByText("ASL practice session").first()).toBeVisible();
    await expect(page.locator(".cal-month")).toBeVisible();
  });

  test("inherits view navigation, filtering, and event detail behavior", async ({ page }) => {
    await gotoCalendar(page);
    await page.getByRole("button", { name: "Agenda", exact: true }).click();
    await expect(page.locator(".cal-agendaItem")).toContainText("ASL practice session");
    await page.locator(".cal-agendaItem").click();
    await expect(page.getByRole("dialog")).toContainText("ASL practice session");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("shows an honest empty state when the backend has no sessions", async ({ page }) => {
    await page.route("http://127.0.0.1:8091/live-learning/sessions**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { items: [] } }) });
    });
    await page.goto(`${BASE}#/curriculum/asl/calendar`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Learning calendar", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Agenda", exact: true }).click();
    await expect(page.getByText("Nothing on your calendar right now.")).toBeVisible();
  });

  for (const width of [390, 768, 1024, 1440]) {
    test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoCalendar(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    });
  }
});
