import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = String(process.env.SHS_TEST_FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, "src/content/curriculum/data-center-pathway-map.json"), "utf8"));
const LESSON_ROOT = path.join(ROOT, "src/content/lessons/data-center-design-8-student");
const gradeEight = MAP.courses.find((course) => course.courseId === "data-center-design-8");
const lessons = gradeEight.lessonIds.map((id) => ({ id, ...JSON.parse(fs.readFileSync(path.join(LESSON_ROOT, `${id}.json`), "utf8")) }));

function lessonUrl(id) {
  return `${BASE}/curriculum.html#/curriculum/lessons/${encodeURIComponent(id)}`;
}

test.describe("Grade 8 Data Center lesson routes", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("all canonical lessons render without fatal browser errors", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    for (const lesson of lessons) {
      await page.goto(lessonUrl(lesson.id), { waitUntil: "networkidle" });
      await expect(page).toHaveURL(new RegExp(`curriculum\\.html#/curriculum/lessons/${lesson.id}$`));
      await expect(page.getByRole("heading", { name: lesson.title, exact: true })).toBeVisible();
      await expect(page.getByRole("tablist", { name: "Lesson guided stages" })).toBeVisible();
      await expect(page.getByText("Completion Check", { exact: true })).toBeVisible();
      await expect(page.getByText("Not Found", { exact: true })).toHaveCount(0);
    }
    expect(pageErrors).toEqual([]);
  });

  test("sequential navigation reaches every lesson and stops before Grade 9", async ({ page }) => {
    for (let index = 0; index < lessons.length; index += 1) {
      await page.goto(lessonUrl(lessons[index].id), { waitUntil: "networkidle" });
      await page.getByRole("tab", { name: "Complete" }).click();
      if (index < lessons.length - 1) {
        await page.getByRole("link", { name: /Go to next lesson/ }).click();
        await expect(page).toHaveURL(new RegExp(`curriculum\\.html#/curriculum/lessons/${lessons[index + 1].id}$`));
      } else {
        await expect(page.getByRole("link", { name: /Go to next lesson/ })).toHaveCount(0);
        await expect(page.getByText("You've reached the end of the guided stages for this lesson.", { exact: false })).toBeVisible();
      }
    }
  });

  test("design project exposes accessible deliverables and decision rubric", async ({ page }) => {
    const project = lessons.at(-1);
    await page.goto(lessonUrl(project.id), { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "Apply" }).click();
    await expect(page.getByText("written design brief with a labeled systems diagram", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Assess" }).click();
    await expect(page.getByText("Integrated design reasoning", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Reflect" }).click();
    await expect(page.getByText(/^Reflection:/)).toBeVisible();
  });

  test("representative design lessons remain usable on tablet and mobile", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(lessonUrl(lessons[1].id), { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1)).toBe(false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(lessonUrl(lessons.at(-1).id), { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1)).toBe(false);
    await expect(page.getByRole("button", { name: "Mark Lesson Complete" })).toBeVisible();
  });

  test("completion control is keyboard operable", async ({ page }) => {
    await page.goto(lessonUrl(lessons[0].id), { waitUntil: "networkidle" });
    const completion = page.getByRole("button", { name: "Mark Lesson Complete" });
    await completion.focus();
    await expect(completion).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /Lesson Complete/ })).toBeVisible();
  });
});
