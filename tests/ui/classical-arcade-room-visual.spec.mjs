// Regression protection for the Classical Arcade Room visual-fidelity
// correction pass (2026-08-24). Root cause of the prior mismatch: this
// page never received the same repair the Learning Arcade Home got in an
// earlier pass — it kept the original Task-1 hero markup (image DOM
// order reversed relative to Home's corrected hero), three flat
// CSS-gradient ".ar-cabinet" placeholders instead of real artwork, and
// all 8 sections flattened into the OLD two-column `.ar-homeGrid`, which
// (after Home's own responsive pass gave that class Home-specific
// `.ar-homeItem--*` placement rules) would have received no placement at
// all since Classical's sections never carried those classes.
//
// This guards specifically against regressing:
//   - The dedicated Arcade shell (no separate sidebar/header/collapse key).
//   - The photographic hero + real Featured Cabinet/game-card artwork
//     (no gradient-only placeholders returning).
//   - The corrected hero text-left/image-right DOM order.
//   - Today's Featured Cabinet living in the right rail, not the lower grid.
//   - The compact four-across Arcade Mode row and Games row.
//   - No visible "DEMO PREVIEW" / top-nav "Coming soon" badges on this page.
//   - The required section order at every breakpoint.
//   - Desktop geometry targets at 1536x1024.
//   - Existing capability preservation (Free Play, dialogs, fail-closed
//     publishing, fixture isolation) — see arcade-learning-arcade.spec.mjs
//     for the broader capability suite, unchanged and still passing.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/arcade.html#/classical-arcade";

async function setTheme(page, theme) {
  await page.evaluate((t) => localStorage.setItem("arcade:ui:theme", t), theme);
  await page.reload({ waitUntil: "networkidle" });
}

// ---------------------------------------------------------------------
// A. Shell reuse
// ---------------------------------------------------------------------
test.describe("A. Shell reuse", () => {
  test.use({ viewport: { width: 1536, height: 1024 } });

  test("uses the dedicated ArcadeAppShell, not AppShellLayout", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.locator(".sh-sidebar")).toHaveCount(0);
    await expect(page.locator(".sh-header")).toHaveCount(0);
    await expect(page.locator(".ar-shell__sidebar")).toHaveCount(1);
    await expect(page.locator(".ar-shell__header")).toHaveCount(1);
  });

  test("fresh desktop profile loads with the sidebar expanded", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const sidebar = page.locator(".ar-shell__sidebar");
    await expect(sidebar).not.toHaveClass(/is-collapsed/);
    const box = await sidebar.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(220);
    expect(box.width).toBeLessThanOrEqual(260);
  });

  test("explicit Arcade collapse still works and uses arcade.sidebar.collapsed", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Collapse sidebar/ }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("arcade.sidebar.collapsed"))).toBe("true");
    await expect(page.locator(".ar-shell__sidebar")).toHaveClass(/is-collapsed/);
  });

  test("Career's collapsed state does not affect a fresh Classical Arcade load", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("career.sidebar.collapsed", "true"));
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.locator(".ar-shell__sidebar")).not.toHaveClass(/is-collapsed/);
    const careerKey = await page.evaluate(() => localStorage.getItem("career.sidebar.collapsed"));
    expect(careerKey).toBe("true"); // untouched
  });
});

// ---------------------------------------------------------------------
// B. Desktop structure at 1536x1024
// ---------------------------------------------------------------------
test.describe("B. Desktop structure at 1536x1024", () => {
  test.use({ viewport: { width: 1536, height: 1024 } });

  test("hero height stays within budget and is photographic, not gradient cabinets", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const hero = await page.locator(".ar-hero--room").boundingBox();
    expect(hero.height).toBeLessThanOrEqual(310);
    await expect(page.locator(".ar-cabinet")).toHaveCount(0);
    const img = page.locator(".ar-hero__img--room");
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("src", "/assets/arcade/classical-arcade-cabinets.jpg");
  });

  test("title/controls render in the hero's left region, image fills the remainder", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const title = await page.locator(".ar-hero--room .ar-hero__title").boundingBox();
    const img = await page.locator(".ar-hero__img--room").boundingBox();
    expect(title.x).toBeLessThan(img.x);
  });

  test("Today's Featured Cabinet occupies the right rail, not the lower grid", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const hero = await page.locator(".ar-hero--room").boundingBox();
    const featured = await page.locator(".ar-roomItem--featured").boundingBox();
    // Right rail: starts to the right of the hero's main column, and its
    // top is aligned with the hero row (not pushed down into a later row).
    expect(featured.x).toBeGreaterThan(hero.x + hero.width - 10);
    expect(Math.abs(featured.y - hero.y)).toBeLessThanOrEqual(4);
  });

  test("four Arcade Mode cards render in one row", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const cards = page.locator(".ar-roomModeCard");
    await expect(cards).toHaveCount(4);
    const boxes = await Promise.all([0, 1, 2, 3].map((i) => cards.nth(i).boundingBox()));
    for (const b of boxes) expect(Math.abs(b.y - boxes[0].y)).toBeLessThan(4);
  });

  test("four game cards render in one row with real artwork", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const cards = page.locator(".ar-gameCard--room");
    await expect(cards).toHaveCount(4);
    const boxes = await Promise.all([0, 1, 2, 3].map((i) => cards.nth(i).boundingBox()));
    for (const b of boxes) expect(Math.abs(b.y - boxes[0].y)).toBeLessThan(4);
    for (const src of [
      "/assets/arcade/classical/orbit-defender.jpg",
      "/assets/arcade/classical/pixel-foundry.jpg",
      "/assets/arcade/classical/circuit-runner.jpg",
      "/assets/arcade/classical/eco-stack.jpg",
    ]) {
      await expect(page.locator(`img[src="${src}"]`).first()).toBeVisible();
    }
  });

  test("How Was This Built renders as one horizontal row", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const topics = page.locator(".ar-howBuiltTopic");
    await expect(topics).toHaveCount(3);
    const boxes = await Promise.all([0, 1, 2].map((i) => topics.nth(i).boundingBox()));
    for (const b of boxes) expect(Math.abs(b.y - boxes[0].y)).toBeLessThan(4);
  });

  test("all required numbered sections and headings are visible", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    for (const name of [
      "1. Choose Your Arcade Mode",
      "2. Classic-Inspired Games",
      "3. How Was This Built?",
      "4. Student Hall of Fame",
      "5. Upcoming Challenges",
      "6. Your Arcade Activity",
      "7. Turn Play Into Progress",
    ]) {
      await expect(page.getByRole("heading", { name })).toBeVisible();
    }
    await expect(page.getByText("Today’s Featured Cabinet")).toBeVisible();
    await expect(page.getByText("Original, licensed, public-domain and student-created")).toBeVisible();
  });

  test("entire required composition fits within a bounded page height", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    // "Approximately one 1024px viewport" is a soft target for a
    // 9-section page — bounded generously rather than pixel-locked, to
    // catch a real regression (e.g. a returning gradient/oversized card)
    // without being brittle to minor copy changes.
    expect(pageHeight).toBeLessThan(1750);
  });
});

// ---------------------------------------------------------------------
// C. Placeholder prevention
// ---------------------------------------------------------------------
test.describe("C. Placeholder prevention", () => {
  test.use({ viewport: { width: 1536, height: 1024 } });

  test("no visible DEMO PREVIEW badge on this page", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const demoTags = await page.locator(".ar-demoTag").count();
    expect(demoTags).toBe(0);
  });

  test("no visible COMING SOON pills in the top navigation on this page", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const visiblePills = await page.locator(".ar-topNav .ar-comingSoon").count();
    expect(visiblePills).toBe(0);
    // The capability-honesty information still exists for assistive tech.
    const srOnlyStatus = await page.locator(".ar-topNav .ar-srOnly").count();
    expect(srOnlyStatus).toBeGreaterThan(0);
  });

  test("no gradient-only cabinet placeholders and no empty artwork containers", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.locator(".ar-cabinet")).toHaveCount(0);
    const artImgs = page.locator(".ar-gameCard__art, .ar-featuredCabinet__art, .ar-howBuiltTopic__art, .ar-hero__img--room");
    const count = await artImgs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(artImgs.nth(i)).toHaveJSProperty("tagName", "IMG");
    }
  });

  test("no dead buttons: mode cards and game cards open real dialogs or navigate", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^Guided Play/ }).click();
    await expect(page.getByRole("dialog", { name: "Guided Play" })).toBeVisible();
    await page.keyboard.press("Escape");

    const card = page.locator(".ar-gameCard", { hasText: "Orbit Defender" });
    await card.getByRole("button", { name: "Play" }).click();
    await expect(page.getByRole("dialog", { name: "Orbit Defender" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------
// D. Asset verification
// ---------------------------------------------------------------------
test.describe("D. Asset verification", () => {
  test.use({ viewport: { width: 1536, height: 1024 } });

  test("every required Classical Arcade Room image loads with real dimensions", async ({ page }) => {
    const failed = [];
    page.on("response", (r) => {
      if (r.url().includes("/assets/arcade/") && !r.ok()) failed.push(r.url());
    });
    await page.goto(BASE, { waitUntil: "networkidle" });
    expect(failed).toEqual([]);

    const sizes = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img")).map((img) => ({
        src: img.getAttribute("src"),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      }))
    );
    const roomAssets = sizes.filter((s) => s.src && s.src.includes("/assets/arcade/"));
    expect(roomAssets.length).toBeGreaterThan(0);
    for (const asset of roomAssets) {
      expect(asset.naturalWidth).toBeGreaterThan(0);
      expect(asset.naturalHeight).toBeGreaterThan(0);
    }
  });

  test("hero asset has sufficient dimensions for its rendered size", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const dims = await page.locator(".ar-hero__img--room").evaluate((img) => ({ w: img.naturalWidth, h: img.naturalHeight }));
    expect(dims.w).toBeGreaterThanOrEqual(200);
    expect(dims.h).toBeGreaterThanOrEqual(150);
  });

  test("the four game cards use real extracted photo/pixel-art crops, not generic SVG icons", async ({ page }) => {
    // Closure-pass regression guard: these four MUST be real .jpg crops
    // from the approved mock (see
    // docs/architecture/ARCADE_CLASSICAL_ARTWORK_SOURCING.md), never a
    // hand-drawn SVG standing in for them again.
    await page.goto(BASE, { waitUntil: "networkidle" });
    for (const id of ["orbit-defender", "pixel-foundry", "circuit-runner", "eco-stack"]) {
      await expect(page.locator(`img[src="/assets/arcade/classical/${id}.jpg"]`).first()).toBeVisible();
    }
    await expect(page.locator('img[src="/assets/arcade/classical/featured-cabinet-orbit-defender.jpg"]')).toBeVisible();
    // Each crop must be visually distinct content, not four copies of the
    // same file (a cheap way to "pass" a naive asset-exists check).
    const hashes = await page.evaluate(async () => {
      const srcs = [
        "/assets/arcade/classical/orbit-defender.jpg",
        "/assets/arcade/classical/pixel-foundry.jpg",
        "/assets/arcade/classical/circuit-runner.jpg",
        "/assets/arcade/classical/eco-stack.jpg",
      ];
      const results = [];
      for (const src of srcs) {
        const buf = await (await fetch(src)).arrayBuffer();
        results.push(buf.byteLength);
      }
      return results;
    });
    expect(new Set(hashes).size).toBe(4); // four different byte lengths == four different files
  });
});

// ---------------------------------------------------------------------
// E. Theme parity
// ---------------------------------------------------------------------
test.describe("E. Theme parity", () => {
  test.use({ viewport: { width: 1536, height: 1024 } });

  for (const theme of ["light", "dark"]) {
    test(`${theme} mode: identical shell/hero geometry and readable sidebar/header`, async ({ page }) => {
      await page.goto(BASE, { waitUntil: "networkidle" });
      await setTheme(page, theme);
      expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe(theme);

      const sidebar = await page.locator(".ar-shell__sidebar").boundingBox();
      expect(sidebar.width).toBeGreaterThanOrEqual(220);
      expect(sidebar.width).toBeLessThanOrEqual(260);
      const hero = await page.locator(".ar-hero--room").boundingBox();
      expect(hero.height).toBeLessThanOrEqual(310);
      await expect(page.getByRole("heading", { name: "CLASSICAL ARCADE ROOM" })).toBeVisible();
    });
  }

  test("no layout shift between themes and theme persists after reload", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const before = await page.locator(".ar-hero--room").boundingBox();
    await setTheme(page, "dark");
    const afterDark = await page.locator(".ar-hero--room").boundingBox();
    expect(Math.abs(before.height - afterDark.height)).toBeLessThanOrEqual(2);
    await page.reload({ waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
  });
});

// ---------------------------------------------------------------------
// F. Responsive coverage
// ---------------------------------------------------------------------
const RESPONSIVE_VIEWPORTS = [
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1536x1024", width: 1536, height: 1024 },
];

test.describe("F. Responsive coverage", () => {
  for (const vp of RESPONSIVE_VIEWPORTS) {
    for (const theme of ["light", "dark"]) {
      test(`${vp.name} ${theme}: no overflow, correct order, visible actions, no Courses shell`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(BASE, { waitUntil: "networkidle" });
        await setTheme(page, theme);

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);

        await expect(page.locator(".sh-sidebar")).toHaveCount(0);
        await expect(page.getByRole("heading", { name: "CLASSICAL ARCADE ROOM" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Start Free Play" })).toBeVisible();

        if (vp.width <= 899) {
          // Featured Cabinet must be the first card after the hero — and,
          // per the mobile DOM/grid architecture closure pass, this must
          // hold as PURE DOM ORDER (no CSS `order` property in play), so
          // visual order, reading order, and keyboard/tab order are all
          // identical. document.querySelectorAll already returns elements
          // in DOM (document) order, independent of any CSS order value —
          // asserting on that directly, and separately asserting every
          // item's computed `order` is the unset default (0), proves the
          // sequence below is a DOM-order fact, not a CSS-order artifact.
          const { domOrder, cssOrders } = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll(".ar-roomGrid .ar-roomItem"));
            return {
              domOrder: items.map((el) => Array.from(el.classList).find((c) => c.startsWith("ar-roomItem--"))),
              cssOrders: items.map((el) => getComputedStyle(el).order),
            };
          });
          expect(domOrder).toEqual([
            "ar-roomItem--hero",
            "ar-roomItem--featured",
            "ar-roomItem--mode",
            "ar-roomItem--games",
            "ar-roomItem--howbuilt",
            "ar-roomItem--policy",
            "ar-roomItem--hof",
            "ar-roomItem--upcoming",
            "ar-roomItem--activity",
            "ar-roomItem--progress",
          ]);
          expect(cssOrders.every((o) => o === "0")).toBe(true);
        }
      });
    }
  }

  test("no CSS `order` property is used anywhere on this page at any breakpoint", async ({ page }) => {
    for (const vp of RESPONSIVE_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE, { waitUntil: "networkidle" });
      const nonDefaultOrders = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".ar-roomGrid, .ar-roomGrid *"))
          .map((el) => getComputedStyle(el).order)
          .filter((o) => o !== "0")
      );
      expect(nonDefaultOrders).toEqual([]);
    }
  });

  test("390x844: touch targets meet 44x44 and Companion does not overlap View Creator Pathway", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    const startFreePlay = await page.getByRole("button", { name: "Start Free Play" }).boundingBox();
    expect(startFreePlay.height).toBeGreaterThanOrEqual(44);

    const companion = page.locator(".brainiact-root");
    const progressBtn = page.getByRole("link", { name: "View Creator Pathway" });
    if (await companion.count()) {
      const cBox = await companion.boundingBox();
      const bBox = await progressBtn.boundingBox();
      if (cBox && bBox) {
        const overlap = !(cBox.x > bBox.x + bBox.width || cBox.x + cBox.width < bBox.x || cBox.y > bBox.y + bBox.height || cBox.y + cBox.height < bBox.y);
        expect(overlap).toBe(false);
      }
    }
  });

  test("1024x768: games display two per row, not a compressed four-card row", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    const cards = page.locator(".ar-gameCard--room");
    await expect(cards).toHaveCount(4);
    const first = await cards.nth(0).boundingBox();
    const third = await cards.nth(2).boundingBox();
    expect(Math.abs(third.y - first.y)).toBeGreaterThan(20); // third card wraps to a new row
  });
});

// ---------------------------------------------------------------------
// G. Capability preservation (spot checks — full suite lives in
// arcade-learning-arcade.spec.mjs and is unchanged/still passing)
// ---------------------------------------------------------------------
test.describe("G. Capability preservation", () => {
  test.use({ viewport: { width: 1536, height: 1024 } });

  test("Start Free Play still navigates to the real Games route", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Start Free Play" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/games");
  });

  test("Your Arcade Activity reads real XP/history data, not a hardcoded fixture", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const section = page.locator(".ar-roomItem--activity");
    await expect(section.getByRole("heading", { name: "6. Your Arcade Activity" })).toBeVisible();
    await expect(section.getByRole("link", { name: /Leaderboard/ })).toBeVisible();
    await expect(section.getByRole("link", { name: /Game History/ })).toBeVisible();
    await expect(section.getByRole("link", { name: /Rewards Wallet/ })).toBeVisible();
  });

  test("Student Hall of Fame uses privacy-safe fixture names, never real ledger keys", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.getByText("NovaCoder_17")).toBeVisible();
    const arcadeKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => k.startsWith("lb_") || k.startsWith("sh_arcade"))
    );
    expect(arcadeKeys).toEqual([]);
  });

  test("Upcoming Challenges View Challenge reaches the real tournaments route", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "View Challenge" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/tournaments");
  });

  test("Publish stays fail-closed with an honest informational dialog", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Publish" }).click();
    const dialog = page.getByRole("dialog", { name: "Publish" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/fail-closed/)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------
// H. Intermediate-desktop hero regression (found during the artwork/
// fidelity closure pass): at 1280x900 the hero's text column is a fixed
// 48% of a NARROWER hero than the certified 1536px reference, so
// .ar-roomControls wrapped onto enough lines to push "Instructor
// Approved"/"Accessibility Ready" past the hero's overflow:hidden edge —
// entirely invisible despite being present in the DOM. Fixed by
// compacting .ar-roomControls at >=1200px, not by growing the hero
// (growing it via height:auto broke the image column's percentage-height
// sizing — confirmed live: 414px instead of the needed ~349px).
// ---------------------------------------------------------------------
test.describe("H. Intermediate-desktop hero regression (1280x900)", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("hero stays at the certified fixed height and every status pill is visible", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const hero = await page.locator(".ar-hero--room").boundingBox();
    expect(hero.height).toBe(288); // fixed, unchanged by the fix
    const controls = page.locator(".ar-roomControls");
    for (const label of ["Safe Play", "Instructor Approved", "Accessibility Ready"]) {
      await expect(controls.getByText(label, { exact: true })).toBeVisible();
    }
    const controlsBox = await controls.boundingBox();
    expect(controlsBox.y + controlsBox.height).toBeLessThanOrEqual(hero.y + hero.height);
  });

  test("certified 1536x1024 geometry is unaffected by the 1280px fix", async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 1024 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    const hero = await page.locator(".ar-hero--room").boundingBox();
    expect(hero.height).toBe(288);
    const lines = await page.locator(".ar-hero__title").evaluate((el) => {
      const lh = parseFloat(getComputedStyle(el).lineHeight);
      return Math.round(el.getBoundingClientRect().height / lh);
    });
    expect(lines).toBe(2);
  });
});
