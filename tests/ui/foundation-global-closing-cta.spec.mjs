import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5183";
const routes = [
  "",
  "#/mission",
  "#/about",
  "#/programs",
  "#/partners",
  "#/get-involved",
  "#/reports",
  "#/data-center-community-impact",
  "#/county/franklin",
];
const screenshots = "docs/foundation/global-closing-cta-verification";

for (const width of [1440, 1280, 768, 390]) {
  for (const route of routes) {
    test(`canonical Foundation ending ${route || "home"} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${origin}/foundation.html${route}`);
      const cta = page.getByRole("region", {
        name: "Support the Silicon Heartland Foundation",
      });
      await expect(cta).toHaveCount(1);
      await expect(page.locator(".shf-footer")).toHaveCount(1);
      await expect(page.locator(".shf-institutional-header")).toHaveCount(1);
      await expect(page.locator(".shf-main > .shf-final-cta")).toHaveCount(0);
      expect(
        await cta.evaluate((node) => node.previousElementSibling.tagName),
      ).toBe("MAIN");
      expect(
        await cta.evaluate((node) =>
          node.nextElementSibling.matches("footer.shf-footer"),
        ),
      ).toBe(true);
      await expect(cta.getByRole("heading", { level: 2 })).toHaveText(
        "Invest in People. Strengthen Communities.",
      );
      await expect(
        cta.getByRole("link", { name: "Support SHF" }),
      ).toHaveAttribute("href", "#/get-involved");
      await expect(
        cta.getByRole("link", { name: "Partner With Us" }),
      ).toHaveAttribute("href", "#/partners");
      await expect(page.locator(".shf-footer img")).toHaveAttribute(
        "src",
        "/assets/brand/shf-official-logo.webp",
      );
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() =>
          document.fonts.check('20px "SHF Permanent Marker"'),
        ),
      ).toBe(true);
      await cta.scrollIntoViewIfNeeded();
      const dimensions = await cta.evaluate((node) => ({
        viewport: innerWidth,
        document: document.documentElement.scrollWidth,
        background: getComputedStyle(node).backgroundImage,
        font: getComputedStyle(node.querySelector("h2")).fontFamily,
      }));
      expect(dimensions.background).toContain("shf-footer-landscape-light");
      expect(dimensions.font).toContain("SHF Permanent Marker");
      expect(
        await cta
          .locator(".shf-btn--primary")
          .evaluate((node) => getComputedStyle(node).color),
      ).toBe("rgb(6, 26, 48)");
      if (width <= 768) {
        expect(
          await cta.evaluate((node) => getComputedStyle(node).backgroundSize),
        ).toBe("auto, 100%");
      }
      expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
      for (const link of await cta.getByRole("link").all()) {
        const box = await link.boundingBox();
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      }
      if (!route) {
        await mkdir(screenshots, { recursive: true });
        const box = await cta.boundingBox();
        const footer = await page.locator(".shf-footer").boundingBox();
        await page.screenshot({
          path: `${screenshots}/ending-${width}.png`,
          fullPage: true,
          clip: {
            x: 0,
            y: box.y + (await page.evaluate(() => scrollY)),
            width,
            height: footer.y + footer.height - box.y,
          },
          style: ".shf-institutional-header { visibility: hidden !important; }",
        });
      }
      expect(errors).toEqual([]);
    });
  }
}

test("shared CTA destinations remain keyboard reachable and use existing Foundation pages", async ({
  page,
}) => {
  await page.goto(`${origin}/foundation.html#/about`);
  const cta = page.locator(".shf-final-cta");
  const support = cta.getByRole("link", { name: "Support SHF" });
  await support.focus();
  await expect(support).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/get-involved$/);
  await expect(page.locator(".shf-donation-hero h1")).toHaveText(
    "Invest in People.Build BrighterTomorrows.",
  );
  const partner = page
    .locator(".shf-final-cta")
    .getByRole("link", { name: "Partner With Us" });
  await partner.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/partners$/);
  await expect(page.locator(".shf-info-hero h1")).toHaveText(
    "Work with SHF on a useful community pathway.",
  );
});
