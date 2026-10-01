import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://127.0.0.1:8091";
const RUN = `arcade_leaderboard_${Date.now()}`;
const activitySlug = `${RUN}-scored`;
const flagSlug = `${RUN}-flag`;
const otherActivitySlug = `${RUN}-other`;
const USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_student_001", "org_shf_001", "student@siliconheartland.org", "SHF Student"],
  ["user_assignment_technical_001", "org_shf_001", "technical@test.invalid", "Technical Learner"],
  ["user_no_assignment_001", "org_shf_001", "no-assignment@test.invalid", "No Assignment Learner"],
  ["user_partner_student_001", "org_partner_001", "partner@test.invalid", "Partner Learner"],
] as const;

function auth(userId?: string) { return userId ? { Authorization: `Bearer dev-token:${userId}` } : {}; }

async function api(path: string, options: { method?: string; userId?: string; body?: unknown } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", ...auth(options.userId) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  return { status: response.status, json: await response.json().catch(() => ({})) };
}

async function createActivity(slug: string, masteryRule = "SCORE_THRESHOLD") {
  return api("/arcade/activities", {
    method: "POST", userId: "user_admin_001",
    body: { slug, title: `${RUN} ${slug}`, activityType: "RETRIEVAL", masteryRule, ...(masteryRule === "SCORE_THRESHOLD" ? { maxScore: 10, passThresholdScore: 5 } : {}) },
  });
}

async function recordResult(userId: string, activityId: string, score?: number) {
  const attempt = await api("/arcade/attempts", { method: "POST", userId, body: { activityId } });
  assert.equal(attempt.status, 201, `attempt setup failed: ${JSON.stringify(attempt.json)}`);
  const result = await api(`/arcade/attempts/${attempt.json.data.id}/result`, {
    method: "POST", userId, body: score === undefined ? { passed: true } : { score },
  });
  assert.equal(result.status, 201, `result setup failed: ${JSON.stringify(result.json)}`);
  return result.json.data;
}

async function cleanup() {
  await query(
    `DELETE FROM integration_outbox WHERE subject_id IN
       (SELECT arcade_result_id FROM arcade_results r JOIN arcade_activities a USING (arcade_activity_id) WHERE a.slug IN ($1,$2,$3))`,
    [activitySlug, flagSlug, otherActivitySlug],
  );
  await query("DELETE FROM arcade_results WHERE arcade_activity_id IN (SELECT arcade_activity_id FROM arcade_activities WHERE slug IN ($1,$2,$3))", [activitySlug, flagSlug, otherActivitySlug]);
  await query("DELETE FROM arcade_attempts WHERE arcade_activity_id IN (SELECT arcade_activity_id FROM arcade_activities WHERE slug IN ($1,$2,$3))", [activitySlug, flagSlug, otherActivitySlug]);
  await query("DELETE FROM arcade_activities WHERE slug IN ($1,$2,$3)", [activitySlug, flagSlug, otherActivitySlug]);
}

let scoredActivityId = "";
let flagActivityId = "";
let studentBestResultId = "";
let studentFirstBestAt = "";
let crossOrgResultId = "";
let otherActivityResultId = "";

before(async () => {
  await cleanup();
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
    VALUES ('org_shf_001','Silicon Heartland Foundation','Silicon Heartland Foundation','nonprofit','active'),
           ('org_partner_001','Partner Organization','Partner Organization','partner','active')
    ON CONFLICT (organization_id) DO NOTHING`);
  for (const [userId, organizationId, email, fullName] of USERS) {
    await withSeedRetry(() => query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
      VALUES ($1,$2,$3,$4,'active','local') ON CONFLICT (user_id) DO NOTHING`, [userId, organizationId, email, fullName]));
  }
  const scored = await createActivity(activitySlug);
  assert.equal(scored.status, 201);
  scoredActivityId = scored.json.data.id;
  const flag = await createActivity(flagSlug, "PASSED_FLAG");
  assert.equal(flag.status, 201);
  flagActivityId = flag.json.data.id;
  const otherActivity = await createActivity(otherActivitySlug);
  assert.equal(otherActivity.status, 201);
  otherActivityResultId = (await recordResult("user_student_001", otherActivity.json.data.id, 10)).id;

  await recordResult("user_assignment_technical_001", scoredActivityId, 10);
  const firstStudentTen = await recordResult("user_student_001", scoredActivityId, 10);
  studentBestResultId = firstStudentTen.id;
  studentFirstBestAt = firstStudentTen.createdAt;
  await recordResult("user_student_001", scoredActivityId, 8);
  await recordResult("user_student_001", scoredActivityId, 10);
  await recordResult("user_no_assignment_001", scoredActivityId, 7);
  crossOrgResultId = (await recordResult("user_partner_student_001", scoredActivityId, 10)).id;
  await recordResult("user_student_001", flagActivityId);
});

after(cleanup);

test("leaderboard uses best scored Result per learner and excludes other organizations", async () => {
  const response = await api(`/arcade/leaderboards/activities/${scoredActivityId}`, { userId: "user_admin_001" });
  assert.equal(response.status, 200);
  const items = response.json.data.items;
  assert.equal(items.length, 3);
  assert.deepEqual(items.map((item: any) => item.rank), [1, 1, 3]);
  const student = items.find((item: any) => item.resultId === studentBestResultId);
  assert.equal(student.score, 10);
  assert.equal(student.resultId, studentBestResultId);
  assert.equal(student.achievedAt, new Date(studentFirstBestAt).toISOString());
  assert.ok(student.displayName);
  assert.notEqual(student.displayName, "user_student_001");
  assert.ok(!items.some((item: any) => item.resultId === crossOrgResultId));
  assert.ok(!items.some((item: any) => item.resultId === otherActivityResultId));
});

test("rank is computed before bounded pagination and equal scores share rank", async () => {
  const first = await api(`/arcade/leaderboards/activities/${scoredActivityId}?limit=1&offset=0`, { userId: "user_admin_001" });
  const second = await api(`/arcade/leaderboards/activities/${scoredActivityId}?limit=1&offset=1`, { userId: "user_admin_001" });
  const third = await api(`/arcade/leaderboards/activities/${scoredActivityId}?limit=1&offset=2`, { userId: "user_admin_001" });
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(third.status, 200);
  assert.equal(first.json.data.items[0].rank, 1);
  assert.equal(second.json.data.items[0].rank, 1);
  assert.equal(third.json.data.items[0].rank, 3);
  assert.equal(first.json.data.hasMore, true);
  assert.equal(third.json.data.hasMore, false);
});

test("equal-rank display order is deterministic and the public DTO omits private identity", async () => {
  const response = await api(`/arcade/leaderboards/activities/${scoredActivityId}`, { userId: "user_admin_001" });
  const repeated = await api(`/arcade/leaderboards/activities/${scoredActivityId}`, { userId: "user_admin_001" });
  const items = response.json.data.items;
  const tied = items.filter((item: any) => item.rank === 1);
  assert.deepEqual(items.map((item: any) => item.resultId), repeated.json.data.items.map((item: any) => item.resultId));
  assert.equal(tied.length, 2);
  for (const item of items) {
    assert.deepEqual(Object.keys(item).sort(), ["achievedAt", "displayName", "maxScore", "rank", "resultId", "score"]);
    assert.equal("email" in item, false);
    assert.equal("learnerUserId" in item, false);
  }
});

test("scoreless canonical Results are excluded", async () => {
  const response = await api(`/arcade/leaderboards/activities/${flagActivityId}`, { userId: "user_admin_001" });
  assert.equal(response.status, 200);
  assert.deepEqual(response.json.data.items, []);
});

test("unknown Activity, unauthorized actor, malformed pagination, and client org override fail closed", async () => {
  assert.equal((await api("/arcade/leaderboards/activities/not-a-real-activity", { userId: "user_admin_001" })).status, 404);
  assert.equal((await api(`/arcade/leaderboards/activities/${scoredActivityId}`, { userId: "user_does_not_exist" })).status, 401);
  assert.equal((await api(`/arcade/leaderboards/activities/${scoredActivityId}`, { userId: "user_student_001" })).status, 403);
  assert.equal((await api(`/arcade/leaderboards/activities/${scoredActivityId}?limit=101`, { userId: "user_admin_001" })).status, 400);
  const override = await api(`/arcade/leaderboards/activities/${scoredActivityId}?organizationId=org_partner_001`, { userId: "user_admin_001" });
  assert.equal(override.status, 200);
  assert.ok(!override.json.data.items.some((item: any) => item.resultId === crossOrgResultId));
});

test("inactive Activities remain readable as historical Result context", async () => {
  await query("UPDATE arcade_activities SET status='inactive' WHERE arcade_activity_id=$1", [scoredActivityId]);
  const response = await api(`/arcade/leaderboards/activities/${scoredActivityId}`, { userId: "user_admin_001" });
  assert.equal(response.status, 200);
});

test("leaderboard reads have no score-write route or Result/outbox side effects", async () => {
  const beforeCounts = await query(`SELECT
      (SELECT COUNT(*) FROM arcade_results WHERE arcade_activity_id=$1) AS results,
      (SELECT COUNT(*) FROM integration_outbox WHERE subject_id IN (SELECT arcade_result_id FROM arcade_results WHERE arcade_activity_id=$1)) AS events,
      (SELECT COUNT(*) FROM prepare_prove_evidence WHERE source_type='ARCADE_RESULT' AND source_record_id IN (SELECT arcade_result_id FROM arcade_results WHERE arcade_activity_id=$1)) AS evidence,
      (SELECT COUNT(*) FROM curriculum_truth_facts WHERE source_type='ARCADE_RESULT' AND source_record_id IN (SELECT arcade_result_id FROM arcade_results WHERE arcade_activity_id=$1)) AS truth_facts`, [scoredActivityId]);
  const response = await api(`/arcade/leaderboards/activities/${scoredActivityId}`, { userId: "user_admin_001" });
  assert.equal(response.status, 200);
  const afterCounts = await query(`SELECT
      (SELECT COUNT(*) FROM arcade_results WHERE arcade_activity_id=$1) AS results,
      (SELECT COUNT(*) FROM integration_outbox WHERE subject_id IN (SELECT arcade_result_id FROM arcade_results WHERE arcade_activity_id=$1)) AS events,
      (SELECT COUNT(*) FROM prepare_prove_evidence WHERE source_type='ARCADE_RESULT' AND source_record_id IN (SELECT arcade_result_id FROM arcade_results WHERE arcade_activity_id=$1)) AS evidence,
      (SELECT COUNT(*) FROM curriculum_truth_facts WHERE source_type='ARCADE_RESULT' AND source_record_id IN (SELECT arcade_result_id FROM arcade_results WHERE arcade_activity_id=$1)) AS truth_facts`, [scoredActivityId]);
  assert.deepEqual(afterCounts.rows[0], beforeCounts.rows[0]);
});
