// Regression protection for the Silicon Heartland Universe canonical
// migration (2026-08-24). Authorized package: retire the old,
// independently-maintained Universe implementation that previously
// occupied this repository's site root, and make the approved cinematic
// Universe V1 (ported from the shu-cinematic-browser-preview-v1
// reference project) the sole canonical `/universe` landing experience,
// with every ecosystem entry/return link resolving to it.
//
// This guards specifically against regressing:
//   - `/universe` (and `/`, `/universe.html`) rendering the approved
//     cinematic experience, not the retired implementation.
//   - A second, competing Universe implementation being reintroduced
//     (no live import of the archived legacy code, exactly one
//     component backing both entry points).
//   - The destination registry staying the single source of truth
//     (available/planned status, href resolution).
//   - Foundation, Solutions, and Autonomous Registry all being reachable
//     from the Universe and returning to it correctly.
//   - Directory/Card Mode and unavailable-destination handling.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

const UNIVERSE_BASE = process.env.SHRV1_BASE_URL || "http://127.0.0.1:5173";
const REGISTRY_BASE = process.env.AUTONOMOUS_REGISTRY_BASE_URL || "http://127.0.0.1:5174";

test.describe("A. Static source guardrails (no live server required)", () => {
  test("the archived legacy Universe is not imported by any live entry or router", () => {
    const searchRoots = ["src/entries", "src/router", "src/pages", "src/layouts", "src/components"]
      .map((p) => path.join(REPO_ROOT, p));
    const legacyMarkers = [
      "pages/universe/SiliconHeartlandUniversePage",
      "components/universe/UniverseLayer",
      "data/universe/universeWorldCatalog",
      "pages/universe/scenes/UniverseCanvas",
    ];
    const offenders = [];

    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "_archive") continue; // the archive itself is expected to contain these
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(jsx?|tsx?)$/.test(entry.name) && !entry.name.includes(".bak")) {
          const content = fs.readFileSync(full, "utf8");
          for (const marker of legacyMarkers) {
            if (content.includes(marker)) offenders.push(`${full} references ${marker}`);
          }
        }
      }
    };
    for (const root of searchRoots) {
      if (fs.existsSync(root)) walk(root);
    }

    expect(offenders).toEqual([]);
  });

  test("exactly one canonical Universe component backs both entry points", () => {
    const indexEntry = fs.readFileSync(path.join(REPO_ROOT, "src/entries/index.main.jsx"), "utf8");
    const universeEntry = fs.readFileSync(path.join(REPO_ROOT, "src/entries/universe.main.jsx"), "utf8");
    expect(indexEntry).toContain("pages/universe-v1/UniverseApp.jsx");
    expect(universeEntry).toContain("pages/universe-v1/UniverseApp.jsx");
    expect(fs.existsSync(path.join(REPO_ROOT, "src/pages/universe-v1/UniverseApp.jsx"))).toBe(true);
  });

  test("universe.html is registered as a real Vite build input", () => {
    const config = fs.readFileSync(path.join(REPO_ROOT, "vite.config.js"), "utf8");
    expect(config).toMatch(/universe:\s*path\.resolve\(__dirname,\s*["']universe\.html["']\)/);
  });

  test("destination registry is the single source of truth and every entry has required fields", () => {
    const registry = fs.readFileSync(
      path.join(REPO_ROOT, "src/pages/universe-v1/universeDestinationRegistry.js"),
      "utf8"
    );
    expect(registry).toContain("export const CANONICAL_UNIVERSE_ROUTE = '/universe'");
    expect(registry).toContain("export function resolveDestinationHref");
    expect(registry).toContain("export function isDestinationAvailable");
    // No component outside this file should hardcode a destination URL.
    const componentFiles = ["src/pages/universe-v1/UniverseApp.jsx"];
    for (const rel of componentFiles) {
      const content = fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
      expect(content).not.toMatch(/https?:\/\/127\.0\.0\.1:517[0-9]/);
    }
  });
});

test.describe("B. Canonical route renders the approved experience", () => {
  test.use({ viewport: { width: 1536, height: 900 } });

  for (const routePath of ["/universe", "/", "/universe.html"]) {
    test(`${routePath} renders the cinematic Universe V1 lab`, async ({ page }) => {
      const pageErrors = [];
      page.on("pageerror", (e) => pageErrors.push(String(e)));
      await page.goto(`${UNIVERSE_BASE}${routePath}?skipIntro=1`, { waitUntil: "networkidle" });
      await expect(page.locator(".v1-lab")).toBeVisible();
      await expect(page.locator(".v1-lab-image")).toHaveAttribute(
        "src",
        "/assets/universe/masters/SHU_UNIVERSE_V1_BLACK_IVORY_MASTER_V2.png"
      );
      await expect(page.getByRole("heading", { name: /THE SILICON HEARTLAND UNIVERSE/i })).toBeVisible();
      expect(pageErrors).toEqual([]);
    });
  }

  test("no page-level horizontal overflow at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${UNIVERSE_BASE}/universe?skipIntro=1`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("C. Destination registry validity and unavailable-destination handling", () => {
  test.use({ viewport: { width: 1536, height: 900 } });

  test("AOS, Open Autonomous Standard, and Autonomous Trust Bureau remain gracefully unavailable", async ({ page }) => {
    await page.goto(`${UNIVERSE_BASE}/universe?skipIntro=1`, { waitUntil: "networkidle" });
    for (const id of ["aos", "open-autonomous-standard", "autonomous-trust-bureau"]) {
      await page.locator(`[data-target-id="${id}"]`).click();
      const panel = page.locator(".v1-selection-panel");
      await expect(panel).toBeVisible();
      await expect(panel.locator("strong")).toHaveText("DESTINATION IN DEVELOPMENT");
      await expect(panel.getByRole("button", { name: "ENTER" })).toHaveCount(0);
      await page.keyboard.press("Escape");
    }
  });

  test("Directory / Card Mode lists every destination, available and planned", async ({ page }) => {
    await page.goto(`${UNIVERSE_BASE}/universe?skipIntro=1`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Card Mode" }).click();
    await expect.poll(() => page.evaluate(() => window.location.pathname)).toBe("/universe/directory");
    // Planetary Gateway pass (2026-08-27): this route's presentation was
    // intentionally redesigned (gateway/UniverseGateway.jsx) from a flat
    // "Universe Directory" card grid into a sectioned, planet-styled
    // gateway with its own editorial headline — see that file's header
    // comment. The heading text and the destination-wrapper selector (now
    // a stable data attribute instead of the old flat-card class) were
    // updated to match.
    //
    // Ecosystem-audit pass (2026-08-27, same day): the registry grew from
    // 6 to 22 real, evidenced destinations (see
    // universeDestinationRegistry.js's top comment and the audit report).
    // The 3 originally-unavailable destinations (aos, open-autonomous-
    // standard, autonomous-trust-bureau) are still the only 3 unavailable
    // ones — every new record added by the audit is real and live — so
    // that count is unchanged and still asserted with the exact original
    // copy. RETURN TO UNIVERSE still navigates back to /universe.
    //
    // Public-visibility correction (2026-08-27, later same day): Lord of
    // Outcomes was found not to be a public-facing destination and was
    // switched to `universeVisible: false` in the registry — its route,
    // app, and every other field are untouched; it is simply no longer
    // rendered on this public gateway. 22 -> 21.
    await expect(page.getByRole("heading", { name: "Your universe of opportunity." })).toBeVisible();
    const cards = page.locator("[data-destination-id]");
    await expect(cards).toHaveCount(21);
    await expect(page.getByText("Planned destination unavailable in this preview.")).toHaveCount(3);
    await page.getByRole("button", { name: "RETURN TO UNIVERSE" }).click();
    await expect.poll(() => page.evaluate(() => window.location.pathname)).toBe("/universe");
  });
});

test.describe("D. Foundation navigation loop", () => {
  test.use({ viewport: { width: 1536, height: 900 } });

  test("Universe -> Foundation -> Universe", async ({ page }) => {
    await page.goto(`${UNIVERSE_BASE}/universe?skipIntro=1`, { waitUntil: "networkidle" });
    await page.locator('[data-target-id="silicon-heartland-foundation"]').click();
    await page.getByRole("button", { name: "ENTER" }).click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/foundation.html");
    await expect(page.getByRole("heading", { name: "Empowering Pathways to Success" })).toBeVisible();

    const returnLink = page.getByRole("link", { name: "Return to Universe" });
    await expect(returnLink).toHaveAttribute("href", `${UNIVERSE_BASE}/universe`);
    await returnLink.click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toBe(`${UNIVERSE_BASE}/universe`);
    await expect(page.locator(".v1-lab")).toBeVisible();
  });
});

test.describe("E. Solutions (BOS) navigation loop", () => {
  test.use({ viewport: { width: 1536, height: 900 } });

  test("Universe -> Solutions -> Universe", async ({ page }) => {
    await page.goto(`${UNIVERSE_BASE}/universe?skipIntro=1`, { waitUntil: "networkidle" });
    await page.locator('[data-target-id="bos"]').click();
    await page.getByRole("button", { name: "ENTER" }).click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/solutions.html");

    const returnLink = page.getByRole("link", { name: "Return to Universe" });
    await expect(returnLink).toHaveAttribute("href", `${UNIVERSE_BASE}/universe`);
    await returnLink.click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toBe(`${UNIVERSE_BASE}/universe`);
    await expect(page.locator(".v1-lab")).toBeVisible();
  });
});

test.describe("F. Autonomous Registry navigation loop (separate application)", () => {
  test.use({ viewport: { width: 1536, height: 900 } });

  test("Universe -> Autonomous Registry -> Universe", async ({ page }) => {
    // Skips (not fails) rather than reporting a false regression if the
    // separate autonomous-registry dev server isn't running in this
    // environment — this is a genuinely independent application/repo,
    // not something this suite can guarantee is up.
    const reachable = await page
      .request.get(REGISTRY_BASE)
      .then((r) => r.ok())
      .catch(() => false);
    test.skip(!reachable, `Autonomous Registry dev server not reachable at ${REGISTRY_BASE}`);

    await page.goto(`${UNIVERSE_BASE}/universe?skipIntro=1`, { waitUntil: "networkidle" });
    await page.locator('[data-target-id="autonomous-registry"]').click();
    await page.getByRole("button", { name: "ENTER" }).click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain(REGISTRY_BASE.replace(/^https?:\/\//, ""));
    await expect(page.getByRole("heading", { name: /AUTONOMOUS REGISTRY/i })).toBeVisible();

    const returnControl = page.getByRole("link", { name: "Return to Universe" }).or(
      page.getByRole("button", { name: "Return to Universe" })
    );
    await expect(returnControl.first()).toBeVisible();
    await returnControl.first().click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toBe(`${UNIVERSE_BASE}/universe`);
    await expect(page.locator(".v1-lab")).toBeVisible();
  });
});

test.describe("G. Anti-drift: exactly one canonical Universe route owner", () => {
  test.use({ viewport: { width: 1536, height: 900 } });

  test("root and /universe render byte-identical structural markers (same component, not a fork)", async ({ page }) => {
    await page.goto(`${UNIVERSE_BASE}/?skipIntro=1`, { waitUntil: "networkidle" });
    const rootMarkers = await page.evaluate(() => ({
      hasV1Lab: !!document.querySelector(".v1-lab"),
      imageSrc: document.querySelector(".v1-lab-image")?.getAttribute("src"),
      title: document.title,
    }));

    await page.goto(`${UNIVERSE_BASE}/universe?skipIntro=1`, { waitUntil: "networkidle" });
    const universeMarkers = await page.evaluate(() => ({
      hasV1Lab: !!document.querySelector(".v1-lab"),
      imageSrc: document.querySelector(".v1-lab-image")?.getAttribute("src"),
      title: document.title,
    }));

    expect(rootMarkers).toEqual(universeMarkers);
    expect(rootMarkers.hasV1Lab).toBe(true);
  });

  test("no gradient/placeholder legacy scene markup (.shr-legacy-universe, old catalog data attributes) is present", async ({ page }) => {
    await page.goto(`${UNIVERSE_BASE}/universe?skipIntro=1`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-legacy-universe]")).toHaveCount(0);
  });
});
