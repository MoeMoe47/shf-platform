import { test, expect } from "@playwright/test";

const routes = [["curriculum", "http://localhost:5173/curriculum.html#/curriculum/asl/portfolio"], ["career", "http://localhost:5173/career.html#/portfolio"]];
const designPreviewUrl = "http://localhost:5173/career.html#/portfolio?preview=design";
const artifact = { artifactId: "artifact_website_1", portfolioId: "portfolio_1", status: "ACTIVE", provenance: { projectType: "WEBSITE", workspaceRevision: 4 }, presentation: { title: "Community Garden", summary: "A site for neighbors.", reflection: "I learned to structure content.", visibility: "PRIVATE" } };

async function mockPortfolio(page, artifacts = [artifact]) {
  let profile = { portfolioId: "portfolio_1", aboutText: "", avatarReference: null };
  await page.route("**/portfolio", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { portfolio: profile, artifacts } }) }));
  await page.route("**/portfolio/profile", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    profile = { ...profile, aboutText: body.aboutText ?? profile.aboutText, avatarReference: body.avatarReference ?? null };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: profile }) });
  });
  await page.route("**/credentials/me", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { items: [] } }) }));
  await page.route("**/credentials/certificates/me", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { items: [] } }) }));
  await page.route("**/portfolio/artifacts/**", async (route) => {
    if (route.request().method() !== "PATCH") return route.continue();
    const body = JSON.parse(route.request().postData() || "{}");
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { ...artifact, status: body.status || artifact.status, presentation: { ...artifact.presentation, ...body } } }) });
  });
}

async function mockPortfolioDenied(page) {
  await page.route("**/portfolio", async (route) => route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ ok: false, error: { code: "FORBIDDEN", message: "Missing permission: portfolio.view" } }) }));
  await page.route("**/credentials/me", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { items: [] } }) }));
  await page.route("**/credentials/certificates/me", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { items: [] } }) }));
}

for (const [host, url] of routes) test(`${host}: durable Portfolio renders canonical artifact`, async ({ page }) => {
  await mockPortfolio(page); await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Student Portfolio", level: 1 })).toBeVisible();
  if (host === "career") {
    await expect(page.locator(".sh-header .brand-mark--heart svg")).toBeVisible();
    await expect(page.locator('.sh-header img.brand-mark[src*="shf-globe-logo"]')).toHaveCount(0);
  }
  await expect(page.getByRole("heading", { name: "Community Garden" })).toBeVisible();
  await expect(page.getByLabel("Featured Projects").getByText("Verified Work")).toBeVisible();
  await expect(page.getByLabel("Featured Projects").getByText("Private")).toBeVisible();
});

test("Curriculum Portfolio navigation opens the shared Student Portfolio", async ({ page }) => {
  await mockPortfolio(page);
  await page.goto("http://localhost:5173/curriculum.html#/curriculum/asl/dashboard", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Curriculum").getByRole("link", { name: "Portfolio" }).click();
  await expect(page).toHaveURL(/\/curriculum\/asl\/portfolio$/);
  await expect(page.getByRole("heading", { name: "Student Portfolio", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Community Garden" })).toBeVisible();
});

test("Career Portfolio navigation opens the shared Student Portfolio", async ({ page }) => {
  await mockPortfolio(page);
  await page.goto("http://localhost:5173/career.html#/dashboard", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Main").getByRole("link", { name: "My Portfolio" }).click();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByRole("heading", { name: "Student Portfolio", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Community Garden" })).toBeVisible();
});

test("durable Portfolio empty state is honest and does not import legacy storage", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("portfolio:items", JSON.stringify([{ title: "Fake legacy item" }])); localStorage.setItem("civic:portfolio:artifacts", JSON.stringify([{ title: "Fake civic item" }])); });
  await mockPortfolio(page, []); await page.goto(routes[0][1], { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "What You Proved", level: 2 })).toBeVisible();
  await expect(page.getByText("Fake legacy item")).toHaveCount(0); await expect(page.getByText("Fake civic item")).toHaveCount(0);
});

test("Portfolio access-denied state does not show sample learner achievements", async ({ page }) => {
  await mockPortfolioDenied(page);
  await page.goto(routes[1][1], { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Portfolio access is denied" })).toBeVisible();
  await expect(page.getByText("No sample data is shown in this state.")).toBeVisible();
  await expect(page.getByText("Jordan Ellis")).toHaveCount(0);
  await expect(page.getByText("Data Center Operations Plan")).toHaveCount(0);
});

test("artifact presentation editing exposes only supported visibility", async ({ page }) => {
  await mockPortfolio(page); await page.goto(routes[0][1], { waitUntil: "domcontentloaded" }); await page.getByRole("button", { name: "Edit Presentation" }).click();
  await expect(page.getByRole("textbox", { name: "Summary" })).toHaveValue("A site for neighbors."); await expect(page.getByRole("combobox", { name: "Visibility" })).toHaveValue("PRIVATE");
  await expect(page.getByRole("option", { name: "Private" })).toHaveCount(1); await expect(page.getByRole("option", { name: "Visible to My Organization" })).toHaveCount(1);
  await expect(page.getByRole("option", { name: "Public" })).toHaveCount(0); await expect(page.getByRole("option", { name: "Unlisted" })).toHaveCount(0);
});

test("removal is presented as Portfolio-only containment", async ({ page }) => {
  await mockPortfolio(page); await page.goto(routes[0][1], { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/does not change Evidence, completion, deployment, or credentials/)).toBeVisible(); await expect(page.getByRole("button", { name: "Remove from Portfolio" })).toBeVisible();
});

test("AI Agent artifact keeps the governed project type", async ({ page }) => {
  await mockPortfolio(page, [{ ...artifact, artifactId: "artifact_agent_1", provenance: { projectType: "AI_AGENT", workspaceRevision: 2 }, presentation: { ...artifact.presentation, title: "Neighborhood Guide Agent" } }]);
  await page.goto(routes[0][1], { waitUntil: "domcontentloaded" });
  await expect(page.getByText("AI Agent")).toBeVisible();
  await expect(page.getByText(/does not change Evidence, completion, deployment, or credentials/)).toBeVisible();
  await expect(page.getByText(/Certified AI Agent|Production ready|demo credential/i)).toHaveCount(0);
});

test("restored student shell does not show fabricated projects or progress claims", async ({ page }) => {
  await mockPortfolio(page, []);
  await page.goto(routes[0][1], { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Featured Projects" })).toBeVisible();
  await expect(page.getByText("No evidence-backed projects are ready to feature yet.")).toBeVisible();
  await expect(page.getByText("AI Career Coach")).toHaveCount(0);
  await expect(page.getByText("Responsive Community Website")).toHaveCount(0);
  await expect(page.getByText(/pathway complete|Day streak|\d+%/i)).toHaveCount(0);
});

test("Portfolio tabs are functional and keyboard navigable", async ({ page }) => {
  await mockPortfolio(page);
  await page.goto(routes[0][1], { waitUntil: "domcontentloaded" });
  await page.getByRole("tab", { name: "Projects" }).click();
  await expect(page.getByRole("tabpanel", { name: "Projects" })).toContainText("Community Garden");
  await page.getByRole("tab", { name: "Projects" }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Evidence" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Evidence" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Evidence" })).toContainText("Evidence & Verified Work");
});

test("profile photo upload previews, refreshes the hero, and removes device-local image", async ({ page }) => {
  await mockPortfolio(page);
  await page.goto(routes[0][1], { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Upload / Change Photo" }).click();
  await page.locator("input[type='file']").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByAltText("Profile preview")).toBeVisible();
  await expect(page.locator(".sp-hero img.sp-avatar")).toBeVisible();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByAltText("Profile preview")).toHaveCount(0);
  await expect(page.locator(".sp-hero .sp-avatarFallback")).toBeVisible();
});

test("student About update persists through Portfolio profile API without mastery claims", async ({ page }) => {
  await mockPortfolio(page);
  const profileUpdates = [];
  page.on("request", (request) => {
    if (request.method() === "PATCH" && new URL(request.url()).pathname.endsWith("/portfolio/profile")) {
      profileUpdates.push(JSON.parse(request.postData() || "{}"));
    }
  });
  await page.goto(routes[0][1], { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Add intro" }).click();
  await page.getByLabel("Student introduction").fill("I want reviewers to understand my teamwork goals.");
  await page.getByRole("button", { name: "Save introduction" }).click();
  await expect(page.locator(".sp-aboutText").getByText("I want reviewers to understand my teamwork goals.", { exact: true })).toBeVisible();
  expect(profileUpdates).toEqual([{ aboutText: "I want reviewers to understand my teamwork goals." }]);
  await expect(page.getByText(/verified institutional record/i)).toBeVisible();
});

test("design preview renders sample dashboard without backend Portfolio APIs", async ({ page }) => {
  const apiCalls = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (/^\/api\/(portfolio|credentials)\b/.test(url.pathname) || /^\/(portfolio|credentials)\b/.test(url.pathname)) {
      apiCalls.push(request.url());
    }
  });
  await page.goto(designPreviewUrl, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".sh-header .brand-mark--heart svg")).toBeVisible();
  await expect(page.locator('.sh-header img.brand-mark[src*="shf-globe-logo"]')).toHaveCount(0);
  await expect(page.getByText("Design Preview — Sample Data")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Jordan Ellis/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Data Center Operations Plan" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evidence & Verified Work" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Credentials & Badges" })).toBeVisible();
  await page.getByRole("tab", { name: "Portfolio Progress" }).click();
  await expect(page.getByRole("tabpanel", { name: "Portfolio Progress" })).toContainText("Portfolio Progress");
  expect(apiCalls).toEqual([]);
});
