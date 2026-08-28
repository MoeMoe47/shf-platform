import assert from "node:assert/strict";
import test from "node:test";
import { pool } from "../src/db/client";
import { CurriculumCompletionService } from "../src/domain/curriculum/service/curriculum-completion-service";

const organizationId = "org_e2e_curriculum_20260826";
const userId = "user_e2e_curriculum_20260826";
const actor = { user_id: userId, organization_id: organizationId, tenant_id: `tenant:${organizationId}` };

test("curriculum completion and outbox share a real PostgreSQL transaction", async (t) => {
  await pool.query("DELETE FROM integration_outbox WHERE organization_id=$1", [organizationId]);
  await pool.query("DELETE FROM curriculum_lesson_completions WHERE organization_id=$1", [organizationId]);
  await pool.query("INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,$2,$2,'SHF','active') ON CONFLICT DO NOTHING", [organizationId, "Synthetic E2E Organization"]);
  await pool.query("INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'active','test') ON CONFLICT DO NOTHING", [userId, organizationId, `${userId}@test.invalid`, "Synthetic E2E Student"]);
  t.after(async () => {
    await pool.query("DELETE FROM integration_outbox WHERE organization_id=$1", [organizationId]);
    await pool.query("DELETE FROM curriculum_lesson_completions WHERE organization_id=$1", [organizationId]);
    await pool.query("DELETE FROM users WHERE user_id=$1", [userId]);
    await pool.query("DELETE FROM organizations WHERE organization_id=$1", [organizationId]);
  });

  const service = new CurriculumCompletionService();
  const first = await service.complete({ lessonId: "synthetic.lesson-01", curriculumId: "asl", actor });
  const second = await service.complete({ lessonId: "synthetic.lesson-01", curriculumId: "asl", actor });
  const counts = await pool.query(
    "SELECT (SELECT COUNT(*) FROM curriculum_lesson_completions WHERE organization_id=$1) AS completions, (SELECT COUNT(*) FROM integration_outbox WHERE organization_id=$1) AS outbox",
    [organizationId],
  );
  assert.equal(counts.rows[0].completions, "1");
  assert.equal(counts.rows[0].outbox, "1");
  assert.equal(second.completion.completion_id, first.completion.completion_id);
  assert.equal(second.outbox_event_id, first.outbox_event_id);
  assert.equal(first.completion.user_id, userId);
  assert.equal(first.completion.organization_id, organizationId);

  const failing = new CurriculumCompletionService(undefined, { enqueue: async () => { throw new Error("synthetic_outbox_failure"); } } as any);
  await assert.rejects(() => failing.complete({ lessonId: "synthetic.lesson-02", curriculumId: "asl", actor }), /synthetic_outbox_failure/);
  const rollback = await pool.query("SELECT COUNT(*) AS count FROM curriculum_lesson_completions WHERE organization_id=$1 AND lesson_id=$2", [organizationId, "synthetic.lesson-02"]);
  assert.equal(rollback.rows[0].count, "0");
});
