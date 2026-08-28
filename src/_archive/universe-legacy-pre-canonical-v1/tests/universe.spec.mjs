import { test, expect } from "@playwright/test";

const base = process.env.UNIVERSE_BASE_URL || "http://localhost:5173";

const destinations = [
  { slug: "bos", name: /SHS Business Operating System/i, scenes: ["03", "04", "05", "06", "07"] },
  { slug: "aos", name: /Autonomous Operating System/i, scenes: ["09", "10", "11", "12", "13"] },
  { slug: "open-autonomous-standard", name: /Open Autonomous Standard/i, scenes: ["15", "16", "17", "18", "19"] },
  { slug: "autonomous-registry", name: /Autonomous Registry/i, scenes: ["21", "22", "23", "24", "25"] },
  { slug: "autonomous-trust-bureau", name: /Autonomous Trust Bureau/i, scenes: ["27", "28", "29", "30", "31"] },
];

async function gotoUniverse(page) {
  await page.goto(`${base}/universe`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("img[data-scene='01']")).toBeVisible();
}

async function selectPlanet(page, destination) {
  const button = page.getByRole("button", { name: destination.name });
  await expect(button).toBeVisible();
  await button.click({ force: true });
}

test("default Universe does not automatically advance scenes", async ({ page }) => {
  await gotoUniverse(page);
  await page.waitForTimeout(3200);

  await expect(page.locator("img[data-scene='01']")).toBeVisible();
  await expect(page.locator("img[data-scene='02']")).toHaveCount(0);
  await expect(page.locator("[data-universe-state='UNIVERSE_IDLE'], [data-universe-state='REDUCED_MOTION']")).toBeVisible();
});

test("all five planets are selectable from the master Universe", async ({ page }) => {
  await gotoUniverse(page);

  for (const destination of destinations) {
    await expect(page.getByRole("button", { name: destination.name })).toBeVisible();
  }
});

test("selecting BOS starts only the BOS journey", async ({ page }) => {
  await gotoUniverse(page);
  await selectPlanet(page, destinations[0]);

  await expect(page).toHaveURL(/\/universe\/bos$/);
  await expect(page.locator("img[data-scene='01']")).toBeVisible();
  await expect(page.locator("img[data-scene='03']")).toBeVisible({ timeout: 2500 });
  await expect(page.locator("img[data-scene='09']")).toHaveCount(0);
});

test("camera transforms change continuously during the selected journey", async ({ page }) => {
  await gotoUniverse(page);
  await selectPlanet(page, destinations[0]);

  const stage = page.getByTestId("universe-camera-stage");
  await expect(page.locator("img[data-scene='03']")).toBeVisible({ timeout: 2500 });
  const samples = [];
  for (let i = 0; i < 4; i += 1) {
    samples.push(await stage.evaluate((node) => ({
      progress: node.dataset.cameraProgress,
      transform: getComputedStyle(node.querySelector(".universe-camera-track")).transform,
      starTransform: getComputedStyle(node.querySelector("[data-testid='persistent-star-field']")).transform,
    })));
    await page.waitForTimeout(260);
  }

  expect(new Set(samples.map((sample) => sample.progress)).size).toBeGreaterThan(1);
  expect(new Set(samples.map((sample) => sample.transform)).size).toBeGreaterThan(1);
  expect(new Set(samples.map((sample) => sample.starTransform)).size).toBeGreaterThan(1);
});

test("persistent camera stage and star field remain mounted between environments", async ({ page }) => {
  await gotoUniverse(page);
  const stage = page.getByTestId("universe-camera-stage");
  const stageId = await stage.getAttribute("data-camera-stage-id");
  const starHandle = await page.locator("[data-testid='persistent-star-field']").evaluateHandle((node) => node);

  await selectPlanet(page, destinations[0]);
  await expect(page.locator("img[data-scene='03']")).toBeVisible({ timeout: 2500 });
  await expect(page.locator("img[data-scene='04']")).toBeVisible({ timeout: 2800 });

  expect(await stage.getAttribute("data-camera-stage-id")).toBe(stageId);
  const sameStar = await page.locator("[data-testid='persistent-star-field']").evaluate((node, previous) => node === previous, starHandle);
  expect(sameStar).toBe(true);
});

test("scene boundaries overlap without blank static frames", async ({ page }) => {
  await gotoUniverse(page);
  await selectPlanet(page, destinations[1]);

  await expect(page.locator("img[data-scene='09']")).toBeVisible({ timeout: 2500 });
  await expect(page.locator(".universe-environment-previous")).toBeVisible({ timeout: 3000 });
  const visibleSceneCount = await page.locator(".universe-environment").evaluateAll((nodes) =>
    nodes.filter((node) => {
      const style = getComputedStyle(node);
      return Number(style.opacity) > 0.05 && node.getBoundingClientRect().width > 0;
    }).length
  );

  expect(visibleSceneCount).toBeGreaterThanOrEqual(1);
  await expect(page.getByRole("button", { name: /next/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /previous/i })).toHaveCount(0);
});

test("selecting AOS starts only the AOS journey", async ({ page }) => {
  await gotoUniverse(page);
  await selectPlanet(page, destinations[1]);

  await expect(page).toHaveURL(/\/universe\/aos$/);
  await expect(page.locator("img[data-scene='09']")).toBeVisible({ timeout: 2500 });
  await expect(page.locator("img[data-scene='03']")).toHaveCount(0);
});

for (const destination of destinations) {
  test(`${destination.slug} follows only its assigned scene sequence`, async ({ page }) => {
    await gotoUniverse(page);
    await selectPlanet(page, destination);

    await expect(page.locator(`img[data-scene='${destination.scenes[0]}']`)).toBeVisible({ timeout: 2500 });
    await page.getByRole("button", { name: "Skip Journey" }).click();
    await expect(page.locator(`img[data-scene='${destination.scenes[4]}']`)).toBeVisible();

    const otherScenes = destinations
      .filter((item) => item.slug !== destination.slug)
      .flatMap((item) => item.scenes);
    for (const sceneId of otherScenes) {
      await expect(page.locator(`img[data-scene='${sceneId}']`)).toHaveCount(0);
    }
  });
}

test("return restores selectable master Universe", async ({ page }) => {
  await gotoUniverse(page);
  await selectPlanet(page, destinations[3]);

  await page.getByRole("button", { name: "Skip Journey" }).click();
  await page.getByRole("button", { name: "Return to Universe" }).click();
  await expect(page).toHaveURL(/\/universe$/);
  await expect(page.locator("img[data-scene='01']")).toBeVisible({ timeout: 2500 });
  await expect(page.getByRole("button", { name: destinations[4].name })).toBeVisible();
});

test("directory mode remains optional", async ({ page }) => {
  await page.goto(`${base}/universe/directory`, { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("region", { name: "Universe directory" })).toBeVisible();
  await expect(page.locator(".universe-directory-card")).toHaveCount(5);
  await page.getByRole("button", { name: "Resume universe" }).click();
  await expect(page).toHaveURL(/\/universe$/);
  await expect(page.getByRole("navigation", { name: "Universe destinations" })).toBeVisible();
});

test("keyboard users can select every planet", async ({ page }) => {
  for (const destination of destinations) {
    await gotoUniverse(page);
    const button = page.getByRole("button", { name: destination.name });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/universe/${destination.slug}$`));
  }
});

test("touch targets work at 390px width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoUniverse(page);

  const boxes = await page.locator(".universe-planet-hit").evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    })
  );

  expect(boxes).toHaveLength(5);
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  await selectPlanet(page, destinations[0]);
  await expect(page).toHaveURL(/\/universe\/bos$/);
});

test("reduced motion preserves branching navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoUniverse(page);
  await selectPlanet(page, destinations[1]);

  await expect(page.locator("img[data-scene='13']")).toBeVisible({ timeout: 1500 });
  await expect(page.locator("img[data-scene='07']")).toHaveCount(0);
});

test("direct destination interface loads without replaying intro", async ({ page }) => {
  await page.goto(`${base}/universe/autonomous-registry/enter`, { waitUntil: "domcontentloaded" });

  await expect(page.locator("img[data-scene='25']")).toBeVisible();
  await expect(page.getByRole("button", { name: /Enter Registry Coming Soon/i })).toBeDisabled();
});

test("unknown destination falls back safely", async ({ page }) => {
  await page.goto(`${base}/universe/not-real`, { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Unknown Universe destination.").last()).toBeVisible();
  await expect(page.getByRole("button", { name: "Open directory" })).toBeVisible();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test(`Universe has no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await gotoUniverse(page);

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  });
}

test("Root preserves studio templates behavior", async ({ page }) => {
  await page.goto(`${base}/studio/templates`, { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("link", { name: /SHS Website Studio/i })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Universe destinations" })).toHaveCount(0);
});
