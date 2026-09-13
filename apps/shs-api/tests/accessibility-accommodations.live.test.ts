import { after, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://127.0.0.1:8091";
const run = `ax4_${Date.now()}`;
const headers = (userId?: string) => userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
async function api(path: string, options: { method?: string; userId?: string; body?: unknown } = {}) {
  const response = await fetch(`${BASE}${path}`, { method: options.method || "GET", headers: { "Content-Type": "application/json", ...headers(options.userId) }, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  return { response, json: await response.json().catch(() => ({})) };
}
async function createAndSubmit(userId = "learner_A1", requestType = "ALTERNATIVE_FORMAT") {
  const draft = await api("/accessibility/accommodations/drafts", { method: "POST", userId, body: { requestType, requestPayload: { context: "AX-4 acceptance" }, scope: { activity: "phase8_course_a" } } });
  assert.equal(draft.response.status, 201);
  const id = draft.json.data.accommodationCaseId;
  const submitted = await api(`/accessibility/accommodations/${id}/submit`, { method: "POST", userId });
  assert.equal(submitted.response.status, 200);
  return id;
}

after(async () => {
  await query("DELETE FROM accessibility_accommodation_requirements WHERE accommodation_case_id IN (SELECT accommodation_case_id FROM accessibility_accommodation_cases WHERE request_payload_json->>'context'='AX-4 acceptance')");
  await query("DELETE FROM accessibility_accommodation_cases WHERE request_payload_json->>'context'='AX-4 acceptance'");
});

test("requestor can submit and read only an own case, without approval authority", async () => {
  const caseA = await createAndSubmit();
  const caseB = await createAndSubmit("learner_A2");
  const own = await api(`/accessibility/accommodations/me/${caseA}`, { userId: "learner_A1" });
  assert.equal(own.response.status, 200);
  assert.equal(own.json.data.status, "SUBMITTED");
  const other = await api(`/accessibility/accommodations/me/${caseB}`, { userId: "learner_A1" });
  assert.equal(other.response.status, 404);
  const approve = await api(`/accessibility/accommodations/${caseA}/approve`, { method: "POST", userId: "learner_A1", body: { requirements: [{ requirementType: "ALTERNATIVE_FORMAT" }] } });
  assert.equal(approve.response.status, 403);
});

test("reviewer is scoped to the organization and cannot approve", async () => {
  const caseA = await createAndSubmit();
  const reviewed = await api(`/accessibility/accommodations/${caseA}/review`, { method: "POST", userId: "instructor_A_authorized" });
  assert.equal(reviewed.response.status, 200);
  assert.equal(reviewed.json.data.status, "UNDER_REVIEW");
  const approve = await api(`/accessibility/accommodations/${caseA}/approve`, { method: "POST", userId: "instructor_A_authorized", body: { requirements: [{ requirementType: "CAPTIONS" }] } });
  assert.equal(approve.response.status, 403);
  const crossOrg = await api(`/accessibility/accommodations/${caseA}/review`, { method: "POST", userId: "admin_B" });
  assert.ok([400, 403, 404].includes(crossOrg.response.status), `cross-org access must be denied, got ${crossOrg.response.status}`);
});

test("human approver activates bounded support and fulfillment stays separate", async () => {
  const caseA = await createAndSubmit();
  await api(`/accessibility/accommodations/${caseA}/review`, { method: "POST", userId: "instructor_A_authorized" });
  const approved = await api(`/accessibility/accommodations/${caseA}/approve`, { method: "POST", userId: "admin_A", body: { effectiveFrom: new Date().toISOString(), requirements: [{ requirementType: "ALTERNATIVE_FORMAT", payload: { representationType: "ACCESSIBLE_HTML" } }] } });
  assert.equal(approved.response.status, 200);
  assert.equal(approved.json.data.status, "APPROVED");
  const activated = await api(`/accessibility/accommodations/${caseA}/activate`, { method: "POST", userId: "admin_A" });
  assert.equal(activated.response.status, 200);
  assert.equal(activated.json.data.status, "ACTIVE");
  const requirement = activated.json.data.requirements[0];
  assert.equal(requirement.fulfillmentStatus, "PENDING");
  const representation = await api("/accessibility/content/representations", { method: "POST", userId: "learner_A1", body: { sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "ACCESSIBLE_HTML" } });
  assert.equal(representation.response.status, 201);
  const delivered = await api(`/accessibility/accommodations/${caseA}/requirements/${requirement.requirementId}/fulfillment`, { method: "PATCH", userId: "admin_A", body: { fulfillmentStatus: "DELIVERED" } });
  assert.equal(delivered.response.status, 200);
  assert.equal(delivered.json.data.status, "ACTIVE");
  assert.equal(delivered.json.data.requirements[0].fulfillmentStatus, "DELIVERED");
  const projection = await api(`/accessibility/accommodations/${caseA}/projection`, { userId: "instructor_A_authorized" });
  assert.equal(projection.response.status, 200);
  assert.equal("requestPayload" in projection.json.data, false);
});

test("anonymous access is denied and expiration/supersession retain bounded state", async () => {
  const caseA = await createAndSubmit();
  await api(`/accessibility/accommodations/${caseA}/review`, { method: "POST", userId: "instructor_A_authorized" });
  await api(`/accessibility/accommodations/${caseA}/approve`, { method: "POST", userId: "admin_A", body: { effectiveUntil: new Date(Date.now() + 60_000).toISOString(), requirements: [{ requirementType: "CAPTIONS" }] } });
  await api(`/accessibility/accommodations/${caseA}/activate`, { method: "POST", userId: "admin_A" });
  const anonymous = await api(`/accessibility/accommodations/me/${caseA}`);
  assert.equal(anonymous.response.status, 404);
  const expired = await api(`/accessibility/accommodations/${caseA}/expire`, { method: "POST", userId: "admin_A" });
  assert.equal(expired.response.status, 200);
  assert.equal(expired.json.data.status, "EXPIRED");
  const caseB = await createAndSubmit();
  await api(`/accessibility/accommodations/${caseB}/review`, { method: "POST", userId: "instructor_A_authorized" });
  await api(`/accessibility/accommodations/${caseB}/approve`, { method: "POST", userId: "admin_A", body: { requirements: [{ requirementType: "TRANSCRIPT" }] } });
  await api(`/accessibility/accommodations/${caseB}/activate`, { method: "POST", userId: "admin_A" });
  const superseded = await api(`/accessibility/accommodations/${caseB}/supersede`, { method: "POST", userId: "admin_A" });
  assert.equal(superseded.response.status, 200);
  assert.equal(superseded.json.data.status, "SUPERSEDED");
});
