import assert from "node:assert/strict";
import test from "node:test";
import { Pool } from "pg";

const apiUrl = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const databaseUrl = process.env.SHS_TEST_DATABASE_URL;

test("Phase 4 authenticated Career-to-Curriculum HTTP flow persists one completion and outbox event", {
  timeout: 30_000,
  skip: apiUrl && databaseUrl ? false : "SHS_TEST_API_URL and SHS_TEST_DATABASE_URL are required for full-stack disposable verification",
}, async (t) => {
  const pool = new Pool({ connectionString: databaseUrl });
  const organizationId = "org_shf_001";
  const userId = "user_student_001";
  const lessonId = "data-center-foundations-introduction";
  const curriculumId = "data-center-foundations";

  await pool.query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES ($1, 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'SHF', 'active')
     ON CONFLICT (organization_id) DO NOTHING`,
    [organizationId],
  );
  await pool.query(
    `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
     VALUES ($1, $2, 'student@siliconheartland.org', 'SHF Demo Student', 'active', 'test')
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, organizationId],
  );

  t.after(async () => {
    await pool.query("DELETE FROM integration_outbox WHERE organization_id=$1 AND originating_actor_id=$2", [organizationId, userId]);
    await pool.query("DELETE FROM curriculum_lesson_completions WHERE organization_id=$1 AND user_id=$2", [organizationId, userId]);
    await pool.query("DELETE FROM users WHERE user_id=$1", [userId]);
    await pool.query("DELETE FROM organizations WHERE organization_id=$1", [organizationId]);
    await pool.end();
  });

  const getJson = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${apiUrl}${path}`, init);
    return { response, body: await response.json() };
  };

  const catalog = await getJson("/careers");
  assert.equal(catalog.response.status, 200);
  assert.equal(catalog.body.data.items.some((item: any) => item.slug === "data-center-technician"), true);

  const career = await getJson("/careers/data-center-technician");
  assert.equal(career.response.status, 200);
  assert.equal(career.body.data.family_slug, "data-center-ai-infrastructure");

  const requirement = await getJson("/careers/data-center-technician/curriculum");
  assert.equal(requirement.response.status, 200);
  assert.deepEqual(requirement.body.data.requirements[0], {
    career_curriculum_requirement_id: "ccr_data_center_technician_foundations_discover",
    career_id: "career_data_center_technician",
    curriculum_id: curriculumId,
    lesson_id: lessonId,
    requirement_type: "recommended",
    min_grade: 6,
    max_grade: 8,
    developmental_stage: "DISCOVER",
  });

  const headers = {
    Authorization: `Bearer dev-token:${userId}`,
    "Content-Type": "application/json",
  };
  const first = await getJson(`/curriculum/lessons/${lessonId}/complete`, {
    method: "POST",
    headers,
    body: JSON.stringify({ curriculum: curriculumId }),
  });
  assert.equal(first.response.status, 200);
  const second = await getJson(`/curriculum/lessons/${lessonId}/complete`, {
    method: "POST",
    headers,
    body: JSON.stringify({ curriculum: curriculumId }),
  });
  assert.equal(second.response.status, 200);

  const counts = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM curriculum_lesson_completions WHERE organization_id=$1 AND user_id=$2 AND curriculum_id=$3 AND lesson_id=$4) AS completions,
       (SELECT COUNT(*) FROM integration_outbox WHERE organization_id=$1 AND originating_actor_id=$2 AND event_type='lesson.completed' AND subject_id=$4) AS outbox`,
    [organizationId, userId, curriculumId, lessonId],
  );
  assert.deepEqual(counts.rows[0], { completions: "1", outbox: "1" });
  assert.equal(second.body.data.completion.completion_id, first.body.data.completion.completion_id);
  assert.equal(second.body.data.outbox_event_id, first.body.data.outbox_event_id);

  const event = await pool.query(
    "SELECT payload_json FROM integration_outbox WHERE organization_id=$1 AND originating_actor_id=$2 AND event_type='lesson.completed' AND subject_id=$3",
    [organizationId, userId, lessonId],
  );
  assert.equal(event.rows[0].payload_json.tenant_id, `tenant:${organizationId}`);
  assert.equal(event.rows[0].payload_json.payload.slug, lessonId);
  assert.equal(event.rows[0].payload_json.payload.curriculum, curriculumId);

  const crossTenant = await getJson(`/curriculum/lessons/${lessonId}/complete`, {
    method: "POST",
    headers: { ...headers, "x-shs-organization-id": "org_other" },
    body: JSON.stringify({ curriculum: curriculumId }),
  });
  assert.equal(crossTenant.response.status, 403);
});
