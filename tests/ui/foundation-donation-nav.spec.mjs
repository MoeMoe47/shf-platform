import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5191";
for (const width of [1440, 1280, 768, 390]) {
  test(`Donation section navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${origin}/foundation.html#/get-involved`);
    const nav = page.getByRole("navigation", {
      name: "Donation page sections",
    });
    await expect(nav).toHaveCount(1);
    await expect(nav.locator("button,a")).toHaveCount(5);
    await expect(
      nav.getByRole("button", { name: "Make a Gift" }),
    ).toHaveAttribute("aria-current", "location");
    for (const [label, id] of [
      ["Ways to Give", "ways-to-give"],
      ["Where It Goes", "where-it-goes"],
      ["Make a Gift", "make-a-gift"],
    ]) {
      const button = nav.getByRole("button", { name: label });
      await button.click();
      await expect(page.locator(`#${id}`)).toBeFocused();
      await expect(button).toHaveAttribute("aria-current", "location");
      const top = await page
        .locator(`#${id}`)
        .evaluate((n) => n.getBoundingClientRect().top);
      const header = await page
        .locator(".shf-institutional-header")
        .boundingBox();
      expect(top).toBeGreaterThanOrEqual(header.height + 15);
      expect(top).toBeLessThanOrEqual(header.height + 17);
      await expect(page).toHaveURL(/#\/get-involved$/);
      await button.focus();
      await button.press("Space");
      await expect(page.locator(`#${id}`)).toBeFocused();
      await button.focus();
      await button.press("Enter");
      await expect(page.locator(`#${id}`)).toBeFocused();
    }
    for (const control of await nav.locator("button,a").all()) {
      await control.focus();
      await expect(control).toBeFocused();
      expect(
        await control.evaluate((n) => getComputedStyle(n).outlineStyle),
      ).not.toBe("none");
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await nav.scrollIntoViewIfNeeded();
    await mkdir("docs/ui/foundation-donation/screenshots/section-03", {
      recursive: true,
    });
    await nav.screenshot({
      path: `docs/ui/foundation-donation/screenshots/section-03/nav-${width}.png`,
    });
    await nav.getByRole("link", { name: "Partner With Us" }).press("Enter");
    await expect(page).toHaveURL(/#\/partners$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Work with SHF",
    );
    await page.goto(`${origin}/foundation.html#/get-involved`);
    await nav.getByRole("link", { name: "Impact Stories" }).press("Enter");
    await expect(page).toHaveURL(/#impact$/);
    await expect(page.locator("#impact")).toBeVisible();
  });
}
