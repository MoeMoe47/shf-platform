import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase3a_${Date.now()}`;
const USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_instructor_001", "org_shf_001", "instructor@siliconheartland.org", "SHF Instructor"],
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
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function cleanup() {
  await query("DELETE FROM arcade_runtime_sessions WHERE experience_id LIKE $1", [`${RUN}:%`]);
  await query("DELETE FROM arcade_activities WHERE slug LIKE $1", [`%-${RUN}`]);
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

test("authenticated session start derives user and tenant scope; Classic identity stays separate from Activity", async () => {
  const experienceId = `${RUN}:classic-start`;
  const created = await api("/arcade/runtime/sessions", {
    method: "POST",
    userId: "user_student_001",
    body: {
      experienceId,
      family: "classic",
      sessionType: "game",
      userId: "user_partner_student_001",
      organizationId: "org_partner_001",
      status: "COMPLETED",
    },
  });
  assert.equal(created.status, 201);
  const session = created.json.data.session;
  assert.equal(session.userId, "user_student_001");
  assert.equal(session.organizationId, "org_shf_001");
  assert.equal(session.tenantId, "tenant:org_shf_001");
  assert.equal(session.experienceId, experienceId);
  assert.equal(session.arcadeActivityId, null);
  assert.equal(session.status, "ACTIVE");
  assert.equal(session.version, 1);
  assert.equal("masteryAchieved" in session, false);
  assert.equal("resultId" in session, false);
});

test("session start is idempotent within owner/org and rejects key reuse for another identity", async () => {
  const body = { experienceId: `${RUN}:classic-idempotent`, family: "classic", sessionType: "game", idempotencyKey: `${RUN}:start-key` };
  const first = await api("/arcade/runtime/sessions", { method: "POST", userId: "user_student_001", body });
  const replay = await api("/arcade/runtime/sessions", { method: "POST", userId: "user_student_001", body });
  assert.equal(first.status, 201);
  assert.equal(replay.status, 200);
  assert.equal(replay.json.data.reused, true);
  assert.equal(replay.json.data.session.id, first.json.data.session.id);

  const conflict = await api("/arcade/runtime/sessions", {
    method: "POST", userId: "user_student_001",
    body: { ...body, experienceId: `${RUN}:different-game` },
  });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.json.error.code, "IDEMPOTENCY_KEY_REUSED");
});

test("Learning runtime binds only a real active Arcade Activity; nonexistent IDs fail closed", async () => {
  const activityResponse = await api("/arcade/activities", {
    method: "POST", userId: "user_admin_001",
    body: { slug: `runtime-${RUN}`, title: "Runtime Test Activity", activityType: "RETRIEVAL", masteryRule: "PASSED_FLAG" },
  });
  assert.equal(activityResponse.status, 201);
  const activityId = activityResponse.json.data.id;
  const started = await api("/arcade/runtime/sessions", {
    method: "POST", userId: "user_student_001",
    body: { experienceId: `${RUN}:learning`, family: "learning", sessionType: "game", activityId },
  });
  assert.equal(started.status, 201);
  assert.equal(started.json.data.session.arcadeActivityId, activityId);

  const fabricated = await api("/arcade/runtime/sessions", {
    method: "POST", userId: "user_student_001",
    body: { experienceId: `${RUN}:learning-fake`, family: "learning", sessionType: "game", activityId: `${RUN}:not-an-activity` },
  });
  assert.equal(fabricated.status, 404);
  assert.equal(fabricated.json.error.code, "ACTIVITY_NOT_FOUND");

  const classicWithActivity = await api("/arcade/runtime/sessions", {
    method: "POST", userId: "user_student_001",
    body: { experienceId: `${RUN}:classic-invalid`, family: "classic", sessionType: "game", activityId },
  });
  assert.equal(classicWithActivity.status, 400);
});

test("runtime reads are authenticated, owner-scoped, and organization-isolated", async () => {
  const started = await api("/arcade/runtime/sessions", {
    method: "POST", userId: "user_student_001",
    body: { experienceId: `${RUN}:owner-read`, family: "classic", sessionType: "game" },
  });
  const id = started.json.data.session.id;
  const own = await api(`/arcade/runtime/sessions/${id}`, { userId: "user_student_001" });
  assert.equal(own.status, 200);
  assert.equal(own.json.data.id, id);

  const anotherLearner = await api(`/arcade/runtime/sessions/${id}`, { userId: "user_assignment_technical_001" });
  assert.equal(anotherLearner.status, 404);
  const otherOrg = await api(`/arcade/runtime/sessions/${id}`, { userId: "user_partner_student_001" });
  assert.equal(otherOrg.status, 404);
  const anonymous = await api(`/arcade/runtime/sessions/${id}`);
  assert.notEqual(anonymous.status, 200);

  const list = await api("/arcade/runtime/sessions?status=ACTIVE", { userId: "user_student_001" });
  assert.ok(list.json.data.items.every((item: any) => item.userId === "user_student_001" && item.organizationId === "org_shf_001" && item.status === "ACTIVE"));
});

test("lifecycle transitions are bounded and runtime completion creates no Result", async () => {
  const beforeResultCount = await query("SELECT COUNT(*) AS count FROM arcade_results WHERE learner_user_id='user_student_001' AND organization_id='org_shf_001'");
  const started = await api("/arcade/runtime/sessions", {
    method: "POST", userId: "user_student_001",
    body: { experienceId: `${RUN}:lifecycle`, family: "classic", sessionType: "game" },
  });
  const id = started.json.data.session.id;

  const paused = await api(`/arcade/runtime/sessions/${id}/pause`, { method: "POST", userId: "user_student_001" });
  assert.equal(paused.status, 200);
  assert.equal(paused.json.data.session.status, "PAUSED");
  const resumed = await api(`/arcade/runtime/sessions/${id}/resume`, { method: "POST", userId: "user_student_001" });
  assert.equal(resumed.json.data.session.status, "ACTIVE");
  const completed = await api(`/arcade/runtime/sessions/${id}/complete`, { method: "POST", userId: "user_student_001" });
  assert.equal(completed.json.data.session.status, "COMPLETED");
  assert.ok(completed.json.data.session.completedAt);
  const repeated = await api(`/arcade/runtime/sessions/${id}/complete`, { method: "POST", userId: "user_student_001" });
  assert.equal(repeated.status, 200);
  assert.equal(repeated.json.data.changed, false);
  const invalidResume = await api(`/arcade/runtime/sessions/${id}/resume`, { method: "POST", userId: "user_student_001" });
  assert.equal(invalidResume.status, 409);

  const afterResultCount = await query("SELECT COUNT(*) AS count FROM arcade_results WHERE learner_user_id='user_student_001' AND organization_id='org_shf_001'");
  assert.equal(Number(afterResultCount.rows[0].count), Number(beforeResultCount.rows[0].count));
});
