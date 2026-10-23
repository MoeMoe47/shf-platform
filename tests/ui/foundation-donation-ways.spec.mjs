import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5191";
const titles = [
  "One-Time Gift",
  "Monthly Giving",
  "Corporate Support",
  "Grants & Foundations",
  "Employer Partnerships",
  "Planned Giving",
];
for (const width of [1440, 1280, 768, 390]) {
  test(`Ways to Give cards and actions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${origin}/foundation.html#/get-involved`);
    const section = page.getByRole("region", {
      name: "More Ways to Make an Impact.",
    });
    await expect(section.getByRole("article")).toHaveCount(6);
    for (const title of titles) {
      const article = section.getByRole("article", {
        name: title,
        exact: true,
      });
      await expect(article.getByRole("heading", { level: 3 })).toHaveText(
        title,
      );
      const image = article.getByRole("img");
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate((n) => n.complete && n.naturalWidth === 1536),
        )
        .toBe(true);
      const control = article.locator("button,a");
      await expect(control).toHaveAccessibleName(title);
      await control.focus();
      await expect(control).toBeFocused();
      const box = await control.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(
        await control.evaluate((n) => getComputedStyle(n).outlineStyle),
      ).not.toBe("none");
    }
    expect(
      await section
        .locator(".shf-giving-cards")
        .evaluate(
          (n) => getComputedStyle(n).gridTemplateColumns.split(" ").length,
        ),
    ).toBe(width > 1100 ? 3 : width > 600 ? 2 : 1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const gift = section.getByRole("button", {
      name: "One-Time Gift",
      exact: true,
    });
    await gift.press("Enter");
    await expect(page.getByLabel("Custom Amount")).toBeFocused();
    await gift.press("Space");
    await expect(page.getByLabel("Custom Amount")).toBeFocused();
    for (const title of [
      "Monthly Giving",
      "Grants & Foundations",
      "Planned Giving",
    ]) {
      const action = section.getByRole("button", { name: title, exact: true });
      await action.press("Enter");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("heading")).toHaveText(title);
      await page.keyboard.press("Escape");
      await expect(action).toBeFocused();
      await action.click();
      await dialog.getByRole("button", { name: "Close and return" }).click();
      await expect(action).toBeFocused();
    }
    await page.evaluate(() => document.fonts.ready);
    await mkdir("docs/ui/foundation-donation/screenshots/section-05", {
      recursive: true,
    });
    await section.screenshot({
      path: `docs/ui/foundation-donation/screenshots/section-05/ways-${width}.png`,
    });
    for (const title of ["Corporate Support", "Employer Partnerships"]) {
      await section
        .getByRole("link", { name: title, exact: true })
        .press("Enter");
      await expect(page).toHaveURL(/#\/partners$/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Work with SHF",
      );
      await page.goto(`${origin}/foundation.html#/get-involved`);
    }
  });
}
