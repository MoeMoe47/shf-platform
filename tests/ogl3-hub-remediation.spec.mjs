import { test, expect } from "@playwright/test";

async function installAcceptanceAuth(page) {
  const token = "Bearer dev-token:instructor_A_authorized";
  await page.addInitScript(() => { window.__user = { id: "instructor_A_authorized", role: "instructor", email: "instructor.authorized@phase8.test" }; });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.resourceType() !== "fetch" && request.resourceType() !== "xhr") return route.continue();
    return route.continue({ headers: { ...request.headers(), authorization: token } });
  });
}

test("OGL cross-route acceptance fixture continues through Route A and Route B", async ({ page }) => {
  test.setTimeout(120000);
  const frontend = process.env.SHS_TEST_FRONTEND_URL;
  const api = process.env.SHS_TEST_API_URL;
  if (!frontend || !api) throw new Error("SHS_TEST_FRONTEND_URL and SHS_TEST_API_URL are required");
  await installAcceptanceAuth(page);
  page.on("response", async (response) => {
    if (response.url().includes("/orientation/experience") && response.status() >= 400) console.log("OGL CROSS API ERROR", response.status(), await response.text());
  });
  await page.goto(`${frontend}/admin.html#/ogl-acceptance/route-a`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-ogl-acceptance-fixture="cross-route"]')).toBeVisible();
  await expect(page.getByText("Active route: route-a")).toBeVisible();
  await page.getByRole("button", { name: "Start cross-route tour" }).click();
  await expect(page.getByText("Step 1 of 2")).toBeVisible();
  await expect(page.locator('[data-ogl-anchor="ogl-acceptance-anchor-a"]')).toBeVisible();
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/orientation/experience") && response.request().method() === "POST" && response.status() === 200),
    page.getByRole("button", { name: "Next" }).click(),
  ]);
  await expect(page).toHaveURL(/#\/ogl-acceptance\/route-b$/);
  await expect(page.getByText("Active route: route-b")).toBeVisible();
  await expect(page.locator('[data-ogl-anchor="ogl-acceptance-anchor-a"]')).toHaveCount(0);
  await expect(page.getByText("Step 2 of 2")).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-ogl-anchor="ogl-acceptance-anchor-b"]')).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.locator('[data-tour-control="replay"]')).toBeVisible();
  const result = await page.evaluate(async (apiBase) => fetch(`${apiBase}/orientation/experience?orientationId=orientation%3Aogl-acceptance%3Across-route&orientationVersion=1&tourId=ogl-acceptance%3Across-route&tourVersion=1`).then((response) => response.json()), api);
  expect(result.data.state.status).toBe("COMPLETED");
  expect(result.data.state.currentStepId).toBe("ogl-acceptance-step-b");
});

test("OGL delayed-target acceptance fixture waits and attaches to the target", async ({ page }) => {
  test.setTimeout(120000);
  const frontend = process.env.SHS_TEST_FRONTEND_URL;
  if (!frontend) throw new Error("SHS_TEST_FRONTEND_URL is required");
  await installAcceptanceAuth(page);
  await page.goto(`${frontend}/admin.html#/ogl-acceptance/delayed-target`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-ogl-acceptance-fixture="delayed-target"]')).toBeVisible();
  await page.getByRole("button", { name: "Start delayed target tour" }).click();
  await expect(page.locator('[data-tour-overlay="waiting"]')).toBeVisible();
  await expect(page.getByText("Target status: waiting")).toBeVisible();
  await expect(page.locator('[data-ogl-anchor="ogl-acceptance-anchor-c"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-tour-overlay="active"]')).toContainText("Step 1 of 1", { timeout: 5000 });
  await expect(page.locator('[data-tour-overlay="active"]')).toHaveCount(1);
  await expect(page.getByText("Target status: ready")).toBeVisible();
});

test("Hub canonical runtime persists, replays, and exposes the step list", async ({ page }) => {
  test.setTimeout(120000);
  const frontend = process.env.SHS_TEST_FRONTEND_URL;
  const api = process.env.SHS_TEST_API_URL;
  if (!frontend) throw new Error("SHS_TEST_FRONTEND_URL is required");
  if (!api) throw new Error("SHS_TEST_API_URL is required");
  const token = "Bearer dev-token:instructor_A_authorized";
  await page.addInitScript(() => { window.__user = { id: "instructor_A_authorized", role: "instructor", email: "instructor.authorized@phase8.test" }; });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.resourceType() !== "fetch" && request.resourceType() !== "xhr") return route.continue();
    return route.continue({ headers: { ...request.headers(), authorization: token } });
  });
  const events = [];
  page.on("request", (request) => {
    if (request.url().includes("orientation/experience") || request.url().includes("auth/me")) events.push(`REQ ${request.method()} ${request.url()}`);
  });
  page.on("response", async (response) => {
    if (response.url().includes("orientation/experience") || response.url().includes("auth/me")) events.push(`RES ${response.status()} ${response.url()}`);
  });
  page.on("console", (message) => events.push(`CONSOLE ${message.type()} ${message.text()}`));
  await page.goto(`${frontend}/admin.html#/hub`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const before = await page.evaluate(() => ({
    buttons: [...document.querySelectorAll("button")].map((button) => ({ text: button.textContent?.trim(), control: button.dataset.tourControl })),
    body: document.body.innerText.slice(0, 300),
    local: Object.keys(localStorage).filter((key) => key.startsWith("ogl:")),
  }));
  await expect(page.getByRole("button", { name: "Open Guidance Center" })).toBeVisible();
  await page.getByRole("button", { name: "Open Guidance Center" }).click();
  await expect(page.getByRole("dialog", { name: "Guidance" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "About this area" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Take a tour" })).toBeVisible();
  await page.getByRole("button", { name: "Close Guidance Center" }).click();
  const start = page.locator('[data-tour-control="start"], [data-tour-control="resume"], [data-tour-control="replay"]');
  await expect(start).toHaveCount(1);
  await start.click();
  await expect(page.locator('[data-tour-overlay="active"], [data-tour-overlay="waiting"]')).toHaveCount(1, { timeout: 5000 });
  await expect(page.getByText(/Step 1 of \d+/)).toBeVisible();
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/orientation/experience") && response.request().method() === "POST" && response.status() === 200),
    page.getByRole("button", { name: "Next" }).click(),
  ]);
  await expect(page.getByText(/Step 2 of \d+/)).toBeVisible();
  await expect.poll(async () => (await page.evaluate(() => Object.values(localStorage).find((value) => value?.includes("hub-workspace-kpis")) || ""))).toContain("hub-workspace-kpis");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Resume tour" })).toBeVisible({ timeout: 5000 });
  console.log("RESUME HIT TEST", JSON.stringify(await page.getByRole("button", { name: "Resume tour" }).evaluate((button) => {
    const rect = button.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, hit: hit?.outerHTML?.slice(0, 120), buttonZ: getComputedStyle(button).zIndex, rootZ: getComputedStyle(document.querySelector("#root")).zIndex };
  })));
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/orientation/experience") && response.request().method() === "POST" && response.status() === 200),
    page.getByRole("button", { name: "Resume tour" }).evaluate((button) => button.click()),
  ]);
  await page.waitForTimeout(500);
  console.log("RESUME STATE", JSON.stringify(await page.evaluate(async (apiBase) => ({
    overlays: [...document.querySelectorAll("[data-tour-overlay]")].map((node) => node.innerText.slice(0, 120)),
    state: await fetch(`${apiBase}/orientation/experience?orientationId=orientation%3Ahub%3Aworkspace&orientationVersion=1&tourId=hub%3Aworkspace&tourVersion=1`).then((response) => response.json()),
    buttons: [...document.querySelectorAll("button")].filter((button) => /tour|Step|Next|Resume|Replay/i.test(button.textContent || button.getAttribute("aria-label") || "")).map((button) => button.textContent?.trim()),
  }), api)));
  await expect(page.getByText(/Step 2 of \d+/)).toBeVisible();
  await page.getByRole("button", { name: "Step list" }).click();
  await expect(page.getByRole("heading", { name: "Start Hub tour step list" })).toBeVisible();
  await expect(page.getByText("This dashboard is the client's home base.")).toBeVisible();
  await page.getByRole("button", { name: "Close step list" }).click();
  await expect(page.getByText("Step 2 of 13")).toBeVisible();
  const totalSteps = await page.locator('[data-tour-overlay="active"]').getByText(/Step \d+ of \d+/).textContent().then((text) => Number(text?.match(/of (\d+)/)?.[1] || 0));
  for (let expectedStep = 3; expectedStep <= totalSteps; expectedStep += 1) {
    await page.getByRole("button", { name: "Next" }).evaluate((button) => button.click());
    await expect(page.getByText(`Step ${expectedStep} of 13`)).toBeVisible({ timeout: 10000 });
  }
  await expect(page.getByRole("button", { name: "Finish" })).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Finish" }).evaluate((button) => button.click());
  await expect(page.getByRole("button", { name: "Replay tour" })).toBeVisible({ timeout: 5000 });
  await expect.poll(async () => (await page.evaluate(() => Object.values(localStorage).find((value) => value?.includes('"status":"COMPLETED"')) || ""))).toContain('"status":"COMPLETED"');
  await page.getByRole("button", { name: "Replay tour" }).click();
  await expect(page.getByText("Step 1 of 13")).toBeVisible();
  const after = await page.evaluate(() => ({
    overlays: [...document.querySelectorAll("[data-tour-overlay]")].map((node) => ({ state: node.dataset.tourOverlay, text: node.innerText.slice(0, 160) })),
    buttons: [...document.querySelectorAll("button")].map((button) => ({ text: button.textContent?.trim(), control: button.dataset.tourControl })),
    local: Object.keys(localStorage).filter((key) => key.startsWith("ogl:")).map((key) => [key, localStorage.getItem(key)]),
  }));
  console.log("HUB ACCEPTANCE BEFORE", JSON.stringify(before));
  console.log("HUB ACCEPTANCE AFTER", JSON.stringify(after));
  console.log("HUB ACCEPTANCE EVENTS", JSON.stringify(events));
});
