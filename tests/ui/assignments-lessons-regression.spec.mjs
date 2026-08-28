// Regression protection for the Assignments & Lessons capability audit
// (2026-08-24). Every test here guards a CONFIRMED_IMPLEMENTED_BUT_BROKEN
// defect found and fixed during that audit — not new capability. See the
// audit report for full evidence. Do not extend this file to assert
// capabilities that were classified NOT_FOUND / PLACEHOLDER_ONLY /
// FIXTURE_OR_DEMO_ONLY in that audit (career/learn's live Explore/Recent
// data, curriculum/library's LessonPage content range, InstructorUnit
// routing, etc.) — those require new-build authorization, not a test.
import { test, expect } from "@playwright/test";

const CAREER = "http://localhost:5173/career.html";
const CURRICULUM = "http://localhost:5173/curriculum.html";

test.describe("Assignments page renders with real styling (not phantom .sb-*/.btn classes)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("career: Start button is visibly styled (not a bare unstyled link)", async ({ page }) => {
    await page.goto(`${CAREER}#/assignments`, { waitUntil: "networkidle" });
    const start = page.locator('section[aria-labelledby="open-assignments"]').getByRole("link", { name: "Start" }).first();
    await expect(start).toBeVisible();
    const bg = await start.evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)"); // not a bare unstyled <a>
  });

  test("curriculum: Start button is visibly styled (not a bare unstyled link)", async ({ page }) => {
    await page.goto(`${CURRICULUM}#/curriculum/asl/assignments`, { waitUntil: "networkidle" });
    const start = page.locator('section[aria-labelledby="open-assignments"]').getByRole("link", { name: "Start" }).first();
    await expect(start).toBeVisible();
    const bg = await start.evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  });
});

test.describe("Assignments -> Lesson navigation resolves to a real route (not the dashboard fallback)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("career: Start navigates to /learn/:id, not a redirect to /dashboard", async ({ page }) => {
    await page.goto(`${CAREER}#/assignments`, { waitUntil: "networkidle" });
    await page.locator('section[aria-labelledby="open-assignments"]').getByRole("link", { name: "Start" }).first().click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toMatch(/^#\/learn\//);
    await expect(page.getByRole("heading", { name: /Career Strategy/ })).toBeVisible();
  });

  test("curriculum: Start navigates to /curriculum/lesson/:id, not a redirect to the dashboard", async ({ page }) => {
    await page.goto(`${CURRICULUM}#/curriculum/asl/assignments`, { waitUntil: "networkidle" });
    await page.locator('section[aria-labelledby="open-assignments"]').getByRole("link", { name: "Start" }).first().click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toMatch(/^#\/curriculum\/lesson\//);
    // Correctly reaches the lesson route and shows its real empty state —
    // "Lesson not found" here is expected (no matching localStorage entry),
    // proving navigation itself works; it must NOT bounce to the dashboard.
    await expect(page.getByRole("heading", { name: "Lesson not found" })).toBeVisible();
  });
});

test.describe("Curriculum in-page navigation links carry the required /curriculum prefix", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("My Lessons: 'Open' link on an imported lesson resolves to /curriculum/lesson/:id", async ({ page }) => {
    await page.goto(`${CURRICULUM}#/curriculum/lessons`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("cur:lessons", JSON.stringify([{ id: "regr-1", title: "Regression Test Lesson" }]));
    });
    await page.reload({ waitUntil: "networkidle" });
    // Phase 1 correction (2026-08-27): this page now also lists real
    // canonical lessons (its own "Open" links, to /curriculum/lessons/:slug)
    // above the imported-lessons table — scope to the imported section
    // specifically rather than relying on DOM order.
    await page.locator('section[aria-label="Imported lessons"]').getByRole("link", { name: "Open" }).first().click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/curriculum/lesson/regr-1");
    await expect(page.getByRole("heading", { name: "Lesson not found" })).not.toBeVisible();
    await page.evaluate(() => localStorage.removeItem("cur:lessons"));
  });

  test("Lesson detail: 'Back to My Lessons' resolves to /curriculum/lessons, not the dashboard fallback", async ({ page }) => {
    await page.goto(`${CURRICULUM}#/curriculum/lesson/nonexistent`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /Back to My Lessons/ }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/curriculum/lessons");
    await expect(page.getByRole("heading", { name: "My Lessons" })).toBeVisible();
  });

  test("Career Learning Bridge: 'View all lessons' resolves to /curriculum/library/lessons, not the dashboard fallback", async ({ page }) => {
    await page.goto(`${CAREER}#/learn`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "View all lessons" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/curriculum/library/lessons");
  });

  test("Career Learning Bridge: 'Open Curriculum Dashboard' resolves to /curriculum/asl/dashboard", async ({ page }) => {
    await page.goto(`${CAREER}#/learn`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Open Curriculum Dashboard" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/curriculum/asl/dashboard");
  });
});

test.describe("Assignments mark-complete workflow still functions after the styling repair", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("marking an assignment complete moves it from Open to Completed", async ({ page }) => {
    await page.goto(`${CAREER}#/assignments`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Mark complete/ }).first().click();
    await expect(page.getByText("Nothing completed yet.")).not.toBeVisible();
    await expect(page.getByLabel("Completed").first()).toBeVisible();
  });
});

test.describe("Responsive containment", () => {
  for (const vp of [
    { name: "390x844", width: 390, height: 844 },
    { name: "768x1024", width: 768, height: 1024 },
    { name: "1024x768", width: 1024, height: 768 },
    { name: "1440x900", width: 1440, height: 900 },
  ]) {
    test.describe(vp.name, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test("career assignments: no horizontal overflow", async ({ page }) => {
        await page.goto(`${CAREER}#/assignments`, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
      });

      test("curriculum assignments: no horizontal overflow", async ({ page }) => {
        await page.goto(`${CURRICULUM}#/curriculum/asl/assignments`, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
      });
    });
  }
});
