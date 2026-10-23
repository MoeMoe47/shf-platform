import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5191";
for (const width of [1440, 1280, 768, 390]) {
  test(`Where Your Gift Goes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/foundation.html#/get-involved`);
    const section = page.getByRole("region", {
      name: "Focused on Lasting Impact.",
    });
    await expect(section).toBeVisible();
    const image = section.getByRole("img");
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute(
      "src",
      "/assets/foundation/donation/donation-impact-banner.webp",
    );
    await expect
      .poll(() => image.evaluate((n) => n.complete && n.naturalWidth === 2007))
      .toBe(true);
    const imageBox = await image.boundingBox();
    expect(imageBox.width / imageBox.height).toBeCloseTo(2007 / 783, 1);
    await expect(
      section
        .getByRole("list", { name: "Impact and support categories" })
        .getByRole("listitem"),
    ).toHaveCount(6);
    await expect(section.locator(".shf-donation-handwritten")).toHaveCount(0);
    const hidden = section.locator(".shf-donation-sr-only");
    const hiddenBox = await hidden.boundingBox();
    expect(hiddenBox.width).toBeLessThanOrEqual(1);
    expect(hiddenBox.height).toBeLessThanOrEqual(1);
    const cta = section.getByRole("link", { name: "Our Impact", exact: true });
    await cta.focus();
    await expect(cta).toBeFocused();
    expect(
      await cta.evaluate((n) => getComputedStyle(n).outlineStyle),
    ).not.toBe("none");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(await section.evaluate((n) => n.previousElementSibling.id)).toBe(
      "ways-to-give",
    );
    expect(
      await section.evaluate((n) =>
        n.nextElementSibling.classList.contains("shf-donation-transparency"),
      ),
    ).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await mkdir("docs/ui/foundation-donation/screenshots/section-06", {
      recursive: true,
    });
    await section.screenshot({
      path: `docs/ui/foundation-donation/screenshots/section-06/impact-${width}.png`,
    });
    await cta.press("Enter");
    await expect(page).toHaveURL(/#impact$/);
    await expect(page.locator("#impact")).toBeVisible();
  });
}
