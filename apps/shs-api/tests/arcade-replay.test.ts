import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://127.0.0.1:8091";
const RUN = `arcade_replay_${Date.now()}`;
const slug = `${RUN}-activity`;
const experienceId = `${RUN}-experience`;
const USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_student_001", "org_shf_001", "student@siliconheartland.org", "SHF Student"],
  ["user_assignment_technical_001", "org_shf_001", "technical@test.invalid", "Technical Learner"],
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

async function cleanup() {
  await query("DELETE FROM arcade_runtime_sessions WHERE experience_id=$1", [experienceId]);
  await query(`DELETE FROM integration_outbox WHERE subject_id IN
    (SELECT r.arcade_result_id FROM arcade_results r JOIN arcade_activities a USING (arcade_activity_id) WHERE a.slug=$1)`, [slug]);
  await query("DELETE FROM arcade_results WHERE arcade_activity_id IN (SELECT arcade_activity_id FROM arcade_activities WHERE slug=$1)", [slug]);
  await query("DELETE FROM arcade_attempts WHERE arcade_activity_id IN (SELECT arcade_activity_id FROM arcade_activities WHERE slug=$1)", [slug]);
  await query("DELETE FROM arcade_activities WHERE slug=$1", [slug]);
}

let activityId = "";
let learnerResult: any;
let partnerResultId = "";
let coincidentRuntimeSessionId = "";

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
  const created = await api("/arcade/activities", {
    method: "POST", userId: "user_admin_001",
    body: { slug, title: "Replay fixture", activityType: "RETRIEVAL", masteryRule: "SCORE_THRESHOLD", maxScore: 10, passThresholdScore: 7 },
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  activityId = created.json.data.id;

  const runtime = await api("/arcade/runtime/sessions", {
    method: "POST", userId: "user_student_001",
    body: { family: "learning", sessionType: "game", experienceId, activityId },
  });
  assert.equal(runtime.status, 201, JSON.stringify(runtime.json));
  coincidentRuntimeSessionId = runtime.json.data.session.id;
  const observation = await api(`/arcade/runtime/sessions/${coincidentRuntimeSessionId}/events`, {
    method: "POST", userId: "user_student_001",
    body: { sequence: 1, eventType: "SESSION_STARTED", occurredAt: new Date().toISOString(), payload: {} },
  });
  assert.equal(observation.status, 201, JSON.stringify(observation.json));

  async function record(userId: string, score: number) {
    const attempt = await api("/arcade/attempts", { method: "POST", userId, body: { activityId } });
    assert.equal(attempt.status, 201, JSON.stringify(attempt.json));
    const result = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId, body: { score } });
    assert.equal(result.status, 201, JSON.stringify(result.json));
    return result.json.data;
  }
  learnerResult = await record("user_student_001", 6);
  partnerResultId = (await record("user_partner_student_001", 9)).id;
});

after(cleanup);

test("Result replay exposes canonical Result, its own Attempt and Activity, and source-attributed timeline", async () => {
  const response = await api(`/arcade/results/${learnerResult.id}/replay`, { userId: "user_student_001" });
  assert.equal(response.status, 200, JSON.stringify(response.json));
  const replay = response.json.data;
  assert.deepEqual(replay.result, {
    id: learnerResult.id,
    attemptId: learnerResult.arcadeAttemptId,
    activityId,
    score: 6,
    maxScore: 10,
    passed: null,
    masteryAchieved: false,
    createdAt: learnerResult.createdAt,
  });
  assert.equal(replay.attempt.id, learnerResult.arcadeAttemptId);
  assert.equal(replay.attempt.status, "COMPLETED");
  assert.ok(replay.attempt.completedAt);
  assert.equal(replay.activity.id, activityId);
  assert.equal(replay.activity.slug, slug);
  assert.equal(replay.runtimeSession, null);
  assert.match(replay.provenance.runtimeSessionNote, /not canonically available/);
  assert.ok(!replay.timeline.some((event: any) => event.sourceType === "RUNTIME_TELEMETRY"));
  const startEvent = replay.timeline.find((event: any) => event.kind === "ATTEMPT_STARTED");
  const completedEvent = replay.timeline.find((event: any) => event.kind === "ATTEMPT_COMPLETED");
  assert.deepEqual(startEvent.details, {}, "start event must not use the Attempt's final status");
  assert.equal(startEvent.occurredAt, replay.attempt.startedAt);
  assert.equal(completedEvent.occurredAt, replay.attempt.completedAt);
  assert.deepEqual(completedEvent.details, { status: replay.attempt.status });
  assert.deepEqual(replay.timeline.map((event: any) => event.kind), ["ATTEMPT_STARTED", "ATTEMPT_COMPLETED", "RESULT_RECORDED", "SCORE_RECORDED", "MASTERY_RECORDED"]);
  assert.deepEqual([...replay.timeline].sort((a: any, b: any) => a.occurredAt.localeCompare(b.occurredAt)
    || ["ATTEMPT_STARTED", "ATTEMPT_COMPLETED", "RESULT_RECORDED", "SCORE_RECORDED", "MASTERY_RECORDED"].indexOf(a.kind)
    - ["ATTEMPT_STARTED", "ATTEMPT_COMPLETED", "RESULT_RECORDED", "SCORE_RECORDED", "MASTERY_RECORDED"].indexOf(b.kind)), replay.timeline);
  assert.ok(replay.timeline.every((event: any) => event.sourceType && event.sourceId));
  assert.equal(replay.timeline.at(-1).details.masteryAchieved, false);
  const repeated = await api(`/arcade/results/${learnerResult.id}/replay`, { userId: "user_student_001" });
  assert.deepEqual(repeated.json.data.timeline, replay.timeline);
  assert.ok(!JSON.stringify(replay).includes("@"), "private email must not be returned");
});

test("learner access is self-scoped; authorized reviewer access remains organization-scoped", async () => {
  assert.equal((await api(`/arcade/results/${learnerResult.id}/replay`, { userId: "user_assignment_technical_001" })).status, 404);
  assert.equal((await api(`/arcade/results/${learnerResult.id}/replay`, { userId: "user_admin_001" })).status, 200);
  assert.equal((await api(`/arcade/results/${partnerResultId}/replay`, { userId: "user_admin_001" })).status, 404);
  assert.ok((await api(`/arcade/results/${learnerResult.id}/replay`)).status >= 400);
  assert.equal((await api(`/arcade/results/not-a-result/replay`, { userId: "user_student_001" })).status, 404);
});

test("replay reads do not create or mutate Result, Attempt, or outbox records", async () => {
  const beforeCounts = await query(`SELECT
      (SELECT COUNT(*)::int FROM arcade_results WHERE arcade_result_id=$1) AS result_count,
      (SELECT COUNT(*)::int FROM arcade_attempts WHERE arcade_attempt_id=$2) AS attempt_count,
      (SELECT COUNT(*)::int FROM integration_outbox WHERE subject_id=$1) AS outbox_count,
      (SELECT COUNT(*)::int FROM curriculum_truth_facts WHERE source_record_id=$1) AS evidence_projection_count,
      (SELECT COUNT(*)::int FROM arcade_runtime_events WHERE session_id=$3) AS runtime_event_count,
      (SELECT status FROM arcade_runtime_sessions WHERE runtime_session_id=$3) AS runtime_status`,
    [learnerResult.id, learnerResult.arcadeAttemptId, coincidentRuntimeSessionId]);
  const replay = await api(`/arcade/results/${learnerResult.id}/replay`, { userId: "user_student_001" });
  assert.equal(replay.status, 200);
  const afterCounts = await query(`SELECT
      (SELECT COUNT(*)::int FROM arcade_results WHERE arcade_result_id=$1) AS result_count,
      (SELECT COUNT(*)::int FROM arcade_attempts WHERE arcade_attempt_id=$2) AS attempt_count,
      (SELECT COUNT(*)::int FROM integration_outbox WHERE subject_id=$1) AS outbox_count,
      (SELECT COUNT(*)::int FROM curriculum_truth_facts WHERE source_record_id=$1) AS evidence_projection_count,
      (SELECT COUNT(*)::int FROM arcade_runtime_events WHERE session_id=$3) AS runtime_event_count,
      (SELECT status FROM arcade_runtime_sessions WHERE runtime_session_id=$3) AS runtime_status`,
    [learnerResult.id, learnerResult.arcadeAttemptId, coincidentRuntimeSessionId]);
  assert.deepEqual(afterCounts.rows[0], beforeCounts.rows[0]);
});
