import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 3.1 browser acceptance requires the disposable environment.");

const token = (id) => `Bearer dev-token:${id}`;
const headers = (id) => ({ Authorization: token(id), "Content-Type": "application/json" });

async function actorPage(browser, id, role = "student", viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(({ id: userId, role: userRole }) => {
    window.__user = { id: userId, role: userRole, email: `${userId}@phase3.test`, name: userId };
  }, { id, role });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) {
      return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    }
    return route.continue();
  });
  return page;
}

async function apiJson(page, id, path, options = {}) {
  const response = await page.request.fetch(`${api}${path}`, {
    ...options,
    headers: { ...headers(id), ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

function enablePortfolioPermissions() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase31_student_create','phase8_role_student','studio.project.create'),
      ('phase31_student_view','phase8_role_student','studio.project.view'),
      ('phase31_student_update','phase8_role_student','studio.project.update'),
      ('phase31_student_finalize','phase8_role_student','studio.project.finalize')
    ON CONFLICT DO NOTHING;
    INSERT INTO curriculum_evidence_rules
      (evidence_rule_id, organization_id, source_type, evidence_type, truth_fact_type, competency_id, rule_version, review_required, created_by_user_id)
    VALUES ('phase31_studio_rule', 'phase8_org_a', 'STUDIO_DELIVERY', 'STUDIO_PROJECT_FINALIZED', NULL,
      'competency_prepare_prove_monitoring_finding', 1, true, 'admin_A')
    ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}

function counts() {
  return execFileSync("psql", [database, "-X", "-At", "-c", `
    SELECT (SELECT COUNT(*) FROM portfolio_profiles),
           (SELECT COUNT(*) FROM portfolio_artifacts),
           (SELECT COUNT(*) FROM prepare_prove_evidence),
           (SELECT COUNT(*) FROM curriculum_lesson_completions),
           (SELECT COUNT(*) FROM learner_credentials),
           (SELECT COUNT(*) FROM integration_outbox WHERE event_type LIKE 'portfolio.%');
  `], { encoding: "utf8" }).trim();
}

async function completeAndEvidence(page, reviewer, type, title) {
  const created = await apiJson(page, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: type, title } });
  expect(created.response.status()).toBe(201);
  const projectId = created.data.projectId;
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  if (type === "WEBSITE") {
    await page.getByLabel("Page title").fill(`${title} Home`);
    await page.getByLabel("Page content").fill("A durable finalized website.");
  } else {
    await page.getByLabel("Agent name").fill(`${title} Guide`);
    await page.getByLabel("Instructions").fill("Explain the project requirements safely.");
  }
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Check My Project" }).click();
  await expect(page.getByText("Looks good")).toBeVisible();
  const submitResponse = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions`));
  await page.getByRole("button", { name: "Submit for Review" }).click();
  expect((await submitResponse).status()).toBe(201);
  const review = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/review/current`);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${review.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  await reviewer.getByRole("button", { name: "Approve" }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Finalize Project" }).click();
  await expect(page.getByText("Finalized", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Prepare Evidence" }).click();
  await expect(page.getByText(/Evidence is being processed/)).toBeVisible();
  const status = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/institutional-status`);
  expect(status.data.evidence).toHaveLength(1);
  return { projectId, evidenceId: status.data.evidence[0].evidenceId };
}

test.describe.configure({ mode: "serial" });

test("Website Evidence adds to durable Portfolio and persists presentation edits", async ({ browser }) => {
  enablePortfolioPermissions();
  const before = counts();
  const page = await actorPage(browser, "learner_A1");
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor", { width: 1280, height: 900 });
  const { projectId, evidenceId } = await completeAndEvidence(page, reviewer, "WEBSITE", "Phase 3.1 Website");
  await page.getByRole("button", { name: "Add to Portfolio" }).click();
  await expect(page.getByText(/Already in/)).toBeVisible();
  await page.goto(`${frontend}/curriculum.html#/curriculum/asl/portfolio`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Portfolio", level: 1 })).toBeVisible();
  await expect(page.locator(".portfolio-v1-card h2")).toHaveCount(1);
  await page.getByRole("button", { name: "Edit Presentation" }).click();
  await page.getByLabel("Project title").fill("Saved after reload");
  await page.getByLabel("Summary").fill("A durable Portfolio presentation.");
  await page.getByLabel("Visibility").selectOption("ORGANIZATION");
  await page.getByRole("button", { name: "Save Presentation" }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Saved after reload")).toBeVisible();
  await expect(page.getByText("Visible to My Organization")).toBeVisible();
  const ownerArtifacts = await apiJson(page, "learner_A1", "/portfolio/artifacts");
  const artifactId = ownerArtifacts.data.items[0].artifactId;
  const duplicate = await apiJson(page, "learner_A1", "/portfolio/artifacts/from-evidence", { method: "POST", data: { evidenceId } });
  expect(duplicate.response.ok()).toBeTruthy();
  expect(duplicate.data.idempotent).toBe(true);
  const privatePage = await actorPage(browser, "learner_A2");
  const organizationRead = await apiJson(privatePage, "learner_A2", `/portfolio/artifacts/${artifactId}`);
  expect(organizationRead.response.ok()).toBeTruthy();
  const privateOwnerRead = await apiJson(privatePage, "learner_A2", "/portfolio/artifacts");
  expect(privateOwnerRead.response.ok()).toBeTruthy();
  expect(privateOwnerRead.data.items.some((item) => item.artifactId === artifactId)).toBe(false);
  await privatePage.close();
  await expect(page.locator("body")).not.toContainText(/Published|Deployed|Registry (approved|accepted)|Credential (earned|issued)/i);
  expect(counts().split("|").slice(0, 2)).toEqual(["1", "1"]);
  const afterCounts = counts().split("|");
  const beforeCounts = before.split("|");
  expect(afterCounts[2]).toBe(String(Number(beforeCounts[2]) + 1));
  expect(afterCounts.slice(3, 5)).toEqual(beforeCounts.slice(3, 5));
  await page.close();
  await reviewer.close();
});

test("AI Agent Evidence adds to Portfolio without Registry or production claims", async ({ browser }) => {
  enablePortfolioPermissions();
  const page = await actorPage(browser, "learner_A1", "student", { width: 390, height: 900 });
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor");
  await completeAndEvidence(page, reviewer, "AI_AGENT", "Phase 3.1 Agent");
  await page.getByRole("button", { name: "Add to Portfolio" }).click();
  await expect(page.getByText(/Already in/)).toBeVisible();
  await page.goto(`${frontend}/curriculum.html#/curriculum/asl/portfolio`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".portfolio-v1-card .portfolio-v1-kicker").filter({ hasText: "AI Agent" })).toHaveCount(1);
  await expect(page.locator("body")).not.toContainText(/Registry|certified|production|deployed/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.close();
  await reviewer.close();
});

test("Portfolio source reads and writes fail closed across learners and organizations", async ({ browser }) => {
  const page = await actorPage(browser, "learner_A1");
  const sameOrgLearner = await actorPage(browser, "learner_A2");
  const foreignLearner = await actorPage(browser, "learner_B1");
  const artifactList = await apiJson(page, "learner_A1", "/portfolio/artifacts");
  const artifact = artifactList.data.items.find((item) => item.presentation?.visibility === "PRIVATE") || artifactList.data.items[0];
  const artifactId = artifact?.artifactId;
  expect(artifactId).toBeTruthy();
  const privateOwner = await apiJson(page, "learner_A1", `/portfolio/artifacts/${artifactId}`);
  expect(privateOwner.response.ok()).toBeTruthy();
  const learnerPrivateRead = await apiJson(sameOrgLearner, "learner_A2", `/portfolio/artifacts/${artifactId}`);
  expect([403, 404]).toContain(learnerPrivateRead.response.status());
  const learnerSourceUse = await apiJson(sameOrgLearner, "learner_A2", "/portfolio/artifacts/from-evidence", { method: "POST", data: { evidenceId: artifact.provenance.evidenceId } });
  expect([403, 404]).toContain(learnerSourceUse.response.status());
  const foreignRead = await apiJson(foreignLearner, "learner_B1", `/portfolio/artifacts/${artifactId}`);
  expect([403, 404]).toContain(foreignRead.response.status());
  const foreignWrite = await apiJson(foreignLearner, "learner_B1", `/portfolio/artifacts/${artifactId}`, { method: "PATCH", data: { title: "forged" } });
  expect([403, 404]).toContain(foreignWrite.response.status());
  const malformed = await apiJson(foreignLearner, "learner_B1", "/portfolio/artifacts/not-a-valid-id");
  expect([400, 403, 404]).toContain(malformed.response.status());
  await page.close();
  await sameOrgLearner.close();
  await foreignLearner.close();
});

test("Portfolio remains usable at tablet width with keyboard-operable editing", async ({ browser }) => {
  const page = await actorPage(browser, "learner_A1", "student", { width: 768, height: 1024 });
  await page.goto(`${frontend}/curriculum.html#/curriculum/asl/portfolio`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Portfolio", level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
  const edit = page.getByRole("button", { name: "Edit Presentation" }).first();
  await edit.focus();
  await expect(edit).toBeFocused();
  await edit.press("Enter");
  await expect(page.getByLabel("Project title").first()).toBeVisible();
  await expect(page.getByRole("option", { name: "Public" })).toHaveCount(0);
  await page.close();
});
