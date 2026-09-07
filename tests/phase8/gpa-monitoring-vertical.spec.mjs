import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const manifest = process.env.SHS_PHASE8_FIXTURE_MANIFEST ? JSON.parse(await readFile(process.env.SHS_PHASE8_FIXTURE_MANIFEST, "utf8")) : {};
const ids = {
  plan: manifest.gpaMonitoringPlan || "phase8_monitoring_plan_a",
  activity: manifest.gpaMonitoringActivity || "phase8_monitoring_activity_a",
  evidenceRequest: manifest.gpaEvidenceRequest || "phase8_evidence_request_a",
  finding: manifest.gpaFinding || "phase8_finding_a",
  response: manifest.gpaProviderResponse || "phase8_provider_response_a",
  correctiveAction: manifest.gpaCorrectiveAction || "phase8_corrective_action_a",
};

function adminHeaders(org = "phase8_org_a") {
  return { Authorization: "Bearer dev-token:admin_A", "x-shs-organization-id": org };
}

test.describe("GPA monitoring corrective-action vertical", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("shfOperatorToken", "dev-token:admin_A");
      localStorage.setItem("shfOperatorOrganizationId", "phase8_org_a");
    });
  });

  test("opens the complete monitoring chain and persists a retest", async ({ page, request }) => {
    await page.goto(`${frontend}/index.html#/operator/government-assurance/monitoring/plans/${ids.plan}`);
    await expect(page.getByRole("heading", { name: /Monitoring Plan:/ })).toBeVisible();
    const activityLink = page.getByRole("table").getByRole("link", { name: ids.activity, exact: true });
    await expect(activityLink).toBeVisible();
    await activityLink.click();
    await expect(page.getByRole("heading", { name: /Monitoring Activity:/ })).toBeVisible();

    await page.goto(`${frontend}/index.html#/operator/government-assurance/monitoring/evidence-requests/${ids.evidenceRequest}`);
    await expect(page.getByRole("heading", { name: /Evidence Request:/ })).toBeVisible();
    const findingLink = page.getByTestId("gpa-monitoring-detail").getByRole("link", { name: ids.finding, exact: true });
    await expect(findingLink).toBeVisible();
    await findingLink.click();

    await expect(page.getByRole("heading", { name: /Finding:/ })).toBeVisible();
    await expect(page.getByText(/Lifecycle History/)).toBeVisible();
    const responseLink = page.getByTestId("gpa-monitoring-detail").getByRole("link", { name: ids.response, exact: true });
    await expect(responseLink).toBeVisible();
    await responseLink.click();
    await expect(page.getByRole("heading", { name: /Provider Response:/ })).toBeVisible();
    await page.goto(`${frontend}/index.html#/operator/government-assurance/findings/${ids.finding}`);
    const actionLink = page.getByTestId("gpa-monitoring-detail").getByRole("link", { name: ids.correctiveAction, exact: true });
    await expect(actionLink).toBeVisible();
    await actionLink.click();
    await page.goto(`${frontend}/index.html#/operator/government-assurance/corrective-actions/${ids.correctiveAction}`);
    await expect(page.getByRole("heading", { name: /Corrective Action:/ })).toBeVisible();
    await page.getByRole("button", { name: "Record Retest" }).click();
    await expect(page.locator('p[role="status"][aria-live="polite"]')).toContainText("reloaded");

    const detail = await request.get(`${api}/government-assurance/corrective-actions/${ids.correctiveAction}`, { headers: adminHeaders() });
    expect(detail.ok()).toBeTruthy();
    expect((await detail.json()).data.status).toBe("COMPLETE");
  });

  test("denies wrong-tenant monitoring detail and unauthorized finding determination", async ({ request }) => {
    const wrongTenant = await request.get(`${api}/government-assurance/findings/${ids.finding}`, { headers: adminHeaders("phase8_org_b") });
    expect([403, 404]).toContain(wrongTenant.status());
    const wrongOrg = await request.get(`${api}/government-assurance/findings/${ids.finding}`, { headers: { Authorization: "Bearer dev-token:admin_B", "x-shs-organization-id": "phase8_org_b" } });
    expect([200, 403, 404]).toContain(wrongOrg.status());
    if (wrongOrg.status() === 200) expect((await wrongOrg.json()).data).toBeNull();
    const denied = await request.post(`${api}/government-assurance/findings/${ids.finding}/determine`, { headers: { ...adminHeaders(), Authorization: "Bearer dev-token:instructor_A_unauthorized" }, data: { status: "CONFIRMED" } });
    expect([403, 422]).toContain(denied.status());
    const retestDenied = await request.post(`${api}/government-assurance/corrective-actions/${ids.correctiveAction}/retest`, { headers: { ...adminHeaders(), Authorization: "Bearer dev-token:instructor_A_unauthorized" }, data: { result: "PASS", evidenceReferences: ["phase8_evidence_a"] } });
    expect([403, 422]).toContain(retestDenied.status());
  });
});
