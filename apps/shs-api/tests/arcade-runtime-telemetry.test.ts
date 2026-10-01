import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase3c_${Date.now()}`;
const USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_student_001", "org_shf_001", "student@siliconheartland.org", "SHF Student"],
  ["user_assignment_technical_001", "org_shf_001", "technical@test.invalid", "Technical Learner"],
  ["user_partner_student_001", "org_partner_001", "student@partner.test", "Partner Learner"],
] as const;

function authHeader(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}

async function api(path: string, options: { method?: string; userId?: string; body?: unknown } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", ...authHeader(options.userId) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function startSession(suffix: string, userId = "user_student_001") {
  const response = await api("/arcade/runtime/sessions", {
    method: "POST", userId,
    body: { experienceId: `${RUN}:${suffix}`, family: "classic", sessionType: "game" },
  });
  assert.equal(response.status, 201);
  return response.json.data.session;
}

const observedAt = () => new Date(Date.now() - 30_000).toISOString();

async function append(sessionId: string, sequence: number, eventType = "INTERACTION", payload: unknown = { target: "checkpoint", action: "inspect" }, userId = "user_student_001", occurredAt = observedAt()) {
  return api(`/arcade/runtime/sessions/${sessionId}/events`, {
    method: "POST", userId,
    body: { sequence, eventType, occurredAt, payload },
  });
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

test("owner appends contiguous events and server records receipt time separately", async () => {
  const session = await startSession("append");
  const occurredAt = observedAt();
  const first = await append(session.id, 1, "SESSION_STARTED", { entry: "runtime" }, "user_student_001", occurredAt);
  assert.equal(first.status, 201);
  assert.equal(first.json.data.sequence, 1);
  assert.equal(first.json.data.eventType, "SESSION_STARTED");
  assert.equal(first.json.data.occurredAt, occurredAt);
  assert.ok(first.json.data.serverReceivedAt);
  assert.notEqual(first.json.data.serverReceivedAt, first.json.data.occurredAt);
  assert.equal("organizationId" in first.json.data, false);
  assert.equal("tenantId" in first.json.data, false);
  assert.equal("userId" in first.json.data, false);

  const second = await append(session.id, 2, "CHECKPOINT_REACHED", { checkpointId: "switchyard-2" });
  assert.equal(second.status, 201);
  assert.equal(second.json.data.sequence, 2);
});

test("duplicate, skipped, and out-of-order sequence values conflict without inserting rows", async () => {
  const session = await startSession("sequence");
  assert.equal((await append(session.id, 1)).status, 201);
  for (const sequence of [1, 3, 0]) {
    const conflict = await append(session.id, sequence);
    assert.equal(conflict.status, sequence === 0 ? 400 : 409);
    if (sequence !== 0) {
      assert.equal(conflict.json.error.code, "RUNTIME_EVENT_SEQUENCE_CONFLICT");
      assert.equal(conflict.json.error.currentSequence, 1);
      assert.equal(conflict.json.error.expectedSequence, 2);
    }
  }
  assert.equal((await append(session.id, 2, "LEVEL_COMPLETED", { level: 1 })).status, 201);
});

test("two concurrent writers using one sequence yield exactly one accepted event", async () => {
  const session = await startSession("race");
  const results = await Promise.all([
    append(session.id, 1, "INTERACTION", { writer: "one" }),
    append(session.id, 1, "INTERACTION", { writer: "two" }),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  const rows = await query("SELECT COUNT(*) AS count FROM arcade_runtime_events WHERE session_id=$1 AND sequence=1", [session.id]);
  assert.equal(Number(rows.rows[0].count), 1);
});

test("event type, payload, sensitive keys, and payload size are validated", async () => {
  const session = await startSession("validation");
  const invalid = [
    { eventType: "unknown.event", payload: {} },
    { eventType: "LEVEL COMPLETED", payload: {} },
    { eventType: "INTERACTION", payload: null },
    { eventType: "INTERACTION", payload: [] },
    { eventType: "INTERACTION", payload: { authorization: "Bearer secret" } },
    { eventType: "INTERACTION", payload: { nested: { clipboard: "private" } } },
    { eventType: "INTERACTION", payload: { access_token: "secret" } },
    { eventType: "INTERACTION", payload: { essay: "personal response" } },
    { eventType: "INTERACTION", payload: { text: "x".repeat(16 * 1024) } },
  ];
  for (const item of invalid) {
    const response = await append(session.id, 1, item.eventType, item.payload);
    assert.ok(response.status >= 400);
  }
  const valid = await append(session.id, 1, "INTERACTION", { checkpointId: "safe" });
  assert.equal(valid.status, 201);
});

test("occurredAt must be valid ISO time and cannot be more than five minutes ahead", async () => {
  const session = await startSession("time");
  assert.equal((await append(session.id, 1, "INTERACTION", {}, "user_student_001", "not-a-time")).status, 400);
  assert.equal((await append(session.id, 1, "INTERACTION", {}, "user_student_001", "2026-02-31T12:00:00.000Z")).status, 400);
  const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  assert.equal((await append(session.id, 1, "INTERACTION", {}, "user_student_001", future)).status, 400);
  assert.equal((await append(session.id, 1, "INTERACTION", {}, "user_student_001", observedAt())).status, 201);
});

test("event writes and reads are owner and organization scoped", async () => {
  const session = await startSession("scope");
  assert.equal((await append(session.id, 1)).status, 201);
  for (const userId of ["user_assignment_technical_001", "user_partner_student_001"]) {
    assert.equal((await append(session.id, 2, "INTERACTION", {}, userId)).status, 404);
    assert.equal((await api(`/arcade/runtime/sessions/${session.id}/events`, { userId })).status, 404);
  }
  assert.equal((await append(`${RUN}:missing`, 1)).status, 404);
  assert.notEqual((await api(`/arcade/runtime/sessions/${session.id}/events`)).status, 200);
});

test("ACTIVE accepts telemetry; PAUSED and terminal sessions reject writes", async () => {
  const active = await startSession("active");
  assert.equal((await append(active.id, 1)).status, 201);

  const paused = await startSession("paused");
  await api(`/arcade/runtime/sessions/${paused.id}/pause`, { method: "POST", userId: "user_student_001" });
  assert.equal((await append(paused.id, 1)).status, 409);

  for (const [suffix, action] of [["completed", "complete"], ["abandoned", "abandon"]]) {
    const terminal = await startSession(suffix);
    await api(`/arcade/runtime/sessions/${terminal.id}/${action}`, { method: "POST", userId: "user_student_001" });
    assert.equal((await append(terminal.id, 1)).status, 409);
  }
  const expired = await startSession("expired");
  await query("UPDATE arcade_runtime_sessions SET status='EXPIRED' WHERE runtime_session_id=$1", [expired.id]);
  assert.equal((await append(expired.id, 1)).status, 409);
});

test("owner event reads are ordered, bounded, and cursor-paginated", async () => {
  const session = await startSession("read");
  for (const sequence of [1, 2, 3]) assert.equal((await append(session.id, sequence)).status, 201);
  const firstPage = await api(`/arcade/runtime/sessions/${session.id}/events?limit=2`, { userId: "user_student_001" });
  assert.deepEqual(firstPage.json.data.items.map((item: any) => item.sequence), [1, 2]);
  assert.equal(firstPage.json.data.nextAfterSequence, 2);
  const secondPage = await api(`/arcade/runtime/sessions/${session.id}/events?afterSequence=2&limit=2`, { userId: "user_student_001" });
  assert.deepEqual(secondPage.json.data.items.map((item: any) => item.sequence), [3]);
});

test("telemetry does not mutate lifecycle, save state, Results, Evidence facts, or outbox", async () => {
  const session = await startSession("no-side-effects");
  const before = await Promise.all([
    query("SELECT COUNT(*) AS count FROM arcade_results WHERE learner_user_id='user_student_001' AND organization_id='org_shf_001'"),
    query("SELECT COUNT(*) AS count FROM curriculum_truth_facts WHERE learner_user_id='user_student_001' AND organization_id='org_shf_001'"),
    query("SELECT COUNT(*) AS count FROM integration_outbox WHERE organization_id='org_shf_001' AND event_type='arcade.resulted'"),
  ]);
  const saved = await api(`/arcade/runtime/sessions/${session.id}/save`, { method: "PUT", userId: "user_student_001", body: { expectedRevision: 0, payload: { progress: 4 } } });
  assert.equal(saved.status, 200);
  assert.equal((await append(session.id, 1, "SESSION_COMPLETED", { observed: true })).status, 201);
  const after = await Promise.all([
    query("SELECT COUNT(*) AS count FROM arcade_results WHERE learner_user_id='user_student_001' AND organization_id='org_shf_001'"),
    query("SELECT COUNT(*) AS count FROM curriculum_truth_facts WHERE learner_user_id='user_student_001' AND organization_id='org_shf_001'"),
    query("SELECT COUNT(*) AS count FROM integration_outbox WHERE organization_id='org_shf_001' AND event_type='arcade.resulted'"),
  ]);
  assert.deepEqual(after.map((result) => Number(result.rows[0].count)), before.map((result) => Number(result.rows[0].count)));
  const current = await api(`/arcade/runtime/sessions/${session.id}`, { userId: "user_student_001" });
  assert.equal(current.json.data.status, "ACTIVE");
  assert.equal(current.json.data.version, session.version);
  const save = await api(`/arcade/runtime/sessions/${session.id}/save`, { userId: "user_student_001" });
  assert.equal(save.json.data.saveState.revision, 1);
});
