import assert from "node:assert/strict";
import test from "node:test";
import { Pool } from "pg";

const testDatabaseUrl = process.env.SHS_TEST_DATABASE_URL;

async function expectRejected(pool: Pool, sql: string, params: unknown[] = []) {
  await assert.rejects(() => pool.query(sql, params));
}

test("Phase 3 career and completion proof runs against disposable PostgreSQL", {
  timeout: 60_000,
  skip: testDatabaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable PostgreSQL Phase 3 verification",
}, async (t) => {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.SHS_AUTH_ENV = "test";

  const { discoverMigrations, inspectMigrations, runMigrations } = await import("../src/db/migration-runner.ts");
  const { pool } = await import("../src/db/client.ts");
  const { CareerRepo } = await import("../src/domain/careers/repo/career-repo.ts");
  const { registerCareerRoutes } = await import("../src/domain/careers/api/routes.ts");
  const { CurriculumCompletionService } = await import("../src/domain/curriculum/service/curriculum-completion-service.ts");

  t.after(async () => { await pool.end(); });

  const migrations = await discoverMigrations(new URL("../migrations", import.meta.url).pathname);
  assert.equal(migrations.length, 53);
  const migrationClient = await pool.connect();
  try {
    const applied = await runMigrations(migrationClient, migrations);
    assert.equal(applied.pending.length, 0);
    assert.equal(applied.applied.at(-1)?.filename, "053_calendar_feed_tokens.sql");
    const rerun = await runMigrations(migrationClient, migrations);
    assert.equal(rerun.pending.length, 0);
    assert.equal((await inspectMigrations(migrationClient, migrations)).drift.length, 0);
  } finally {
    migrationClient.release();
  }

  const proof = await pool.query(
    `SELECT f.slug AS family_slug, c.slug AS career_slug, r.curriculum_id, r.lesson_id,
            r.min_grade, r.max_grade, r.developmental_stage, r.requirement_type
     FROM career_curriculum_requirements r
     JOIN careers c ON c.career_id = r.career_id
     JOIN career_families f ON f.career_family_id = c.career_family_id
     WHERE c.slug = $1`,
    ["data-center-technician"],
  );
  assert.deepEqual(proof.rows[0], {
    family_slug: "data-center-ai-infrastructure",
    career_slug: "data-center-technician",
    curriculum_id: "data-center-foundations",
    lesson_id: "data-center-foundations-introduction",
    min_grade: 6,
    max_grade: 8,
    developmental_stage: "DISCOVER",
    requirement_type: "recommended",
  });

  const familyId = "career_family_runtime_test";
  const careerId = "career_runtime_test";
  await pool.query("INSERT INTO career_families (career_family_id, slug, name) VALUES ($1,$2,$3)", [familyId, `${familyId}-slug`, "Runtime Test Family"]);
  await pool.query("INSERT INTO careers (career_id, slug, title, career_family_id) VALUES ($1,$2,$3,$4)", [careerId, `${careerId}-slug`, "Runtime Test Career", familyId]);
  await expectRejected(pool, "INSERT INTO careers (career_id, slug, title, career_family_id) VALUES ($1,$2,$3,$4)", ["career_bad_fk", "career-bad-fk", "Bad", "missing-family"]);
  await expectRejected(pool, "INSERT INTO career_curriculum_requirements (career_curriculum_requirement_id, career_id, curriculum_id, lesson_id, requirement_type, min_grade, max_grade, developmental_stage) VALUES ($1,$2,'curriculum','lesson','recommended',9,6,'EXPLORE')", ["req_bad_range", careerId]);
  await expectRejected(pool, "INSERT INTO career_curriculum_requirements (career_curriculum_requirement_id, career_id, curriculum_id, lesson_id, requirement_type, min_grade, max_grade, developmental_stage) VALUES ($1,$2,'curriculum','lesson','unknown',6,8,'DISCOVER')", ["req_bad_type", careerId]);
  await pool.query("DELETE FROM careers WHERE career_id=$1", [careerId]);
  await pool.query("DELETE FROM career_families WHERE career_family_id=$1", [familyId]);

  const repo = new CareerRepo();
  assert.equal((await repo.getBySlug("data-center-technician"))?.slug, "data-center-technician");
  assert.equal((await repo.getBySlug("does-not-exist")), null);
  assert.equal((await repo.listCurriculumRequirements("career_data_center_technician"))[0]?.lesson_id, "data-center-foundations-introduction");

  const routes: Record<string, any> = {};
  registerCareerRoutes({
    get(path: string, handler: any) { routes[path] = handler; },
  });
  async function invoke(path: string, req: any) {
    let statusCode = 200;
    let body: any;
    await routes[path](req, { status(code: number) { statusCode = code; return this; }, json(value: any) { body = value; return value; } }, (error: unknown) => { throw error; });
    return { statusCode, body };
  }
  const apiCareer = await invoke("/careers/:slug", { params: { slug: "data-center-technician" } });
  assert.equal(apiCareer.statusCode, 200);
  assert.equal(apiCareer.body.data.slug, "data-center-technician");
  const apiCurriculum = await invoke("/careers/:slug/curriculum", { params: { slug: "data-center-technician" } });
  assert.equal(apiCurriculum.body.data.requirements[0].min_grade, 6);
  const apiMissing = await invoke("/careers/:slug", { params: { slug: "missing-career" } });
  assert.equal(apiMissing.statusCode, 404);

  const organizationId = "org_phase3_runtime";
  const userId = "user_phase3_runtime";
  await pool.query("INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,$2,$2,'SHF','active')", [organizationId, "Phase 3 Runtime Organization"]);
  await pool.query("INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'active','test')", [userId, organizationId, `${userId}@test.invalid`, "Phase 3 Learner"]);
  const actor = { user_id: userId, organization_id: organizationId, tenant_id: `tenant:${organizationId}` };
  const completion = await new CurriculumCompletionService().complete({
    lessonId: "data-center-foundations-introduction",
    curriculumId: "data-center-foundations",
    actor,
  });
  const rows = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM curriculum_lesson_completions WHERE completion_id=$1) AS completions,
       (SELECT COUNT(*) FROM integration_outbox WHERE outbox_event_id=$2) AS outbox,
       (SELECT event_type FROM integration_outbox WHERE outbox_event_id=$2) AS event_type,
       (SELECT payload_json->>'lesson_id' FROM integration_outbox WHERE outbox_event_id=$2) AS payload_lesson_id`,
    [completion.completion.completion_id, completion.outbox_event_id],
  );
  assert.deepEqual(rows.rows[0], { completions: "1", outbox: "1", event_type: "lesson.completed", payload_lesson_id: null });
  const event = await pool.query("SELECT payload_json FROM integration_outbox WHERE outbox_event_id=$1", [completion.outbox_event_id]);
  const payload = event.rows[0].payload_json;
  assert.equal(payload.payload.completion_id, completion.completion.completion_id);
  assert.equal(payload.payload.slug, "data-center-foundations-introduction");
  assert.equal(payload.tenant_id, `tenant:${organizationId}`);
  assert.equal(payload.originating_actor_id, userId);
  await pool.query("DELETE FROM integration_outbox WHERE organization_id=$1", [organizationId]);
  await pool.query("DELETE FROM curriculum_lesson_completions WHERE organization_id=$1", [organizationId]);
  await pool.query("DELETE FROM users WHERE user_id=$1", [userId]);
  await pool.query("DELETE FROM organizations WHERE organization_id=$1", [organizationId]);
});
