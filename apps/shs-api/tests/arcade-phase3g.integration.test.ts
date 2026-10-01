import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://127.0.0.1:8091";
const RUN = `arcade_phase3g_${Date.now()}`;
const activitySlug = `${RUN}-activity`;
const learningExperienceId = `${RUN}-learning`;
const classicExperienceId = `${RUN}-classic`;
const users = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_student_001", "org_shf_001", "student@siliconheartland.org", "SHF Student"],
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
  await query("DELETE FROM arcade_runtime_sessions WHERE experience_id = ANY($1::text[])", [[learningExperienceId, classicExperienceId]]);
  await query("DELETE FROM integration_outbox WHERE subject_id IN (SELECT arcade_result_id FROM arcade_results r JOIN arcade_activities a USING (arcade_activity_id) WHERE a.slug=$1)", [activitySlug]);
  await query("DELETE FROM curriculum_truth_facts WHERE source_record_id IN (SELECT arcade_result_id FROM arcade_results r JOIN arcade_activities a USING (arcade_activity_id) WHERE a.slug=$1)", [activitySlug]);
  await query("DELETE FROM prepare_prove_evidence WHERE source_record_id IN (SELECT arcade_result_id FROM arcade_results r JOIN arcade_activities a USING (arcade_activity_id) WHERE a.slug=$1)", [activitySlug]);
  await query("DELETE FROM arcade_results WHERE arcade_activity_id IN (SELECT arcade_activity_id FROM arcade_activities WHERE slug=$1)", [activitySlug]);
  await query("DELETE FROM arcade_attempts WHERE arcade_activity_id IN (SELECT arcade_activity_id FROM arcade_activities WHERE slug=$1)", [activitySlug]);
  await query("DELETE FROM arcade_activities WHERE slug=$1", [activitySlug]);
}

before(async () => {
  await cleanup();
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
    VALUES ('org_shf_001','Silicon Heartland Foundation','Silicon Heartland Foundation','nonprofit','active')
    ON CONFLICT (organization_id) DO NOTHING`);
  for (const [userId, organizationId, email, fullName] of users) {
    await withSeedRetry(() => query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
      VALUES ($1,$2,$3,$4,'active','local') ON CONFLICT (user_id) DO NOTHING`, [userId, organizationId, email, fullName]));
  }
});

after(cleanup);

test("Phase 3 Learning Runtime→Result→History/Leaderboard/Replay acceptance", { concurrency: false }, async () => {
  const createdActivity = await api("/arcade/activities", {
    method: "POST", userId: "user_admin_001",
    body: { slug: activitySlug, title: "Phase 3G acceptance activity", activityType: "RETRIEVAL", masteryRule: "SCORE_THRESHOLD", maxScore: 10, passThresholdScore: 7 },
  });
  assert.equal(createdActivity.status, 201, JSON.stringify(createdActivity.json));
  const activityId = createdActivity.json.data.id;

  const started = await api("/arcade/runtime/sessions", {
    method: "POST", userId: "user_student_001",
    body: { family: "learning", sessionType: "game", experienceId: learningExperienceId, activityId, idempotencyKey: `${RUN}-learning-start` },
  });
  assert.equal(started.status, 201, JSON.stringify(started.json));
  const sessionId = started.json.data.session.id;
  assert.equal(started.json.data.session.arcadeActivityId, activityId);
  const reloadedSession = await api(`/arcade/runtime/sessions/${sessionId}`, { userId: "user_student_001" });
  assert.equal(reloadedSession.status, 200);
  assert.equal(reloadedSession.json.data.id, sessionId);

  const firstSave = await api(`/arcade/runtime/sessions/${sessionId}/save`, {
    method: "PUT", userId: "user_student_001", body: { expectedRevision: 0, payload: { checkpoint: "start", level: 1 } },
  });
  assert.equal(firstSave.status, 200);
  assert.equal(firstSave.json.data.revision, 1);
  const firstRead = await api(`/arcade/runtime/sessions/${sessionId}/save`, { userId: "user_student_001" });
  assert.equal(firstRead.json.data.saveState.revision, 1);

  const eventAt = new Date().toISOString();
  const firstEvent = await api(`/arcade/runtime/sessions/${sessionId}/events`, {
    method: "POST", userId: "user_student_001",
    body: { sequence: 1, eventType: "SESSION_STARTED", occurredAt: eventAt, payload: { checkpoint: "start" } },
  });
  assert.equal(firstEvent.status, 201);

  const paused = await api(`/arcade/runtime/sessions/${sessionId}/pause`, { method: "POST", userId: "user_student_001" });
  assert.equal(paused.json.data.session.status, "PAUSED");
  const resumed = await api(`/arcade/runtime/sessions/${sessionId}/resume`, { method: "POST", userId: "user_student_001" });
  assert.equal(resumed.json.data.session.status, "ACTIVE");

  const secondSave = await api(`/arcade/runtime/sessions/${sessionId}/save`, {
    method: "PUT", userId: "user_student_001", body: { expectedRevision: 1, payload: { checkpoint: "resume", level: 2 } },
  });
  assert.equal(secondSave.json.data.revision, 2);
  const staleSave = await api(`/arcade/runtime/sessions/${sessionId}/save`, {
    method: "PUT", userId: "user_student_001", body: { expectedRevision: 1, payload: { checkpoint: "stale" } },
  });
  assert.equal(staleSave.status, 409);
  assert.equal(staleSave.json.error.code, "SAVE_REVISION_CONFLICT");
  assert.equal(staleSave.json.error.currentRevision, 2);

  const secondEvent = await api(`/arcade/runtime/sessions/${sessionId}/events`, {
    method: "POST", userId: "user_student_001",
    body: { sequence: 2, eventType: "CHECKPOINT_REACHED", occurredAt: new Date().toISOString(), payload: { checkpoint: "resume" } },
  });
  assert.equal(secondEvent.status, 201);
  const duplicateEvent = await api(`/arcade/runtime/sessions/${sessionId}/events`, {
    method: "POST", userId: "user_student_001",
    body: { sequence: 2, eventType: "CHECKPOINT_REACHED", occurredAt: new Date().toISOString(), payload: {} },
  });
  assert.equal(duplicateEvent.status, 409);
  assert.equal(duplicateEvent.json.error.code, "RUNTIME_EVENT_SEQUENCE_CONFLICT");
  const events = await api(`/arcade/runtime/sessions/${sessionId}/events`, { userId: "user_student_001" });
  assert.deepEqual(events.json.data.items.map((event: any) => event.sequence), [1, 2]);

  const attempt = await api("/arcade/attempts", { method: "POST", userId: "user_student_001", body: { activityId } });
  assert.equal(attempt.status, 201);
  const submitted = await api(`/arcade/attempts/${attempt.json.data.id}/result`, {
    method: "POST", userId: "user_student_001", body: { score: 8 },
  });
  assert.equal(submitted.status, 201);
  const result = submitted.json.data;
  assert.equal(result.score, 8);
  assert.equal(result.maxScore, 10);
  assert.equal(result.masteryAchieved, true);
  assert.ok(!["xp", "evu", "credits", "wallet", "polygon", "credential"].some((field) => field in result));

  const duplicateResult = await api(`/arcade/attempts/${attempt.json.data.id}/result`, {
    method: "POST", userId: "user_student_001", body: { score: 9 },
  });
  assert.equal(duplicateResult.status, 409);

  const beforeRuntimeComplete = await query("SELECT COUNT(*)::int AS n FROM arcade_results WHERE arcade_result_id=$1", [result.id]);
  const completed = await api(`/arcade/runtime/sessions/${sessionId}/complete`, { method: "POST", userId: "user_student_001" });
  assert.equal(completed.json.data.session.status, "COMPLETED");
  assert.equal((await api(`/arcade/runtime/sessions/${sessionId}/complete`, { method: "POST", userId: "user_student_001" })).json.data.changed, false);
  const afterRuntimeComplete = await query("SELECT COUNT(*)::int AS n FROM arcade_results WHERE arcade_result_id=$1", [result.id]);
  assert.deepEqual(afterRuntimeComplete.rows, beforeRuntimeComplete.rows);
  const invalidTransition = await api(`/arcade/runtime/sessions/${sessionId}/resume`, { method: "POST", userId: "user_student_001" });
  assert.equal(invalidTransition.status, 409);

  const history = await api("/arcade/results?limit=100", { userId: "user_student_001" });
  assert.equal(history.status, 200);
  assert.ok(history.json.data.items.some((item: any) => item.resultId === result.id));
  const leaderboard = await api(`/arcade/leaderboards/activities/${activityId}`, { userId: "user_admin_001" });
  assert.equal(leaderboard.status, 200);
  assert.ok(leaderboard.json.data.items.some((item: any) => item.resultId === result.id));
  const replayResponse = await api(`/arcade/results/${result.id}/replay`, { userId: "user_student_001" });
  assert.equal(replayResponse.status, 200);
  assert.equal(replayResponse.json.data.runtimeSession, null);
  assert.equal(replayResponse.json.data.result.masteryAchieved, true);
  assert.ok(!replayResponse.json.data.timeline.some((event: any) => event.sourceType === "RUNTIME_TELEMETRY"));

  const outbox = await query("SELECT event_type,idempotency_key FROM integration_outbox WHERE subject_id=$1", [result.id]);
  assert.equal(outbox.rows.length, 1);
  assert.equal(outbox.rows[0].event_type, "arcade.resulted");
  assert.equal(outbox.rows[0].idempotency_key, `arcade.resulted:${result.id}`);
  const truthRows = await query("SELECT COUNT(*)::int AS n FROM curriculum_truth_facts WHERE source_record_id=$1", [result.id]);
  assert.equal(truthRows.rows[0].n, 0, "the runtime/history/leaderboard/replay reads do not project evidence/truth");

  const classic = await api("/arcade/runtime/sessions", {
    method: "POST", userId: "user_student_001",
    body: { family: "classic", sessionType: "game", experienceId: classicExperienceId },
  });
  assert.equal(classic.status, 201);
  assert.equal(classic.json.data.session.arcadeActivityId, null);
  const abandoned = await api(`/arcade/runtime/sessions/${classic.json.data.session.id}/abandon`, { method: "POST", userId: "user_student_001" });
  assert.equal(abandoned.json.data.session.status, "ABANDONED");
  const cannotResume = await api(`/arcade/runtime/sessions/${classic.json.data.session.id}/resume`, { method: "POST", userId: "user_student_001" });
  assert.equal(cannotResume.status, 409);
});
