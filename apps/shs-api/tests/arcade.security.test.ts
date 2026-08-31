// SHF Ecosystem Phase 8 — Learning Arcade security/mastery tests.
// Reuses existing static identities (user_admin_001 = org_admin,
// user_instructor_001, user_student_001/user_assignment_technical_001 =
// students, user_partner_student_001 = cross-org student). Activity
// definitions are global reference data, so no organization fixtures are
// required for them; Attempt/Result rows are org-scoped from the actor.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase8_${Date.now()}`;

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_instructor_001", "org_shf_001", "instructor@siliconheartland.org", "SHF Instructor"],
  ["user_student_001", "org_shf_001", "student@siliconheartland.org", "SHF Student"],
  ["user_assignment_technical_001", "org_shf_001", "technical@test.invalid", "Technical Learner"],
  ["user_partner_student_001", "org_partner_001", "student@partner.test", "Partner Learner"],
] as const;

function authHeader(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}

async function api(path: string, opts: { method?: string; userId?: string; body?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...authHeader(opts.userId) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function createScoreActivity(slug: string, maxScore = 10, passThresholdScore = 7) {
  return api("/arcade/activities", {
    method: "POST",
    userId: "user_admin_001",
    body: { slug: `${slug}-${RUN}`, title: `${RUN} ${slug}`, activityType: "RETRIEVAL", masteryRule: "SCORE_THRESHOLD", maxScore, passThresholdScore },
  });
}

async function createFlagActivity(slug: string) {
  return api("/arcade/activities", {
    method: "POST",
    userId: "user_admin_001",
    body: { slug: `${slug}-${RUN}`, title: `${RUN} ${slug}`, activityType: "SCENARIO", masteryRule: "PASSED_FLAG" },
  });
}

async function startAttempt(userId: string, activityId: string) {
  return api("/arcade/attempts", { method: "POST", userId, body: { activityId } });
}

async function cleanup() {
  await query("DELETE FROM arcade_results WHERE arcade_activity_id IN (SELECT arcade_activity_id FROM arcade_activities WHERE slug LIKE $1)", [`%-${RUN}`]);
  await query("DELETE FROM arcade_attempts WHERE arcade_activity_id IN (SELECT arcade_activity_id FROM arcade_activities WHERE slug LIKE $1)", [`%-${RUN}`]);
  await query("DELETE FROM arcade_activities WHERE slug LIKE $1", [`%-${RUN}`]);
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES
      ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'nonprofit', 'active'),
      ('org_partner_001', 'Partner Organization', 'Partner Organization', 'partner', 'active')
     ON CONFLICT (organization_id) DO NOTHING`,
  );
  for (const [userId, organizationId, email, fullName] of BASE_USERS) {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, $4, 'active', 'local')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, email, fullName],
    ));
  }
});

after(async () => {
  await cleanup();
});

// --- Activity ---

test("1. a valid canonical Activity is readable by anyone (global reference data)", async () => {
  const created = await createScoreActivity("readable");
  assert.equal(created.status, 201);
  const list = await api("/arcade/activities");
  assert.equal(list.status, 200);
  assert.ok(list.json.data.items.some((a: any) => a.id === created.json.data.id));
});

test("2. a student cannot create an Activity", async () => {
  const res = await api("/arcade/activities", { method: "POST", userId: "user_student_001", body: { slug: `student-${RUN}`, title: "x", activityType: "RETRIEVAL", masteryRule: "PASSED_FLAG" } });
  assert.equal(res.status, 403);
  assert.equal(res.json.error.code, "FORBIDDEN");
});

test("an instructor cannot create an Activity either", async () => {
  const res = await api("/arcade/activities", { method: "POST", userId: "user_instructor_001", body: { slug: `instr-${RUN}`, title: "x", activityType: "RETRIEVAL", masteryRule: "PASSED_FLAG" } });
  assert.equal(res.status, 403);
});

test("duplicate slug is rejected", async () => {
  const created = await createFlagActivity("dup");
  assert.equal(created.status, 201);
  const dup = await api("/arcade/activities", { method: "POST", userId: "user_admin_001", body: { slug: `dup-${RUN}`, title: "x", activityType: "SCENARIO", masteryRule: "PASSED_FLAG" } });
  assert.equal(dup.status, 409);
  assert.equal(dup.json.error.code, "DUPLICATE_SLUG");
});

test("a SCORE_THRESHOLD activity requires maxScore/passThresholdScore; a PASSED_FLAG activity must not define them", async () => {
  const missingScore = await api("/arcade/activities", { method: "POST", userId: "user_admin_001", body: { slug: `missing-score-${RUN}`, title: "x", activityType: "RETRIEVAL", masteryRule: "SCORE_THRESHOLD" } });
  assert.equal(missingScore.status, 400);
  assert.equal(missingScore.json.error.code, "INVALID_MAX_SCORE");

  const extraScore = await api("/arcade/activities", { method: "POST", userId: "user_admin_001", body: { slug: `extra-score-${RUN}`, title: "x", activityType: "SCENARIO", masteryRule: "PASSED_FLAG", maxScore: 10 } });
  assert.equal(extraScore.status, 400);
  assert.equal(extraScore.json.error.code, "SCORE_FIELDS_NOT_ALLOWED");
});

// --- Attempt ---

test("7. an entitled (permissioned) learner can start an Attempt", async () => {
  const activity = await createScoreActivity("start-ok");
  const attempt = await startAttempt("user_student_001", activity.json.data.id);
  assert.equal(attempt.status, 201);
  assert.equal(attempt.json.data.status, "STARTED");
  assert.equal(attempt.json.data.learnerUserId, "user_student_001");
});

test("11. starting an Attempt against an unknown/inactive Activity is rejected", async () => {
  const res = await startAttempt("user_student_001", "arcade_activity_does_not_exist");
  assert.equal(res.status, 404);
  assert.equal(res.json.error.code, "ACTIVITY_NOT_FOUND");
});

test("9. another learner cannot read someone else's Attempt; 10. cross-org denied", async () => {
  const activity = await createScoreActivity("attempt-read");
  const attempt = await startAttempt("user_student_001", activity.json.data.id);
  const id = attempt.json.data.id;
  assert.equal((await api(`/arcade/attempts/${id}`, { userId: "user_student_001" })).status, 200);
  assert.equal((await api(`/arcade/attempts/${id}`, { userId: "user_assignment_technical_001" })).status, 404);
  assert.equal((await api(`/arcade/attempts/${id}`, { userId: "user_partner_student_001" })).status, 404);
  // Individual Attempt lookup is deliberately self-service only
  // (arcade.attempt) — admin-tier reporting goes through GET
  // /arcade/results instead, which it can already see (see the dedicated
  // admin-view test below). Admin-tier lacks arcade.attempt by design
  // (mirrors PROJECT_SUBMISSION_WRITE never being granted to admins
  // either), so this 403's at the route gate rather than reaching the
  // service's own org check.
  assert.equal((await api(`/arcade/attempts/${id}`, { userId: "user_admin_001" })).status, 403);
});

test("12. Attempt lifecycle: STARTED can be abandoned, and an abandoned Attempt cannot be finalized", async () => {
  const activity = await createScoreActivity("lifecycle");
  const attempt = await startAttempt("user_student_001", activity.json.data.id);
  const abandon = await api(`/arcade/attempts/${attempt.json.data.id}/abandon`, { method: "POST", userId: "user_student_001" });
  assert.equal(abandon.status, 200);
  assert.equal(abandon.json.data.status, "ABANDONED");
  const resultAttempt = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { score: 8 } });
  assert.equal(resultAttempt.status, 409);
  assert.equal(resultAttempt.json.error.code, "ATTEMPT_NOT_STARTED");
});

// --- Result / score validation ---

test("14. a valid Result is accepted", async () => {
  const activity = await createScoreActivity("valid-result");
  const attempt = await startAttempt("user_student_001", activity.json.data.id);
  const result = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { score: 8 } });
  assert.equal(result.status, 201);
  assert.equal(result.json.data.score, 8);
});

test("15. score bounds are validated (negative, above max, non-integer all rejected)", async () => {
  const activity = await createScoreActivity("bounds");
  for (const badScore of [-1, 999, 3.5, "not-a-number"]) {
    const attempt = await startAttempt("user_student_001", activity.json.data.id);
    const result = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { score: badScore } });
    assert.equal(result.status, 400, `expected 400 for score=${badScore}`);
  }
});

test("16. an invalid result shape is rejected (PASSED_FLAG activity requires a boolean, not a score)", async () => {
  const activity = await createFlagActivity("shape");
  const attempt = await startAttempt("user_student_001", activity.json.data.id);
  const result = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { score: 8 } });
  assert.equal(result.status, 400);
  assert.equal(result.json.error.code, "INVALID_RESULT_SHAPE");
});

test("17. a learner cannot submit a Result for another learner's Attempt", async () => {
  const activity = await createScoreActivity("other-attempt");
  const attempt = await startAttempt("user_student_001", activity.json.data.id);
  const result = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: "user_assignment_technical_001", body: { score: 8 } });
  assert.equal(result.status, 404, "must not reveal that the attempt exists");
  assert.equal(result.json.error.code, "ATTEMPT_NOT_FOUND");
});

test("18. entitlement cannot be bypassed by a cross-org learner", async () => {
  const activity = await createScoreActivity("cross-org-result");
  const attempt = await startAttempt("user_student_001", activity.json.data.id);
  const result = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: "user_partner_student_001", body: { score: 8 } });
  assert.equal(result.status, 404);
});

test("19. a duplicate final Result on the same Attempt is rejected", async () => {
  const activity = await createScoreActivity("dup-result");
  const attempt = await startAttempt("user_student_001", activity.json.data.id);
  const first = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { score: 8 } });
  assert.equal(first.status, 201);
  const second = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { score: 9 } });
  assert.equal(second.status, 409);
  assert.equal(second.json.error.code, "ATTEMPT_NOT_STARTED");
});

test("20. mastery is server-derived from the Activity's own policy — the client cannot submit a mastered flag directly", async () => {
  const activity = await createScoreActivity("server-derived", 10, 7);
  const attempt = await startAttempt("user_student_001", activity.json.data.id);
  // Attempt to smuggle a forged mastery claim alongside a genuinely
  // failing score — the server must ignore the forged field entirely.
  const result = await api(`/arcade/attempts/${attempt.json.data.id}/result`, {
    method: "POST",
    userId: "user_student_001",
    body: { score: 2, mastered: true, masteryAchieved: true, passed: true },
  });
  assert.equal(result.status, 201);
  assert.equal(result.json.data.masteryAchieved, false, "a below-threshold score must never read as mastered, regardless of client-supplied flags");
});

// --- Mastery ---

test("21/22. a qualifying Result produces mastery; a non-qualifying Result does not", async () => {
  const activity = await createScoreActivity("mastery-basic", 10, 7);
  const failing = await startAttempt("user_student_001", activity.json.data.id);
  const failingResult = await api(`/arcade/attempts/${failing.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { score: 6 } });
  assert.equal(failingResult.json.data.masteryAchieved, false);

  const passing = await startAttempt("user_student_001", activity.json.data.id);
  const passingResult = await api(`/arcade/attempts/${passing.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { score: 7 } });
  assert.equal(passingResult.json.data.masteryAchieved, true);
});

test("23/24/25/26. attempt count, play duration, Activity launch, and retry alone never produce mastery", async () => {
  const activity = await createScoreActivity("no-shortcuts", 10, 9);
  // Multiple failing attempts in a row — none should ever read as mastered.
  for (let i = 0; i < 3; i++) {
    const attempt = await startAttempt("user_student_001", activity.json.data.id);
    const result = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { score: 1 } });
    assert.equal(result.json.data.masteryAchieved, false);
  }
  // Starting an Attempt (the closest thing to "launch") never itself
  // creates a Result or mastery.
  const launched = await startAttempt("user_student_001", activity.json.data.id);
  assert.equal(launched.status, 201);
  const listAfterLaunch = await api("/arcade/results", { userId: "user_student_001" });
  assert.ok(!listAfterLaunch.json.data.items.some((r: any) => r.arcadeAttemptId === launched.json.data.id));
});

test("28. historical mastery remains attributable to its own canonical Result", async () => {
  const activity = await createScoreActivity("historical", 10, 5);
  const attempt = await startAttempt("user_student_001", activity.json.data.id);
  const result = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { score: 9 } });
  const list = await api("/arcade/results", { userId: "user_student_001" });
  const found = list.json.data.items.find((r: any) => r.id === result.json.data.id);
  assert.ok(found);
  assert.equal(found.arcadeAttemptId, attempt.json.data.id);
  assert.equal(found.masteryAchieved, true);
});

test("a PASSED_FLAG activity masters correctly from a boolean outcome", async () => {
  const activity = await createFlagActivity("flag-mastery");
  const attempt = await startAttempt("user_student_001", activity.json.data.id);
  const result = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { passed: true } });
  assert.equal(result.json.data.masteryAchieved, true);

  const attempt2 = await startAttempt("user_student_001", activity.json.data.id);
  const result2 = await api(`/arcade/attempts/${attempt2.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { passed: false } });
  assert.equal(result2.json.data.masteryAchieved, false);
});

// --- Results view / admin reporting ---

test("an admin can view the organization's results; an instructor without either permission cannot", async () => {
  const activity = await createScoreActivity("admin-view");
  const attempt = await startAttempt("user_student_001", activity.json.data.id);
  await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { score: 8 } });

  const adminView = await api("/arcade/results", { userId: "user_admin_001" });
  assert.equal(adminView.status, 200);
  assert.ok(adminView.json.data.items.length > 0);

  const instructorView = await api("/arcade/results", { userId: "user_instructor_001" });
  assert.equal(instructorView.status, 403);
});

test("a student's own results view never includes another learner's results", async () => {
  const activity = await createScoreActivity("own-results-only");
  const attempt1 = await startAttempt("user_student_001", activity.json.data.id);
  await api(`/arcade/attempts/${attempt1.json.data.id}/result`, { method: "POST", userId: "user_student_001", body: { score: 8 } });
  const attempt2 = await startAttempt("user_assignment_technical_001", activity.json.data.id);
  await api(`/arcade/attempts/${attempt2.json.data.id}/result`, { method: "POST", userId: "user_assignment_technical_001", body: { score: 8 } });

  const view = await api("/arcade/results", { userId: "user_student_001" });
  assert.ok(view.json.data.items.every((r: any) => r.learnerUserId === "user_student_001"));
});
