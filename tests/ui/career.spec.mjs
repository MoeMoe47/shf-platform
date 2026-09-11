import { test, expect } from "@playwright/test";

const BASE = `${String(process.env.SHRV1_BASE_URL || "http://localhost:5173").replace(/\/$/, "")}/career.html`;

const ROUTES = [
  "",
  "dashboard",
  "dashboard-ns",
  "assignments",
  "calendar",
  "portfolio",
  "learn",
  "learn/1",
  "vocab",
  "planner",
  "explore",
  "pathways",
  "discovery",
  "opportunities",
  "employers",
  "resume",
  "rewards",
  "credit/report",
  "marketplace",
  "coach",
  "help",
  "settings",
];

test("Career public entry renders without sending users to the personal dashboard", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`${BASE}#/`, { waitUntil: "networkidle" });

  await expect(page.locator(".career-public")).toBeVisible();
  await expect(page.locator(".career-public__header")).toBeVisible();
  await expect(page.locator(".sh-sidebar")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Find a direction. Build what comes next." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open My Career Center" })).toHaveAttribute("href", "#/dashboard");

  expect(errors).toEqual([]);
});

test("personal dashboard route remains available", async ({ page }) => {
  await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "My Career Center" })).toBeVisible();
});

test("Explore Careers links to a canonical public Career Detail route", async ({ page }) => {
  await page.route("**/careers", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: { items: [{ career_id: "career-1", slug: "data-center-technician", title: "Data Center Technician", description: "Canonical description", career_family_id: "family-1", family_name: "Data Center & AI Infrastructure", sector: "Infrastructure" }] } }),
  }));
  await page.goto(`${BASE}#/explore`, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "View career" }).first()).toHaveAttribute("href", "#/careers/data-center-technician");
});

test("valid Career Detail renders canonical identity and safe unavailable states", async ({ page }) => {
  await page.route("**/careers/data-center-technician/curriculum", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: { requirements: [{ career_curriculum_requirement_id: "req-1", curriculum_id: "data-center-foundations", lesson_id: "data-center-foundations-introduction", requirement_type: "recommended", min_grade: 6, max_grade: 8, developmental_stage: "DISCOVER" }] } }),
  }));
  await page.route("**/careers/data-center-technician", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: { career_id: "career-1", slug: "data-center-technician", title: "Data Center Technician", description: "Canonical description", career_family_id: "family-1", family_name: "Data Center & AI Infrastructure", sector: "Infrastructure" } }),
  }));
  await page.goto(`${BASE}#/careers/data-center-technician`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Data Center Technician" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Core skills" })).toBeVisible();
  await expect(page.getByText("Public skill relationships are not published")).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse Career Pathways" })).toHaveAttribute("href", "#/pathways");
  await expect(page.getByRole("link", { name: "Open lesson" })).toHaveAttribute("href", /curriculum.html#\/curriculum\/lessons\/data-center-foundations-introduction/);
  await expect(page.getByText("Public opportunity, wage, demand, employer, and regional workforce data are not available here yet.")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("Pathways links to the canonical public Pathway Detail route", async ({ page }) => {
  await page.route("**/careers", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: { items: [{ career_id: "career-1", slug: "data-center-technician", title: "Data Center Technician", description: "Canonical description", career_family_id: "family-1", family_name: "Data Center & AI Infrastructure" }] } }),
  }));
  await page.goto(`${BASE}#/pathways`, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "View pathway" }).first()).toHaveAttribute("href", "#/pathways/data-center-technician");
});

test("valid Pathway Detail renders canonical relationships and safe gaps", async ({ page }) => {
  await page.route("**/careers/data-center-technician/curriculum", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: { requirements: [{ career_curriculum_requirement_id: "req-1", curriculum_id: "data-center-foundations", lesson_id: "data-center-foundations-introduction", requirement_type: "recommended" }] } }),
  }));
  await page.route("**/careers/data-center-technician", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: { career_id: "career-1", slug: "data-center-technician", title: "Data Center Technician", description: "Canonical description", career_family_id: "family-1", family_name: "Data Center & AI Infrastructure" } }),
  }));
  await page.goto(`${BASE}#/pathways/data-center-technician`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Data Center Technician pathway" })).toBeVisible();
  await expect(page.getByText("Public organization program mappings are not available for this pathway reference yet.")).toBeVisible();
  await expect(page.getByRole("link", { name: "View Data Center Technician" })).toHaveAttribute("href", "#/careers/data-center-technician");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("Career Discovery is transparent guidance with canonical detail and Planner handoffs", async ({ page }) => {
  await page.route("**/careers", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: { items: [{ career_id: "career-1", slug: "data-center-technician", title: "Data Center Technician", description: "Work with data systems and technical tools.", career_family_id: "family-1", family_name: "Data Center & AI Infrastructure" }] } }),
  }));
  await page.goto(`${BASE}#/discovery`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Career Discovery" })).toBeVisible();
  await expect(page.locator(".sh-sidebar").getByRole("link", { name: "Resume Builder" })).toHaveCount(0);
  await expect(page.getByText("It is not a psychological, aptitude, or validated career assessment.")).toBeVisible();
  await page.getByLabel("Interests or topics").fill("data tools");
  await page.getByRole("button", { name: "Find careers" }).click();
  await expect(page.getByText("Suggested because of your interest in data and tools.")).toBeVisible();
  await expect(page.getByRole("link", { name: "View Career Detail" })).toHaveAttribute("href", "#/careers/data-center-technician");
  await expect(page.getByRole("link", { name: "Continue in My Career Planner" })).toHaveAttribute("href", "#/planner");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("Pathway Detail and Discovery remain usable at desktop, tablet, and mobile widths", async ({ page }) => {
  await page.route("**/careers/data-center-technician/curriculum", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: { requirements: [] } }),
  }));
  await page.route("**/careers/data-center-technician", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: { career_id: "career-1", slug: "data-center-technician", title: "Data Center Technician", description: "Canonical description", career_family_id: "family-1", family_name: "Data Center & AI Infrastructure" } }),
  }));
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`${BASE}#/pathways/data-center-technician`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Data Center Technician pathway" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.goto(`${BASE}#/discovery`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Career Discovery" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});

test("unknown Career Detail renders an accessible public not-found state", async ({ page }) => {
  await page.route("**/careers/does-not-exist**", async (route) => route.fulfill({
    status: 404,
    contentType: "application/json",
    body: JSON.stringify({ error: { code: "NOT_FOUND" } }),
  }));
  await page.goto(`${BASE}#/careers/does-not-exist`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Career not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to Explore Careers" })).toBeVisible();
});

test("only one router/shell instance is mounted", async ({ page }) => {
  await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
  await expect(page.locator(".sh-shell")).toHaveCount(1);
  await expect(page.locator(".sh-header.app-header")).toHaveCount(1);
});

for (const route of ROUTES) {
  test(`route /${route} resolves without console errors`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(`${BASE}#/${route}`, { waitUntil: "networkidle" });

    await expect(page.locator(".career-public__main, .sh-main").first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("unknown route redirects to public entry instead of personal dashboard", async ({ page }) => {
  await page.goto(`${BASE}#/this-route-does-not-exist`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  expect(page.url()).toBe(`${BASE}#/`);
});

test("no horizontal overflow on the dashboard", async ({ page }) => {
  await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
