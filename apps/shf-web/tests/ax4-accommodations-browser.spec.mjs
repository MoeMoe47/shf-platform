import { test, expect } from "@playwright/test";

const api = () => process.env.SHS_TEST_API_URL;
const frontend = () => process.env.SHS_TEST_FRONTEND_URL;
const token = (userId) => ({ Authorization: `Bearer dev-token:${userId}`, "Content-Type": "application/json" });

async function call(userId, path, options = {}) {
  const response = await fetch(`${api()}${path}`, { ...options, headers: { ...token(userId), ...(options.headers || {}) }, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  return { response, body: await response.json().catch(() => ({})) };
}

async function createSubmitted(userId = "learner_A1") {
  const draft = await call(userId, "/accessibility/accommodations/drafts", { method: "POST", body: { requestType: "ALTERNATIVE_FORMAT", requestPayload: { explanation: "Browser acceptance request" }, scope: { activity: "phase8_course_a" } } });
  expect(draft.response.status).toBe(201);
  const id = draft.body.data.accommodationCaseId;
  const submitted = await call(userId, `/accessibility/accommodations/${id}/submit`, { method: "POST" });
  expect(submitted.response.ok).toBeTruthy();
  return id;
}

function expectDenied(result) {
  expect([400, 401, 403, 404]).toContain(result.response.status);
}

async function makeActive() {
  const id = await createSubmitted();
  expect((await call("instructor_A_authorized", `/accessibility/accommodations/${id}/review`, { method: "POST" })).response.ok).toBeTruthy();
  expect((await call("admin_A", `/accessibility/accommodations/${id}/approve`, { method: "POST", body: { effectiveFrom: new Date().toISOString(), requirements: [{ requirementType: "ALTERNATIVE_FORMAT", payload: { representationType: "ACCESSIBLE_HTML" } }] } })).response.ok).toBeTruthy();
  expect((await call("admin_A", `/accessibility/accommodations/${id}/activate`, { method: "POST" })).response.ok).toBeTruthy();
  const detail = await call("admin_A", `/accessibility/accommodations/${id}/projection`);
  return { id, requirementId: detail.body.data.requirements[0]?.requirementId };
}

async function openAs(page, userId, selectedId = "") {
  if (selectedId) await page.addInitScript((value) => localStorage.setItem("shfAccommodationCaseId", value), selectedId);
  await page.addInitScript((value) => localStorage.setItem("shfOperatorToken", value), `dev-token:${userId}`);
  await page.goto(`${frontend()}/#/operator/accommodations`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Accessibility Support" })).toBeVisible();
}

test("requestor browser can submit, reload, and remains separate from approval", async ({ page }) => {
  await openAs(page, "learner_A1");
  await page.getByLabel("Context or explanation").fill("Need an accessible lesson format.");
  await page.getByRole("button", { name: "Submit accommodation request" }).click();
  await expect(page.getByText("Request submitted.")).toBeVisible();
  await expect(page.getByText("SUBMITTED", { exact: true }).first()).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Your request:")).toBeVisible();
  await expect(page.getByText("SUBMITTED", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve bounded support" })).toHaveCount(0);
});

test("reviewer browser sees the authorized queue but no approval authority", async ({ page }) => {
  const id = await createSubmitted();
  await openAs(page, "instructor_A_authorized");
  await expect(page.getByText(id)).toBeVisible();
  await page.getByRole("button", { name: "Start review" }).first().click();
  await expect(page.getByText("Review started.")).toBeVisible();
  await expect(page.getByText("UNDER_REVIEW", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve bounded support" })).toHaveCount(0);
});

test("approver browser approves and activates bounded support", async ({ page }) => {
  const id = await createSubmitted();
  await call("instructor_A_authorized", `/accessibility/accommodations/${id}/review`, { method: "POST" });
  await openAs(page, "admin_A");
  await expect(page.getByText(id)).toBeVisible();
  await page.getByRole("button", { name: "Approve bounded support" }).first().click();
  await expect(page.getByText("Request approved.")).toBeVisible();
  await page.getByRole("button", { name: "Activate" }).first().click();
  await expect(page.getByText("Accommodation activated.")).toBeVisible();
  await expect(page.getByText("ACTIVE")).toBeVisible();
});

test("fulfillment browser delivers through AX-3 before marking delivered", async ({ page }) => {
  const active = await makeActive();
  await openAs(page, "admin_A");
  await expect(page.getByText(active.id)).toBeVisible();
  await expect(page.getByText("PENDING", { exact: true }).first()).toBeVisible();
  await page.getByRole("article").filter({ hasText: active.id }).getByRole("button", { name: "Deliver accessible representation" }).click();
  await expect(page.getByText("Accessible representation delivered; fulfillment state updated.")).toBeVisible();
  await expect(page.getByText("DELIVERED", { exact: true }).first()).toBeVisible();
  const projection = await call("instructor_A_authorized", `/accessibility/accommodations/${active.id}/projection`);
  expect(projection.response.ok).toBeTruthy();
  expect(projection.body.data.status).toBe("ACTIVE");
});

test("browser observes expiration and replacement supersession without losing history", async ({ page }) => {
  const expiredId = await createSubmitted();
  await call("instructor_A_authorized", `/accessibility/accommodations/${expiredId}/review`, { method: "POST" });
  await call("admin_A", `/accessibility/accommodations/${expiredId}/approve`, { method: "POST", body: { effectiveUntil: new Date(Date.now() + 60_000).toISOString(), requirements: [{ requirementType: "CAPTIONS" }] } });
  await call("admin_A", `/accessibility/accommodations/${expiredId}/activate`, { method: "POST" });
  await call("admin_A", `/accessibility/accommodations/${expiredId}/expire`, { method: "POST" });
  const caseA = await makeActive();
  const replacementId = await createSubmitted();
  await call("instructor_A_authorized", `/accessibility/accommodations/${replacementId}/review`, { method: "POST" });
  await call("admin_A", `/accessibility/accommodations/${replacementId}/approve`, { method: "POST", body: { requirements: [{ requirementType: "TRANSCRIPT" }] } });
  await call("admin_A", `/accessibility/accommodations/${replacementId}/activate`, { method: "POST" });
  const superseded = await call("admin_A", `/accessibility/accommodations/${caseA.id}/supersede`, { method: "POST" });
  expect(superseded.response.ok).toBeTruthy();
  expect(superseded.body.data.status).toBe("SUPERSEDED");
  await openAs(page, "admin_A");
  await expect(page.getByRole("article").filter({ hasText: replacementId }).getByText("ACTIVE", { exact: true })).toBeVisible();
});

test("downstream browser projection exposes only minimum-necessary support", async ({ page }) => {
  const draft = await call("learner_A1", "/accessibility/accommodations/drafts", { method: "POST", body: { requestType: "ALTERNATIVE_FORMAT", requestPayload: { explanation: "PRIVATE_REQUEST_NARRATIVE_DO_NOT_DISPLAY" }, scope: { activity: "phase8_course_a" } } });
  expect(draft.response.status).toBe(201);
  const id = draft.body.data.accommodationCaseId;
  await call("learner_A1", `/accessibility/accommodations/${id}/submit`, { method: "POST" });
  await call("instructor_A_authorized", `/accessibility/accommodations/${id}/review`, { method: "POST" });
  await call("admin_A", `/accessibility/accommodations/${id}/approve`, { method: "POST", body: { effectiveFrom: "2026-01-01T00:00:00.000Z", effectiveUntil: "2027-01-01T00:00:00.000Z", requirements: [{ requirementType: "ALTERNATIVE_FORMAT", payload: { representationType: "ACCESSIBLE_HTML" } }] } });
  await call("admin_A", `/accessibility/accommodations/${id}/activate`, { method: "POST" });
  await openAs(page, "instructor_A_authorized", id);
  await expect(page.getByRole("article").filter({ hasText: id })).toBeVisible();
  await page.getByRole("button", { name: "Refresh projection" }).click();
  await expect(page.getByText("ALTERNATIVE_FORMAT", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("ACTIVE", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("PRIVATE_REQUEST_NARRATIVE_DO_NOT_DISPLAY")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Approve bounded support" })).toHaveCount(0);
});

test("browser/API negative authority boundaries remain server-enforced", async ({ page }) => {
  const caseA = await createSubmitted("learner_A1");
  const caseB = await createSubmitted("learner_A2");
  for (const [actor, path, options] of [
    ["learner_A1", `/accessibility/accommodations/${caseA}/review`, { method: "POST" }],
    ["learner_A1", `/accessibility/accommodations/${caseA}/approve`, { method: "POST", body: { requirements: [{ requirementType: "CAPTIONS" }] } }],
    ["learner_A1", `/accessibility/accommodations/${caseA}/activate`, { method: "POST" }],
    ["learner_A1", `/accessibility/accommodations/me/${caseB}`, {}],
    ["instructor_A_authorized", `/accessibility/accommodations/${caseA}/approve`, { method: "POST", body: { requirements: [{ requirementType: "CAPTIONS" }] } }],
    ["instructor_A_authorized", `/accessibility/accommodations/${caseA}/activate`, { method: "POST" }],
    ["admin_B", `/accessibility/accommodations/${caseA}/review`, { method: "POST" }],
    ["admin_B", `/accessibility/accommodations/${caseA}/approve`, { method: "POST", body: { requirements: [{ requirementType: "CAPTIONS" }] } }],
    ["admin_B", `/accessibility/accommodations/${caseA}/projection`, {}],
    ["anonymous", `/accessibility/accommodations/me/${caseA}`, {}],
  ]) expectDenied(await call(actor, path, options));
  await openAs(page, "learner_A1");
  await expect(page.getByRole("button", { name: "Approve bounded support" })).toHaveCount(0);
});

test("current authorization state and cross-domain boundaries remain separate", async () => {
  const active = await makeActive();
  const current = await call("instructor_A_authorized", `/accessibility/accommodations/${active.id}/projection`);
  expect(current.response.ok).toBeTruthy();
  expect(current.body.data.status).toBe("ACTIVE");
  const representation = await call("learner_A1", "/accessibility/content/representations", { method: "POST", body: { sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "ACCESSIBLE_HTML" } });
  expect(representation.response.ok).toBeTruthy();
  const afterRepresentation = await call("learner_A1", `/accessibility/accommodations/me/${active.id}`);
  expect(afterRepresentation.response.ok).toBeTruthy();
  expect(afterRepresentation.body.data.status).toBe("ACTIVE");
  expect(afterRepresentation.body.data.requirements[0].fulfillmentStatus).toBe("PENDING");
  const expired = await call("admin_A", `/accessibility/accommodations/${active.id}/expire`, { method: "POST" });
  expect(expired.response.ok).toBeTruthy();
  expect(expired.body.data.status).toBe("EXPIRED");
});

test("unauthorized downstream actor receives no accommodation work queue", async ({ page }) => {
  await openAs(page, "instructor_A_unauthorized");
  await expect(page.getByRole("heading", { name: "Authorized work queue" })).toHaveCount(0);
  await expect(page.getByText("No authorized institutional cases are available for this account.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start review" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Approve bounded support" })).toHaveCount(0);
});
