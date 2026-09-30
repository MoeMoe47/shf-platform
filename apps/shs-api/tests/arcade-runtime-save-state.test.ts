import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase3b_${Date.now()}`;
const USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_student_001", "org_shf_001", "student@siliconheartland.org", "SHF Student"],
  ["user_assignment_technical_001", "org_shf_001", "technical@test.invalid", "Technical Learner"],
  ["user_partner_student_001", "org_partner_001", "student@partner.test", "Partner Learner"],
] as const;

function authHeader(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}

async function api(path: string, options: { method?: string; userId?: string; body?: unknown; requestId?: string } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", ...(options.requestId ? { "X-Request-ID": options.requestId } : {}), ...authHeader(options.userId) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function startSession(suffix: string, userId = "user_student_001") {
  const response = await api("/arcade/runtime/sessions", {
    method: "POST",
    userId,
    body: { experienceId: `${RUN}:${suffix}`, family: "classic", sessionType: "game" },
  });
  assert.equal(response.status, 201);
  return response.json.data.session;
}

async function cleanup() {
  await query("DELETE FROM arcade_runtime_sessions WHERE experience_id LIKE $1", [`${RUN}:%`]);
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES ('org_shf_001','Silicon Heartland Foundation','Silicon Heartland Foundation','nonprofit','active'),
            ('org_partner_001','Partner Organization','Partner Organization','partner','active')
     ON CONFLICT (organization_id) DO NOTHING`,
  );
  for (const [userId, organizationId, email, fullName] of USERS) {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1,$2,$3,$4,'active','local') ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, email, fullName],
    ));
  }
});

after(cleanup);

test("owner creates revision 1 with expectedRevision 0 and reads exact operational payload only", async () => {
  const session = await startSession("initial");
  const beforeSession = await api(`/arcade/runtime/sessions/${session.id}`, { userId: "user_student_001" });
  const noSave = await api(`/arcade/runtime/sessions/${session.id}/save`, { userId: "user_student_001" });
  assert.equal(noSave.status, 200);
  assert.equal(noSave.json.data.saveState, null);

  const payload = { level: 3, checkpoint: { id: "bridge", items: ["key", "map"] }, settings: { captions: true } };
  const saved = await api(`/arcade/runtime/sessions/${session.id}/save`, {
    method: "PUT", userId: "user_student_001",
    body: { expectedRevision: 0, payload, userId: "user_partner_student_001", organizationId: "org_partner_001" },
  });
  assert.equal(saved.status, 200);
  assert.equal(saved.json.data.revision, 1);
  assert.deepEqual(saved.json.data.payload, payload);
  assert.equal(saved.json.data.sessionId, session.id);
  assert.ok(saved.json.data.savedAt);
  assert.equal("userId" in saved.json.data, false);
  assert.equal("organizationId" in saved.json.data, false);

  const read = await api(`/arcade/runtime/sessions/${session.id}/save`, { userId: "user_student_001" });
  assert.deepEqual(read.json.data.saveState.payload, payload);
  assert.equal(read.json.data.saveState.revision, 1);
  assert.equal(read.json.data.saveState.sessionId, session.id);
  const afterSession = await api(`/arcade/runtime/sessions/${session.id}`, { userId: "user_student_001" });
  assert.equal(afterSession.json.data.status, beforeSession.json.data.status);
  assert.equal(afterSession.json.data.version, beforeSession.json.data.version);
  assert.equal("resultId" in read.json.data.saveState, false);
  assert.equal("masteryAchieved" in read.json.data.saveState, false);
});

test("revision increments atomically and stale writes preserve the newer payload", async () => {
  const session = await startSession("stale");
  const first = await api(`/arcade/runtime/sessions/${session.id}/save`, { method: "PUT", userId: "user_student_001", body: { expectedRevision: 0, payload: { value: "first" } } });
  assert.equal(first.json.data.revision, 1);
  const second = await api(`/arcade/runtime/sessions/${session.id}/save`, { method: "PUT", userId: "user_student_001", body: { expectedRevision: 1, payload: { value: "second" } } });
  assert.equal(second.status, 200, JSON.stringify(second.json));
  assert.equal(second.json.data.revision, 2);
  const requestId = `${RUN}:stale-write-request`;
  const stale = await api(`/arcade/runtime/sessions/${session.id}/save`, { method: "PUT", userId: "user_student_001", requestId, body: { expectedRevision: 1, payload: { value: "stale" } } });
  assert.equal(stale.status, 409);
  assert.equal(stale.json.error.code, "SAVE_REVISION_CONFLICT");
  assert.equal(stale.json.error.currentRevision, 2);
  assert.equal(stale.json.correlation_id, requestId);
  assert.notEqual(stale.json.correlation_id, "corr_dev");
  const read = await api(`/arcade/runtime/sessions/${session.id}/save`, { userId: "user_student_001" });
  assert.equal(read.json.data.saveState.revision, 2);
  assert.deepEqual(read.json.data.saveState.payload, { value: "second" });
});

test("concurrent writes at one expected revision allow exactly one update", async () => {
  const session = await startSession("race");
  const outcomes = await Promise.all([
    api(`/arcade/runtime/sessions/${session.id}/save`, { method: "PUT", userId: "user_student_001", body: { expectedRevision: 0, payload: { writer: "a" } } }),
    api(`/arcade/runtime/sessions/${session.id}/save`, { method: "PUT", userId: "user_student_001", body: { expectedRevision: 0, payload: { writer: "b" } } }),
  ]);
  assert.deepEqual(outcomes.map((item) => item.status).sort(), [200, 409]);
  const read = await api(`/arcade/runtime/sessions/${session.id}/save`, { userId: "user_student_001" });
  assert.equal(read.json.data.saveState.revision, 1);
  assert.ok(["a", "b"].includes(read.json.data.saveState.payload.writer));
});

test("save access is owner/org scoped and unknown sessions fail closed", async () => {
  const session = await startSession("scope");
  for (const userId of ["user_assignment_technical_001", "user_partner_student_001"]) {
    const read = await api(`/arcade/runtime/sessions/${session.id}/save`, { userId });
    const write = await api(`/arcade/runtime/sessions/${session.id}/save`, { method: "PUT", userId, body: { expectedRevision: 0, payload: { forged: true } } });
    assert.equal(read.status, 404);
    assert.equal(write.status, 404);
  }
  const missing = await api(`/arcade/runtime/sessions/${RUN}:unknown/save`, { userId: "user_student_001" });
  assert.equal(missing.status, 404);
  const anonymous = await api(`/arcade/runtime/sessions/${session.id}/save`);
  assert.notEqual(anonymous.status, 200);
});

test("payload, revision, and size validation fail closed", async () => {
  const session = await startSession("validation");
  const cases: unknown[] = [
    { expectedRevision: -1, payload: {} },
    { expectedRevision: 0.5, payload: {} },
    { payload: {} },
    { expectedRevision: 0 },
    { expectedRevision: 0, payload: [] },
    { expectedRevision: 0, payload: null },
    { expectedRevision: 0, payload: { text: "x".repeat(64 * 1024) } },
  ];
  for (const body of cases) {
    const response = await api(`/arcade/runtime/sessions/${session.id}/save`, { method: "PUT", userId: "user_student_001", body });
    assert.ok(response.status >= 400, JSON.stringify(body).slice(0, 80));
  }
  const empty = await api(`/arcade/runtime/sessions/${session.id}/save`, { userId: "user_student_001" });
  assert.equal(empty.json.data.saveState, null);
});

test("ACTIVE and PAUSED allow writes; terminal sessions reject them", async () => {
  const active = await startSession("active");
  assert.equal((await api(`/arcade/runtime/sessions/${active.id}/save`, { method: "PUT", userId: "user_student_001", body: { expectedRevision: 0, payload: { ok: true } } })).status, 200);

  const paused = await startSession("paused");
  await api(`/arcade/runtime/sessions/${paused.id}/pause`, { method: "POST", userId: "user_student_001" });
  assert.equal((await api(`/arcade/runtime/sessions/${paused.id}/save`, { method: "PUT", userId: "user_student_001", body: { expectedRevision: 0, payload: { ok: true } } })).status, 200);

  for (const [suffix, action] of [["completed", "complete"], ["abandoned", "abandon"]]) {
    const terminal = await startSession(suffix);
    await api(`/arcade/runtime/sessions/${terminal.id}/${action}`, { method: "POST", userId: "user_student_001" });
    const read = await api(`/arcade/runtime/sessions/${terminal.id}/save`, { userId: "user_student_001" });
    const write = await api(`/arcade/runtime/sessions/${terminal.id}/save`, { method: "PUT", userId: "user_student_001", body: { expectedRevision: 0, payload: { shouldNotWrite: true } } });
    assert.equal(read.status, 200);
    assert.equal(read.json.data.saveState, null);
    assert.equal(write.status, 409);
    assert.equal(write.json.error.code, "SAVE_SESSION_NOT_WRITABLE");
  }

  const expired = await startSession("expired");
  await query("UPDATE arcade_runtime_sessions SET status='EXPIRED' WHERE runtime_session_id=$1", [expired.id]);
  const expiredWrite = await api(`/arcade/runtime/sessions/${expired.id}/save`, { method: "PUT", userId: "user_student_001", body: { expectedRevision: 0, payload: { shouldNotWrite: true } } });
  assert.equal(expiredWrite.status, 409);
  assert.equal(expiredWrite.json.error.code, "SAVE_SESSION_NOT_WRITABLE");
});

test("save writes create no Arcade Result and do not alter session lifecycle", async () => {
  const beforeResults = await query("SELECT COUNT(*) AS count FROM arcade_results WHERE learner_user_id='user_student_001' AND organization_id='org_shf_001'");
  const session = await startSession("no-outcome");
  const saved = await api(`/arcade/runtime/sessions/${session.id}/save`, { method: "PUT", userId: "user_student_001", body: { expectedRevision: 0, payload: { progress: 1 } } });
  assert.equal(saved.status, 200);
  const after = await api(`/arcade/runtime/sessions/${session.id}`, { userId: "user_student_001" });
  assert.equal(after.json.data.status, "ACTIVE");
  assert.equal(after.json.data.version, session.version);
  assert.equal("resultId" in saved.json.data, false);
  assert.equal("masteryAchieved" in saved.json.data, false);
  const afterResults = await query("SELECT COUNT(*) AS count FROM arcade_results WHERE learner_user_id='user_student_001' AND organization_id='org_shf_001'");
  assert.equal(Number(afterResults.rows[0].count), Number(beforeResults.rows[0].count));
});
