// MET-13 — Activities, Simulations + District Depth integration tests.
// Real running dev server and Postgres — same convention as
// tests/metaverse-mission-integration.test.ts and
// tests/assignments.security.test.ts.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";

const LEARNER = "user_assignment_technical_001"; // org_shf_001
const OTHER_LEARNER = "user_no_assignment_001"; // org_shf_001
const PARTNER_STUDENT = "user_partner_student_001"; // org_partner_001 — cross-org

const SCAVENGER_HUNT = "city-scavenger-hunt-side-mission";
const DATA_CENTER_FLAGSHIP = "data-center-operations-simulation";

function authHeader(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}

async function api(path: string, opts: { method?: string; userId?: string; body?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...authHeader(opts.userId) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const createdSessionIds = new Set<string>();

async function cleanup() {
  const ids = [...createdSessionIds];
  if (ids.length) {
    await query("DELETE FROM metaverse_simulation_artifacts WHERE session_id = ANY($1::text[])", [ids]);
    await query("DELETE FROM metaverse_simulation_sessions WHERE session_id = ANY($1::text[])", [ids]);
  }
}

before(async () => {
  await cleanup();
});

after(async () => {
  await cleanup();
});

test("MET-13 auth required for simulation catalog (an unresolvable identity is rejected, same as every other protected metaverse route)", async () => {
  const res = await api("/metaverse/simulations", { userId: "totally_fake_user_id_does_not_exist" });
  assert.equal(res.status, 401);
  assert.equal(res.json.error.code, "AUTH_REQUIRED");
});

test("MET-13 catalog lists all districts' simulations for an authenticated learner", async () => {
  const res = await api("/metaverse/simulations", { userId: LEARNER });
  assert.equal(res.status, 200);
  const items = res.json.data.items;
  assert.ok(items.length >= 10);
  const ids = items.map((item: any) => item.simulation.simulationId);
  assert.ok(ids.includes(SCAVENGER_HUNT));
  assert.ok(ids.includes(DATA_CENTER_FLAGSHIP));
});

test("MET-13 registry self-validation reports no errors", async () => {
  const res = await api("/metaverse/simulations/registry/validate", { userId: LEARNER });
  assert.equal(res.status, 200);
  assert.equal(res.json.data.ok, true);
  assert.deepEqual(res.json.data.errors, []);
});

test("MET-13 unknown simulation id fails closed", async () => {
  const res = await api("/metaverse/simulations/does-not-exist", { userId: LEARNER });
  assert.equal(res.status, 404);
  assert.equal(res.json.error.code, "SIMULATION_NOT_FOUND");
});

test("MET-13 unknown simulation id cannot be entered via session/start (hidden enumeration denied)", async () => {
  const res = await api("/metaverse/simulations/does-not-exist/session/start", { method: "POST", userId: LEARNER, body: {} });
  assert.equal(res.status, 404);
});

test("MET-13 side mission (no career pathway, no program) is available to any active member", async () => {
  const view = await api(`/metaverse/simulations/${SCAVENGER_HUNT}`, { userId: LEARNER });
  assert.equal(view.status, 200);
  assert.equal(view.json.data.can_enter, true);
  assert.equal(view.json.data.simulation.careerPathwayId, null);
  assert.equal(view.json.data.simulation.programId, null);
});

test("MET-13 full session lifecycle: start -> sequential steps -> artifact-free completion", async () => {
  const start = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/start`, { method: "POST", userId: LEARNER, body: {} });
  assert.equal(start.status, 200);
  const sessionId = start.json.data.session.sessionId;
  createdSessionIds.add(sessionId);
  assert.equal(start.json.data.session.status, "IN_PROGRESS");
  assert.equal(start.json.data.session.currentStepIndex, 0);
  assert.equal(start.json.data.session.learnerUserId, LEARNER);

  // Forged/out-of-order step must fail closed.
  const badStep = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/${sessionId}/step`, { method: "POST", userId: LEARNER, body: { step_id: "answer-prompt" } });
  assert.equal(badStep.status, 400);
  assert.equal(badStep.json.error.code, "STEP_OUT_OF_SEQUENCE");

  // Completing before all steps are done must fail closed.
  const earlyComplete = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/${sessionId}/complete`, { method: "POST", userId: LEARNER });
  assert.equal(earlyComplete.status, 409);
  assert.equal(earlyComplete.json.error.code, "STEPS_INCOMPLETE");

  const step1 = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/${sessionId}/step`, { method: "POST", userId: LEARNER, body: { step_id: "find-district" } });
  assert.equal(step1.status, 200);
  assert.equal(step1.json.data.session.currentStepIndex, 1);

  const step2 = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/${sessionId}/step`, { method: "POST", userId: LEARNER, body: { step_id: "find-facility" } });
  assert.equal(step2.status, 200);

  const step3 = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/${sessionId}/step`, { method: "POST", userId: LEARNER, body: { step_id: "answer-prompt", response: "Career center" } });
  assert.equal(step3.status, 200);
  assert.equal(step3.json.data.session.completedStepIds.length, 3);

  const complete = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/${sessionId}/complete`, { method: "POST", userId: LEARNER });
  assert.equal(complete.status, 200);
  assert.equal(complete.json.data.session.status, "COMPLETED");
  assert.equal(complete.json.data.session.completionResult.verified_skill, false);
  assert.equal(complete.json.data.session.completionResult.credential, false);
  assert.equal(complete.json.data.session.completionResult.career_eligibility, false);
  assert.equal(complete.json.data.session.completionResult.civic_authority, false);
  assert.equal(complete.json.data.evidence_boundary.isVerifiedSkill, false);
});

test("MET-13 artifact-required flagship cannot complete without a submitted artifact", async () => {
  const start = await api(`/metaverse/simulations/${DATA_CENTER_FLAGSHIP}/session/start`, { method: "POST", userId: OTHER_LEARNER, body: {} });
  assert.equal(start.status, 200);
  const sessionId = start.json.data.session.sessionId;
  createdSessionIds.add(sessionId);

  const stepIds = ["rack-configuration", "cooling-balance", "power-redundancy", "outage-response", "after-action-review"];
  for (const stepId of stepIds) {
    const res = await api(`/metaverse/simulations/${DATA_CENTER_FLAGSHIP}/session/${sessionId}/step`, { method: "POST", userId: OTHER_LEARNER, body: { step_id: stepId, response: "ok" } });
    assert.equal(res.status, 200, `step ${stepId} failed: ${JSON.stringify(res.json)}`);
  }

  const completeWithoutArtifact = await api(`/metaverse/simulations/${DATA_CENTER_FLAGSHIP}/session/${sessionId}/complete`, { method: "POST", userId: OTHER_LEARNER });
  assert.equal(completeWithoutArtifact.status, 409);
  assert.equal(completeWithoutArtifact.json.error.code, "ARTIFACT_REQUIRED");

  const artifact = await api(`/metaverse/simulations/${DATA_CENTER_FLAGSHIP}/session/${sessionId}/artifact`, { method: "POST", userId: OTHER_LEARNER, body: { artifact_type: "TEXT_REFLECTION", content: { text: "After-action notes." } } });
  assert.equal(artifact.status, 201);

  const complete = await api(`/metaverse/simulations/${DATA_CENTER_FLAGSHIP}/session/${sessionId}/complete`, { method: "POST", userId: OTHER_LEARNER });
  assert.equal(complete.status, 200);
  assert.equal(complete.json.data.session.status, "COMPLETED");
});

test("MET-13 team-required flagship denies session/start without a verified team", async () => {
  const res = await api("/metaverse/simulations/enterprise-service-delivery-simulation/session/start", { method: "POST", userId: LEARNER, body: {} });
  assert.equal(res.status, 403);
  assert.equal(res.json.error.code, "TEAM_MEMBERSHIP_REQUIRED");
});

test("MET-13 forged team id is denied, not silently accepted", async () => {
  const res = await api("/metaverse/simulations/enterprise-service-delivery-simulation/session/start", { method: "POST", userId: LEARNER, body: { team_session_ref: "not-a-real-team" } });
  assert.equal(res.status, 403);
  assert.equal(res.json.error.code, "TEAM_MEMBERSHIP_REQUIRED");
});

test("MET-13 cross-org session lookup is denied (session ownership + org isolation)", async () => {
  const start = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/start`, { method: "POST", userId: LEARNER, body: {} });
  const sessionId = start.json.data.session.sessionId;
  createdSessionIds.add(sessionId);

  const crossOrg = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/${sessionId}/step`, { method: "POST", userId: PARTNER_STUDENT, body: { step_id: "find-district" } });
  assert.equal(crossOrg.status, 404);
  assert.equal(crossOrg.json.error.code, "SESSION_NOT_FOUND");
});

test("MET-13 another learner in the same org cannot act on someone else's session", async () => {
  const start = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/start`, { method: "POST", userId: LEARNER, body: {} });
  const sessionId = start.json.data.session.sessionId;
  createdSessionIds.add(sessionId);

  const other = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/${sessionId}/step`, { method: "POST", userId: OTHER_LEARNER, body: { step_id: "find-district" } });
  assert.equal(other.status, 404);
  assert.equal(other.json.error.code, "SESSION_NOT_FOUND");
});

test("MET-13 client-forged completion is denied when required steps are missing", async () => {
  const start = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/start`, { method: "POST", userId: LEARNER, body: {} });
  const sessionId = start.json.data.session.sessionId;
  createdSessionIds.add(sessionId);
  const complete = await api(`/metaverse/simulations/${SCAVENGER_HUNT}/session/${sessionId}/complete`, { method: "POST", userId: LEARNER });
  assert.equal(complete.status, 409);
});

test("MET-13 Data Center flagship district/facility mapping is valid and unlock-projected", async () => {
  const view = await api(`/metaverse/simulations/${DATA_CENTER_FLAGSHIP}`, { userId: LEARNER });
  assert.equal(view.status, 200);
  assert.equal(view.json.data.simulation.districtId, "data-center-district");
  assert.equal(view.json.data.simulation.facilityId, "main-data-center");
  assert.equal(view.json.data.decision.projection_version, "MET-3");
});

test("MET-13 orchestration surface reuses unlock/entry authority without new authority", async () => {
  const res = await api("/metaverse/simulations/orchestration", { userId: LEARNER });
  assert.equal(res.status, 200);
  assert.equal(res.json.data.projection_version, "MET-13");
  assert.ok(Array.isArray(res.json.data.briefing_items));
  assert.ok(res.json.data.briefing_items.length > 0);
});
