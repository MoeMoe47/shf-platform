import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5191";
for (const width of [1440, 1280, 768, 390]) {
  test(`Trust and Transparency at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/foundation.html#/get-involved`);
    const section = page.getByRole("region", {
      name: "Your Support. Our Responsibility.",
    });
    await expect(section).toBeVisible();
    await expect(
      section.getByRole("group", {
        name: "Foundation transparency information",
      }),
    ).toHaveCount(1);
    for (const title of ["Financial Reports", "Governance Overview"]) {
      const action = section.getByRole("button", { name: title, exact: true });
      await expect(action).toHaveAttribute("aria-haspopup", "dialog");
      await action.focus();
      await action.press("Enter");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("heading")).toHaveText(title);
      await page.keyboard.press("Escape");
      await expect(action).toBeFocused();
      await action.press("Space");
      await dialog.getByRole("button", { name: "Close and return" }).click();
      await expect(action).toBeFocused();
    }
    for (const action of await section.locator("button,a").all()) {
      await action.focus();
      await expect(action).toBeFocused();
      const box = await action.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      expect(
        await action.evaluate((n) => getComputedStyle(n).outlineStyle),
      ).not.toBe("none");
    }
    expect(
      await section
        .locator(".shf-transparency-actions")
        .evaluate(
          (n) => getComputedStyle(n).gridTemplateColumns.split(" ").length,
        ),
    ).toBe(width > 600 ? 3 : 1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await expect(page.locator(".shf-final-cta")).toHaveCount(1);
    await expect(page.locator(".shf-footer")).toHaveCount(1);
    expect(
      await page
        .locator(".shf-main")
        .evaluate((n) =>
          n.nextElementSibling.classList.contains("shf-final-cta"),
        ),
    ).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await mkdir("docs/ui/foundation-donation/screenshots/section-07", {
      recursive: true,
    });
    await section.screenshot({
      path: `docs/ui/foundation-donation/screenshots/section-07/transparency-${width}.png`,
    });
    await section
      .getByRole("link", { name: "Impact Reporting", exact: true })
      .press("Enter");
    await expect(page).toHaveURL(/#\/reports$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Public information should be clear about what it knows.",
    );
  });
}
