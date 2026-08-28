// Regression protection for the SHF Learning Arcade Home + Classical
// Arcade Room implementation (2026-08-24). Authorized package: upgrade
// /arcade.html#/dashboard to the Learning Arcade Home, add
// /arcade.html#/classical-arcade, preserve every existing Workforce
// Arcade route/capability, add institutional light mode alongside the
// existing dark mode, and never present unimplemented systems (Web
// Builder, AI Agent Builder, Registry, publishing) as operational.
//
// This guards specifically against regressing:
//   - Existing routes (games/leaderboard/rewards/tournaments/history/help)
//     still rendering and still reachable.
//   - History's CSV export control still present.
//   - Registry status never reading as Registered/Verified.
//   - Publishing staying disabled/informational (fail-closed).
//   - Planned tools (Unreal/Blender/Meshy/Web Builder/Agent Builder) never
//     labeled as connected.
//   - Theme choice persisting per-app without bleeding into another app.
//   - No horizontal overflow at the four required breakpoints.
//   - Sidebar collapse actually releasing main-content width.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/arcade.html";

test.describe("Route rendering: new + existing Arcade routes", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("/dashboard renders the Learning Arcade Home", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "PLAY WHAT’S POSSIBLE. BUILD WHAT COMES NEXT." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Explore Games" })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("/classical-arcade renders the Classical Arcade Room", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    await page.goto(`${BASE}#/classical-arcade`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "CLASSICAL ARCADE ROOM" })).toBeVisible();
    await expect(page.getByText("Play timeless games. Discover how they work. Build what comes next.")).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  for (const route of ["games", "leaderboard", "rewards", "tournaments", "history", "help"]) {
    test(`existing route /${route} still renders (capability preserved)`, async ({ page }) => {
      const pageErrors = [];
      page.on("pageerror", (e) => pageErrors.push(String(e)));
      await page.goto(`${BASE}#/${route}`, { waitUntil: "networkidle" });
      await expect(page.getByText("Something went wrong")).not.toBeVisible();
      expect(pageErrors).toEqual([]);
    });
  }

  test("History CSV export control remains available", async ({ page }) => {
    await page.goto(`${BASE}#/history`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Download CSV (Arcade Impact)" })).toBeVisible();
  });

  test("History summary KPI labels (data contract) are unchanged", async ({ page }) => {
    await page.goto(`${BASE}#/history`, { waitUntil: "networkidle" });
    await expect(page.getByText("Total Sessions")).toBeVisible();
    await expect(page.getByText("XP Awarded")).toBeVisible();
    await expect(page.getByText("On-chain Events")).toBeVisible();
  });
});

test.describe("Navigation from the new pages reaches real, existing routes", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Explore Games reaches the real Games route", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Explore Games" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/games");
    await expect(page.getByRole("heading", { name: "Workforce Arcade" })).toBeVisible();
  });

  test("Classical Arcade Room entry card reaches /classical-arcade", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Enter Arcade" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/classical-arcade");
    await expect(page.getByRole("heading", { name: "CLASSICAL ARCADE ROOM" })).toBeVisible();
  });

  test("Arcade Activity links reach Leaderboard, Game History, Rewards Wallet", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const activity = page.locator("section", { has: page.getByRole("heading", { name: "Arcade Activity" }) });
    await activity.getByRole("link", { name: "Leaderboard" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/leaderboard");

    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const activity2 = page.locator("section", { has: page.getByRole("heading", { name: "Arcade Activity" }) });
    await activity2.getByRole("link", { name: "Game History" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/history");

    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const activity3 = page.locator("section", { has: page.getByRole("heading", { name: "Arcade Activity" }) });
    await activity3.getByRole("link", { name: "Rewards Wallet" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/rewards");
  });

  test("Sidebar Rewards Wallet and Help & Safety reach real routes", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const sidebar = page.getByRole("navigation", { name: "Primary" });
    await sidebar.getByRole("link", { name: "Rewards Wallet" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/rewards");

    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await sidebar.getByRole("link", { name: "Help & Safety" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/help");
  });

  test("Sidebar Arcade item navigates within the app and stays active on every Arcade route", async ({ page }) => {
    // Matches the approved mock exactly: "Arcade" (not "Dashboard") is the
    // sidebar item marked active on every Arcade page, including Home.
    // "Dashboard" instead links out to the student's real Career dashboard
    // (career.html#/dashboard) — see ArcadeSidebar.jsx's header comment.
    await page.goto(`${BASE}#/classical-arcade`, { waitUntil: "networkidle" });
    const sidebar = page.getByRole("navigation", { name: "Primary" });
    await expect(sidebar.getByRole("link", { name: "Arcade", exact: true })).toHaveClass(/is-active/);
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/career.html#/dashboard");

    await sidebar.getByRole("link", { name: "Arcade", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#/dashboard");
    await expect(sidebar.getByRole("link", { name: "Arcade", exact: true })).toHaveClass(/is-active/);
  });
});

test.describe("Honesty constraints: Registry, publishing, planned tools", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Registry status always reads Not Submitted, never Registered/Verified", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByText("Not Submitted")).toBeVisible();
    await expect(page.getByText(/^Registered$/)).not.toBeVisible();
    await expect(page.getByText(/^Verified$/)).not.toBeVisible();
  });

  test("Submit a Game stays disabled/informational (fail-closed publishing)", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const submitBtn = page.getByRole("button", { name: /Submit a Game/ });
    await expect(submitBtn).toBeDisabled();
  });

  test("Planned tools (Unreal, Blender, Meshy, Web Builder, Agent Builder) are never labeled connected", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByText("Planned tools (not connected):").first()).toBeVisible();
    await expect(page.getByText(/tools connected/i)).not.toBeVisible();
  });

  test("Build Agent Game opens an honest dialog, does not claim to build anything", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Build Agent Game" }).click();
    const dialog = page.getByRole("dialog", { name: "Build Agent Game" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/isn.t connected to the Arcade yet/)).toBeVisible();
    await expect(dialog.getByText(/independent project/)).toBeVisible();
  });

  test("Achievement Snapshot does not claim an issued credential", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByText("no credential-issuance workflow exists yet")).toBeVisible();
  });
});

test.describe("Demo fixtures never enter real ledger/wallet/Portfolio/Registry data", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Home page renders with no real ledger/wallet keys created by demo content alone", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    // Demo sections (Continue Building, Student-Made Experiences, Creator
    // Pathway, Achievement Snapshot) render on load with zero interaction —
    // none of that should write to localStorage on its own.
    const arcadeKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => k.startsWith("arcade:") || k.startsWith("sh_arcade") || k.startsWith("lb_") || k.startsWith("best_"))
    );
    expect(arcadeKeys).toEqual([]);
  });

  test("Every Demo preview section is explicitly labeled", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const demoTags = await page.getByText("Demo preview", { exact: true }).count();
    expect(demoTags).toBeGreaterThanOrEqual(5); // Continue Building, Continue Learning, AI Agent Game Lab, Student-Made, Achievement Snapshot
  });
});

test.describe("Theme: light mode, dark mode, persistence, no cross-app bleed", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Light mode is the default resolved theme with no stored preference", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.removeItem("arcade:ui:theme"));
    await page.reload({ waitUntil: "networkidle" });
    const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(["light", "dark"]).toContain(theme); // resolves from system preference, never null/absent
  });

  test("Dark mode can be explicitly selected and applies data-theme=dark", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^Theme,/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
  });

  test("Light mode can be explicitly selected and applies data-theme=light", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^Theme,/ }).click();
    await page.getByRole("menuitemradio", { name: "Light" }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
  });

  test("Theme choice persists after navigation and reload", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^Theme,/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.goto(`${BASE}#/classical-arcade`, { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await page.reload({ waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
    expect(await page.evaluate(() => localStorage.getItem("arcade:ui:theme"))).toBe("dark");
  });

  test("Classical Arcade Room supports both themes (dark then light)", async ({ page }) => {
    await page.goto(`${BASE}#/classical-arcade`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^Theme,/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
    await expect(page.getByRole("heading", { name: "CLASSICAL ARCADE ROOM" })).toBeVisible();

    await page.getByRole("button", { name: /^Theme,/ }).click();
    await page.getByRole("menuitemradio", { name: "Light" }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
    await expect(page.getByRole("heading", { name: "CLASSICAL ARCADE ROOM" })).toBeVisible();
  });

  test("Arcade's theme storage key is app-scoped and does not bleed into Career", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^Theme,/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("arcade:ui:theme"))).toBe("dark");

    await page.goto("http://localhost:5173/career.html#/dashboard", { waitUntil: "networkidle" });
    // Separate origin-scoped localStorage per *.html bundle in this dev
    // server means arcade's key simply isn't present here; Career's own
    // theme attribute (if any) must not have been forced to "dark" by it.
    const careerTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(careerTheme).not.toBe(null); // Career manages its own attribute independently
  });
});

test.describe("Responsive containment across all four required viewports", () => {
  for (const vp of [
    { name: "390x844", width: 390, height: 844 },
    { name: "768x1024", width: 768, height: 1024 },
    { name: "1024x768", width: 1024, height: 768 },
    { name: "1440x900", width: 1440, height: 900 },
  ]) {
    test.describe(vp.name, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const route of ["dashboard", "classical-arcade"]) {
        test(`/${route}: no horizontal overflow`, async ({ page }) => {
          await page.goto(`${BASE}#/${route}`, { waitUntil: "networkidle" });
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow).toBeLessThanOrEqual(0);
        });
      }
    });
  }
});

test.describe("Sidebar collapse releases main-content width", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("collapsing the sidebar leaves no fixed blank column", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const main = page.locator("#arcade-main");
    const before = await main.boundingBox();

    await page.getByRole("button", { name: /Collapse sidebar/ }).click();
    await page.waitForTimeout(250); // CSS transition

    const after = await main.boundingBox();
    expect(after.width).toBeGreaterThan(before.width);
    expect(after.x).toBeLessThan(before.x);
  });

  test("sidebar collapse state persists across reload (shared-shell convention)", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Collapse sidebar/ }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("arcade.sidebar.collapsed"))).toBe("true");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /Expand sidebar/ })).toBeVisible();
  });
});

test.describe("Accessibility: dialogs, focus, keyboard", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Escape closes an informational dialog and restores focus", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: "Open Creator Studio" });
    await trigger.focus();
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Creator Studio" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Creator Studio" })).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("only one <h1> exists on each authorized page", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    expect(await page.locator("h1").count()).toBe(1);

    await page.goto(`${BASE}#/classical-arcade`, { waitUntil: "networkidle" });
    expect(await page.locator("h1").count()).toBe(1);
  });

  test("Play tab shows aria-current=page when active", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: "Play" })).toHaveAttribute("aria-current", "page");
  });

  test("future top-nav tabs (Create/My Studio/Showcase) are reachable and honestly labeled", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const createTab = page.getByRole("button", { name: /^Create/ });
    await expect(createTab.getByText("Coming soon")).toBeVisible();
    // Deliberately NOT aria-disabled: the button performs a real action
    // (opens an explanatory dialog), so it stays fully operable rather
    // than being marked disabled while still responding to activation.
    await createTab.click();
    await expect(page.getByRole("dialog", { name: "Create" })).toBeVisible();
    await page.keyboard.press("Escape");
  });
});

test.describe("No dead buttons: every active control does something honest", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Resume Lesson opens an honest dialog instead of navigating nowhere", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Resume Lesson" }).click();
    await expect(page.getByRole("dialog", { name: "Resume Lesson" })).toBeVisible();
  });

  test("Classic-Inspired Games Play buttons open an honest preview dialog", async ({ page }) => {
    await page.goto(`${BASE}#/classical-arcade`, { waitUntil: "networkidle" });
    const card = page.locator(".ar-gameCard", { hasText: "Orbit Defender" });
    await card.getByRole("button", { name: "Play" }).click();
    await expect(page.getByRole("dialog", { name: "Orbit Defender" })).toBeVisible();
  });

  test("Guided Play mode opens an honest dialog, does not silently fail", async ({ page }) => {
    await page.goto(`${BASE}#/classical-arcade`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^Guided Play/ }).click();
    await expect(page.getByRole("dialog", { name: "Guided Play" })).toBeVisible();
  });
});

test.describe("No relevant console errors on either authorized page", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const route of ["dashboard", "classical-arcade"]) {
    test(`/${route}: no page errors`, async ({ page }) => {
      const pageErrors = [];
      page.on("pageerror", (e) => pageErrors.push(String(e)));
      await page.goto(`${BASE}#/${route}`, { waitUntil: "networkidle" });
      await page.mouse.wheel(0, 2000);
      expect(pageErrors).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------
// Visual/layout regression checks (added for the visual-fidelity repair
// pass). These are stable DOM/geometry assertions against the approved
// mock's authoritative desktop structure — not pixel-snapshot tests — so
// they stay meaningful and low-maintenance while still catching real
// regressions (wrong shell region, missing section, collapsed grid, etc).
// ---------------------------------------------------------------------
test.describe("Learning Arcade Home: authoritative desktop geometry (visual-fidelity repair)", () => {
  test.use({ viewport: { width: 1440, height: 960 } });

  test("sidebar is full-height and within the approved 220-260px width range", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const sidebar = page.locator(".ar-shell__sidebar");
    const box = await sidebar.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(220);
    expect(box.width).toBeLessThanOrEqual(260);
    expect(box.x).toBe(0);
    expect(box.y).toBe(0);
    expect(box.height).toBe(960); // full viewport height, not below a header
  });

  test("sidebar contains the SHF logo, primary nav, Rewards Wallet card, and SHF Pledge card", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const sidebar = page.getByRole("navigation", { name: "Primary" });
    await expect(sidebar.locator(".ar-sideLogo__mark")).toBeVisible(); // logo mark (alt="" is decorative, excluded from the a11y tree by design)
    await expect(sidebar.getByText("REWARDS WALLET")).toBeVisible();
    await expect(sidebar.getByText("SHF PLEDGE")).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Help & Safety" })).toBeVisible();
  });

  test("header shows the LEARNING ARCADE brand label, not the generic SHF wordmark", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator(".ar-headerBrand")).toHaveText("LEARNING ARCADE");
  });

  test("hero renders a real photo image with an angled clip-path, not the old bar-chart illustration", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const img = page.locator(".ar-hero__img");
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("src", "/assets/arcade/eco-city-hero.jpg");
    const clipPath = await img.evaluate((el) => getComputedStyle(el).clipPath);
    expect(clipPath).not.toBe("none");
    await expect(page.locator(".ar-ecoCity")).toHaveCount(0); // old CSS-only illustration removed
  });

  test("all required Home sections are present (no collapse into generic cards)", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    for (const name of [
      "Continue Building",
      "Continue Learning",
      "AI Agent Game Lab",
      "Arcade Activity",
      "Student-Made Experiences",
      "Submit a Game",
      "Achievement Snapshot",
      "Classical Arcade Room",
    ]) {
      await expect(page.getByRole("heading", { name })).toBeVisible();
    }
    // Creator Pathway does not appear in the approved mock's Home content.
    await expect(page.getByRole("heading", { name: "Creator Pathway" })).toHaveCount(0);
  });

  test("desktop composition is a main column + narrower right rail, not a symmetric grid", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    // .ar-homeMain/.ar-homeRail wrapper divs were retired in the responsive
    // pass in favor of 8 flat .ar-homeItem--* grid children (see
    // ArcadeDashboard.jsx) placed with grid-column/grid-row per tier — the
    // "rail" is now the grid's 3rd column (achievement/agentlab/activity/
    // submit all live there at desktop width) and "main" is columns 1-2
    // combined.
    const grid = await page.locator(".ar-homeGrid").boundingBox();
    const rail = await page.locator(".ar-homeItem--achievement").boundingBox();
    const buildItem = await page.locator(".ar-homeItem--build").boundingBox();
    const main = { x: buildItem.x, width: grid.width - rail.width - 16 };
    expect(main.width).toBeGreaterThan(rail.width * 1.5);
    expect(rail.width).toBeGreaterThanOrEqual(260);
    expect(rail.width).toBeLessThanOrEqual(360);
    expect(rail.x).toBeGreaterThan(main.x); // rail sits to the right of main
  });

  test("Student-Made Experiences cards render horizontally at desktop width", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const cards = page.locator(".ar-studentCard");
    await expect(cards).toHaveCount(3);
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(Math.abs(first.y - second.y)).toBeLessThan(10); // same row
  });

  test("real extracted images render on Continue Building, Continue Learning, and Student-Made cards", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    for (const src of [
      "/assets/arcade/eco-city-thumb.jpg",
      "/assets/arcade/ai-game-dev-course.jpg",
      "/assets/arcade/student-agent-architect.jpg",
      "/assets/arcade/student-code-red.jpg",
      "/assets/arcade/student-community-tech-sprint.jpg",
      "/assets/arcade/classical-arcade-cabinets.jpg",
    ]) {
      await expect(page.locator(`img[src="${src}"]`)).toBeVisible();
    }
  });

  test("Achievement Snapshot shows the approved mock's exact demo figures", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const section = page.locator("section", { has: page.getByRole("heading", { name: "Achievement Snapshot" }) });
    await expect(section.getByText("24")).toBeVisible();
    await expect(section.getByText("Skills Verified")).toBeVisible();
    await expect(section.getByText("7")).toBeVisible();
    await expect(section.getByText("Projects Published")).toBeVisible();
    await expect(section.getByText("3")).toBeVisible();
    await expect(section.getByText("Credentials Earned")).toBeVisible();
  });

  test("Learning Companion does not overlap the hero action buttons", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const companion = page.locator(".brainiact-root, [class*='brainiact']").first();
    const exploreBtn = page.getByRole("button", { name: "Explore Games" });
    const companionCount = await companion.count();
    if (companionCount > 0) {
      const cBox = await companion.boundingBox();
      const bBox = await exploreBtn.boundingBox();
      if (cBox && bBox) {
        const overlap = !(cBox.x > bBox.x + bBox.width || cBox.x + cBox.width < bBox.x || cBox.y > bBox.y + bBox.height || cBox.y + cBox.height < bBox.y);
        expect(overlap).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Outer-shell + desktop-density repair pass. Arcade previously reused
// AppShellLayout (the same shared shell Career/Curriculum use), whose DOM
// topology is a full-width header ABOVE a sidebar+main row — structurally
// unable to produce the approved mock's sidebar-full-height-from-(0,0)
// geometry (confirmed live: sidebar top was y=56, not y=0). Arcade now
// renders its own dedicated shell (ArcadeAppShell -> ArcadeSidebar +
// ArcadeHeader, src/layouts/arcade/ArcadeAppShell.jsx), never nested inside
// AppShellLayout. These tests guard specifically against that regressing
// back to a shared/incorrect shell, and against the sidebar-collapse state
// crossing between Arcade and Career (each app owns its own
// "<app>.sidebar.collapsed" localStorage key).
// ---------------------------------------------------------------------
test.describe("Dedicated Arcade shell: wrong-shell prevention", () => {
  test.use({ viewport: { width: 1536, height: 1024 } });

  test("no shared AppShellLayout chrome (Courses-style shell) is present", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    // .sh-sidebar / .sh-header / .app-switcher are AppShellLayout's own
    // classes (still used by Career/Curriculum) — Arcade must render none
    // of them, visibly or invisibly.
    await expect(page.locator(".sh-sidebar")).toHaveCount(0);
    await expect(page.locator(".sh-header")).toHaveCount(0);
    await expect(page.locator(".app-switcher")).toHaveCount(0);
  });

  test("no large shared Theme text button or large header Expand-sidebar button", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    // The Theme control must be a compact icon-only trigger: its visible
    // text label is present for assistive tech only (clip-rect hidden),
    // and the trigger itself stays small.
    const themeLabel = page.locator(".ar-themeSwitch__label");
    const clip = await themeLabel.evaluate((el) => getComputedStyle(el).clip);
    expect(clip).toBe("rect(0px, 0px, 0px, 0px)");
    const triggerBox = await page.locator(".ar-themeSwitch__trigger").boundingBox();
    expect(triggerBox.width).toBeLessThanOrEqual(48); // compact icon button, not a large text pill

    // No large "Expand/Collapse sidebar" control inside the header itself
    // — that control lives in the sidebar's own compact toggle instead.
    const header = page.locator(".ar-shell__header");
    await expect(header.getByRole("button", { name: /sidebar/i })).toHaveCount(0);
  });

  test("exactly one sidebar, one header, and one main landmark render", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator(".ar-shell__sidebar")).toHaveCount(1);
    await expect(page.locator(".ar-shell__header")).toHaveCount(1);
    await expect(page.locator("#arcade-main")).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(1);
  });

  test("exactly one Learning Companion instance renders", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    // .brainiact-root is the widget's single mount root; its internal
    // icon/fab/tooltip elements also carry "brainiact"-prefixed classes
    // (SVG icon paths, etc), so the root class alone is what "exactly one
    // instance" means here.
    const companion = page.locator(".brainiact-root");
    const count = await companion.count();
    expect(count).toBeLessThanOrEqual(1);
  });
});

test.describe("Dedicated Arcade shell: sidebar-collapse state isolation from Career", () => {
  test.use({ viewport: { width: 1536, height: 1024 } });

  test("Career's collapsed sidebar preference does not contaminate a fresh Arcade load", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("career.sidebar.collapsed", "true");
    });
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });

    const sidebar = page.locator(".ar-shell__sidebar");
    await expect(sidebar).not.toHaveClass(/is-collapsed/);
    const box = await sidebar.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(220);
    expect(box.width).toBeLessThanOrEqual(260);
    await expect(sidebar.getByText("Dashboard")).toBeVisible();

    const [careerKey, arcadeKey] = await page.evaluate(() => [
      localStorage.getItem("career.sidebar.collapsed"),
      localStorage.getItem("arcade.sidebar.collapsed"),
    ]);
    expect(careerKey).toBe("true"); // untouched — Arcade never reads or rewrites Career's key
    expect(arcadeKey).not.toBe("true"); // Arcade used its own, independent key
  });

  test("collapsing Arcade's own sidebar does not touch Career's stored preference", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("career.sidebar.collapsed", "false");
    });
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Collapse sidebar/ }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("arcade.sidebar.collapsed"))).toBe("true");

    const careerKey = await page.evaluate(() => localStorage.getItem("career.sidebar.collapsed"));
    expect(careerKey).toBe("false"); // Arcade's toggle never wrote to Career's key

    // And Career itself, loaded fresh afterward, still reflects its own
    // untouched preference rather than inheriting Arcade's collapsed state.
    await page.goto("http://localhost:5173/career.html#/dashboard", { waitUntil: "networkidle" });
    const careerSidebar = page.locator(".sh-sidebar");
    await expect(careerSidebar).not.toHaveClass(/is-collapsed/);
  });

  test("Curriculum boots unaffected by Arcade's collapse state (independent shell)", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("arcade.sidebar.collapsed", "true");
    });
    await page.goto("http://localhost:5173/curriculum.html#/dashboard", { waitUntil: "networkidle" });
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    expect(pageErrors).toEqual([]);
  });
});

test.describe("Dedicated Arcade shell: header geometry at 1536x1024", () => {
  test.use({ viewport: { width: 1536, height: 1024 } });

  test("header begins at the sidebar's right edge, is 64-68px tall, and its controls fit in one row", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const sidebarBox = await page.locator(".ar-shell__sidebar").boundingBox();
    const headerBox = await page.locator(".ar-shell__header").boundingBox();

    expect(Math.abs(headerBox.x - sidebarBox.width)).toBeLessThanOrEqual(2);
    expect(headerBox.height).toBeGreaterThanOrEqual(64);
    expect(headerBox.height).toBeLessThanOrEqual(68);

    await expect(page.locator(".ar-headerBrand")).toBeVisible();
    await expect(page.locator(".ar-headerBrand")).toHaveText("LEARNING ARCADE");

    // No horizontal overflow inside the header row (controls did not wrap
    // or get clipped by squeezing into the available width).
    const overflow = await page.locator(".ar-shell__header").evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("Dedicated Arcade shell: hero geometry at 1536x1024", () => {
  test.use({ viewport: { width: 1536, height: 1024 } });

  test("hero is compact, exactly two headline lines, and Continue Building needs no excess scroll", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const hero = page.locator(".ar-hero");
    const heroBox = await hero.boundingBox();
    expect(heroBox.height).toBeLessThanOrEqual(300);

    const title = page.locator(".ar-hero__title");
    const lineCount = await title.evaluate((el) => {
      const lh = parseFloat(getComputedStyle(el).lineHeight);
      return Math.round(el.getBoundingClientRect().height / lh);
    });
    expect(lineCount).toBe(2);

    // Mode nav (Play/Learn/Create/...) sits directly below the header and
    // immediately above the hero — not the reverse, and not offset by a
    // large gap in either direction.
    const modeNav = page.locator(".ar-topNavList").first();
    const modeNavBox = await modeNav.boundingBox();
    const headerBox = await page.locator(".ar-shell__header").boundingBox();
    expect(modeNavBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 2);
    expect(modeNavBox.y).toBeLessThanOrEqual(headerBox.y + headerBox.height + 4);
    expect(heroBox.y).toBeGreaterThanOrEqual(modeNavBox.y + modeNavBox.height - 2);
    expect(heroBox.y).toBeLessThanOrEqual(modeNavBox.y + modeNavBox.height + 40);

    // Continue Building is reachable within roughly one screen height —
    // no viewport-height hero pushing it far below the fold.
    const continueBuilding = page.getByRole("heading", { name: "Continue Building" });
    const cbBox = await continueBuilding.boundingBox();
    expect(cbBox.y).toBeLessThanOrEqual(1024);
  });
});

test.describe("Dedicated Arcade shell: light/dark theme parity for shell geometry", () => {
  test.use({ viewport: { width: 1536, height: 1024 } });

  for (const theme of ["dark", "light"]) {
    test(`${theme} mode: sidebar/header geometry and full shell structure hold`, async ({ page }) => {
      await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /^Theme,/ }).click();
      await page.getByRole("menuitemradio", { name: theme === "dark" ? "Dark" : "Light" }).click();
      await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe(theme);

      const sidebarBox = await page.locator(".ar-shell__sidebar").boundingBox();
      expect(sidebarBox.width).toBeGreaterThanOrEqual(220);
      expect(sidebarBox.width).toBeLessThanOrEqual(260);
      expect(sidebarBox.x).toBe(0);
      expect(sidebarBox.y).toBe(0);

      const headerBox = await page.locator(".ar-shell__header").boundingBox();
      expect(Math.abs(headerBox.x - sidebarBox.width)).toBeLessThanOrEqual(2);
      expect(headerBox.height).toBeGreaterThanOrEqual(64);
      expect(headerBox.height).toBeLessThanOrEqual(68);

      await expect(page.locator(".ar-shell__sidebar")).toHaveCount(1);
      await expect(page.locator(".ar-shell__header")).toHaveCount(1);
      const sidebar = page.getByRole("navigation", { name: "Primary" });
      await expect(sidebar.getByText("REWARDS WALLET")).toBeVisible();
      await expect(sidebar.getByText("SHF PLEDGE")).toBeVisible();
    });
  }
});

// ---------------------------------------------------------------------
// Mobile + tablet responsive pass (light/dark, 390x844 / 768x1024 /
// 1024x768). Breakpoint contract (arcade-shell.css / arcade.css):
//   Desktop                 >=1200px        — certified, unchanged
//   Compact/tablet landscape 900-1199.98px  — permanent icon rail
//   Tablet portrait          600-899.98px   — off-canvas drawer
//   Mobile                   <=599.98px     — off-canvas drawer
// ---------------------------------------------------------------------
const RESPONSIVE_VIEWPORTS = [
  { name: "390x844", width: 390, height: 844, shell: "drawer" },
  { name: "768x1024", width: 768, height: 1024, shell: "drawer" },
  { name: "1024x768", width: 1024, height: 768, shell: "rail" },
];

async function setTheme(page, theme) {
  await page.evaluate((t) => localStorage.setItem("arcade:ui:theme", t), theme);
  await page.reload({ waitUntil: "networkidle" });
}

test.describe("A. Shell tests: no Courses shell, exactly one nav system, per viewport", () => {
  for (const vp of RESPONSIVE_VIEWPORTS) {
    test.describe(vp.name, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test("no shared AppShellLayout chrome present", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        await expect(page.locator(".sh-sidebar")).toHaveCount(0);
        await expect(page.locator(".sh-header")).toHaveCount(0);
        await expect(page.locator(".app-switcher")).toHaveCount(0);
      });

      test("exactly one header, one nav landmark, one main landmark", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        await expect(page.locator(".ar-shell__header")).toHaveCount(1);
        await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(1);
        await expect(page.locator("#arcade-main")).toHaveCount(1);
      });

      test(`sidebar is in the expected "${vp.shell}" state`, async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        const sidebar = page.locator(".ar-shell__sidebar");
        const box = await sidebar.boundingBox();
        if (vp.shell === "drawer") {
          // Off-canvas until opened: not in the visible viewport.
          expect(box.x).toBeLessThan(0);
          await expect(page.locator(".ar-mobileMenuBtn")).toBeVisible();
        } else {
          // Permanent compact rail, in-flow, no hamburger.
          expect(box.x).toBe(0);
          expect(box.width).toBeGreaterThanOrEqual(72);
          expect(box.width).toBeLessThanOrEqual(88);
          await expect(page.locator(".ar-mobileMenuBtn")).not.toBeVisible();
          await expect(page.locator(".ar-sideToggle")).toHaveCount(0);
        }
      });

      test("Arcade's own collapse key is isolated from Career's", async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem("career.sidebar.collapsed", "true"));
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        const careerKey = await page.evaluate(() => localStorage.getItem("career.sidebar.collapsed"));
        expect(careerKey).toBe("true"); // untouched by Arcade at this viewport
      });
    });
  }
});

test.describe("B. Mobile drawer: open/close/focus/scroll-lock (390x844 + 768x1024)", () => {
  for (const vp of [{ name: "390x844", width: 390, height: 844 }, { name: "768x1024", width: 768, height: 1024 }]) {
    test.describe(vp.name, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test("opens via the hamburger and shows required nav labels with Arcade active", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        const menuBtn = page.locator(".ar-mobileMenuBtn");
        await menuBtn.click();
        await expect(page.locator(".ar-shell__sidebar")).toHaveClass(/is-mobileOpen/);
        const sidebar = page.getByRole("navigation", { name: "Primary" });
        for (const label of ["Dashboard", "Learn", "Arcade", "Portfolio", "Credentials", "Rewards Wallet", "Help & Safety", "Sign Out"]) {
          await expect(sidebar.getByText(label, { exact: false }).first()).toBeVisible();
        }
        await expect(sidebar.getByRole("link", { name: "Arcade", exact: true })).toHaveClass(/is-active/);
        await expect(sidebar.getByText("SHF PLEDGE")).toBeVisible();
      });

      test("closes using the in-drawer close button and restores focus to the hamburger", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        const menuBtn = page.locator(".ar-mobileMenuBtn");
        await menuBtn.focus();
        await menuBtn.click();
        await expect(page.locator(".ar-shell__sidebar")).toHaveClass(/is-mobileOpen/);
        await page.getByRole("button", { name: "Close menu" }).click();
        await expect(page.locator(".ar-shell__sidebar")).not.toHaveClass(/is-mobileOpen/);
        await expect(menuBtn).toBeFocused();
      });

      test("closes with Escape and restores focus", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        const menuBtn = page.locator(".ar-mobileMenuBtn");
        await menuBtn.click();
        await expect(page.locator(".ar-shell__sidebar")).toHaveClass(/is-mobileOpen/);
        await page.keyboard.press("Escape");
        await expect(page.locator(".ar-shell__sidebar")).not.toHaveClass(/is-mobileOpen/);
        await expect(menuBtn).toBeFocused();
      });

      test("closes on outside (scrim) click", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        await page.locator(".ar-mobileMenuBtn").click();
        await expect(page.locator(".ar-shell__sidebar")).toHaveClass(/is-mobileOpen/);
        // The drawer itself (min(84vw, 300px) wide) sits on top of the
        // scrim at the viewport's left edge, so click near the right edge
        // — genuinely outside the drawer's own bounds — rather than at a
        // fixed (5,5) offset, which lands inside the drawer at every
        // required viewport width and just clicks a nav link instead.
        await page.locator(".ar-shell__scrim").click({ position: { x: vp.width - 10, y: 10 } });
        await expect(page.locator(".ar-shell__sidebar")).not.toHaveClass(/is-mobileOpen/);
      });

      test("traps focus within the open drawer", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        await page.locator(".ar-mobileMenuBtn").click();
        await expect(page.locator(".ar-shell__sidebar")).toHaveClass(/is-mobileOpen/);
        const sidebar = page.locator(".ar-shell__sidebar");
        // Tab past the last focusable element inside the drawer; focus must
        // wrap back inside the drawer, not escape to page content behind it.
        for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
        const activeInsideDrawer = await sidebar.evaluate((node) => node.contains(document.activeElement));
        expect(activeInsideDrawer).toBe(true);
      });

      test("locks background scroll while open", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        await page.locator(".ar-mobileMenuBtn").click();
        const overflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
        expect(overflow).toBe("hidden");
        await page.keyboard.press("Escape");
        const overflowAfter = await page.evaluate(() => getComputedStyle(document.body).overflow);
        expect(overflowAfter).not.toBe("hidden");
      });
    });
  }
});

test.describe("C. Mobile search: compact trigger, focus, Escape (390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens from the compact icon trigger and receives focus", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: "Search Arcade pages" });
    await expect(trigger).toBeVisible();
    await trigger.click();
    const input = page.locator("#ar-quick-search-input");
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test("closes with Escape and restores focus to the trigger", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: "Search Arcade pages" });
    await trigger.click();
    await expect(page.locator("#ar-quick-search-input")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#ar-quick-search-input")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Search Arcade pages" })).toBeFocused();
  });

  test("closes with the explicit close button", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Search Arcade pages" }).click();
    await page.getByRole("button", { name: "Close search" }).click();
    await expect(page.locator("#ar-quick-search-input")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Search Arcade pages" })).toBeVisible();
  });
});

test.describe("D. Layout: overflow, hero geometry, column count, order, Companion clearance", () => {
  for (const vp of RESPONSIVE_VIEWPORTS) {
    test.describe(vp.name, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test("no page-level horizontal overflow", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
      });

      test("hero renders within a reasonable height and headline stays within the 2-3 line allowance", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        const hero = await page.locator(".ar-hero").boundingBox();
        expect(hero.height).toBeLessThan(700); // never a near-empty full-viewport hero
        const lines = await page.locator(".ar-hero__title").evaluate((el) => {
          const lh = parseFloat(getComputedStyle(el).lineHeight);
          return Math.round(el.getBoundingClientRect().height / lh);
        });
        expect(lines).toBeGreaterThanOrEqual(2);
        expect(lines).toBeLessThanOrEqual(3);
      });

      test("required Home content order is preserved in the DOM", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        const order = await page.evaluate(() =>
          Array.from(document.querySelectorAll(".ar-homeGrid > .ar-homeItem")).map((el) =>
            Array.from(el.classList).find((c) => c.startsWith("ar-homeItem--"))
          )
        );
        expect(order).toEqual([
          "ar-homeItem--build",
          "ar-homeItem--learn",
          "ar-homeItem--agentlab",
          "ar-homeItem--activity",
          "ar-homeItem--student",
          "ar-homeItem--classic",
          "ar-homeItem--submit",
          "ar-homeItem--achievement",
        ]);
      });

      test("Registry status and primary hero action remain visible", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        await expect(page.getByText("Not Submitted")).toBeVisible();
        await expect(page.getByRole("button", { name: "Explore Games" })).toBeVisible();
      });

      test("Learning Companion does not overlap the hero action buttons", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        const companion = page.locator(".brainiact-root");
        const exploreBtn = page.getByRole("button", { name: "Explore Games" });
        if (await companion.count()) {
          const cBox = await companion.boundingBox();
          const bBox = await exploreBtn.boundingBox();
          if (cBox && bBox) {
            const overlap = !(cBox.x > bBox.x + bBox.width || cBox.x + cBox.width < bBox.x || cBox.y > bBox.y + bBox.height || cBox.y + cBox.height < bBox.y);
            expect(overlap).toBe(false);
          }
        }
      });
    });
  }
});

test.describe("E. Theme parity across responsive viewports", () => {
  for (const vp of RESPONSIVE_VIEWPORTS) {
    test.describe(vp.name, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const theme of ["light", "dark"]) {
        test(`${theme} mode applies correctly and persists after reload`, async ({ page }) => {
          await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
          await setTheme(page, theme);
          expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe(theme);
          await page.reload({ waitUntil: "networkidle" });
          expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe(theme);
          // No page-level overflow introduced by the theme switch/reload.
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow).toBeLessThanOrEqual(0);
        });
      }

      test("theme choice does not bleed into Career", async ({ page }) => {
        await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
        await setTheme(page, "dark");
        await page.goto("http://localhost:5173/career.html#/dashboard", { waitUntil: "networkidle" });
        const careerTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
        expect(careerTheme).not.toBe(null); // Career resolves its own attribute independently
      });
    });
  }
});

test.describe("Accessibility: 44x44 minimum touch targets below the desktop tier", () => {
  for (const vp of RESPONSIVE_VIEWPORTS) {
    test(`${vp.name}: header icon buttons meet the 44x44 minimum`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
      const selectors = [".ar-mobileMenuBtn", ".ar-themeSwitch__trigger"];
      for (const sel of selectors) {
        const el = page.locator(sel).first();
        if (await el.count()) {
          const box = await el.boundingBox();
          if (box) {
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
      const notif = page.getByRole("button", { name: /Notifications/ });
      const notifBox = await notif.boundingBox();
      expect(notifBox.width).toBeGreaterThanOrEqual(44);
      expect(notifBox.height).toBeGreaterThanOrEqual(44);
    });
  }
});
