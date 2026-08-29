import assert from "node:assert/strict";
import test from "node:test";

const testDatabaseUrl = process.env.SHS_TEST_DATABASE_URL;

test("Phase 16 preserves result, evidence, review, and competency boundaries in PostgreSQL", {
  timeout: 60_000,
  skip: testDatabaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable PostgreSQL Phase 16 verification",
}, async (t) => {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.SHS_AUTH_ENV = "test";
  const { discoverMigrations, runMigrations } = await import("../src/db/migration-runner.ts");
  const { pool } = await import("../src/db/client.ts");
  const { PrepareProveService, PROOF_ACTIVITY_ID } = await import("../src/domain/prepare-prove/service/prepare-prove-service.ts");
  const { IntegrationOutboxRepo } = await import("../src/domain/trusted-reporting/outbox-repo.ts");
  const org = "org_phase16_runtime";
  const otherOrg = "org_phase16_other";
  const learner = "user_phase16_learner";
  const reviewer = "user_phase16_reviewer";
  const otherReviewer = "user_phase16_other_reviewer";
  const migrations = await discoverMigrations(new URL("../migrations", import.meta.url).pathname);
  const client = await pool.connect();
  try { await runMigrations(client, migrations); } finally { client.release(); }
  await pool.query("DELETE FROM integration_outbox WHERE organization_id IN ($1,$2)", [org, otherOrg]);
  await pool.query("DELETE FROM learner_competency_decisions WHERE organization_id IN ($1,$2)", [org, otherOrg]);
  await pool.query("DELETE FROM prepare_prove_evidence WHERE organization_id IN ($1,$2)", [org, otherOrg]);
  await pool.query("DELETE FROM prepare_prove_activity_results WHERE organization_id IN ($1,$2)", [org, otherOrg]);
  await pool.query("DELETE FROM users WHERE user_id IN ($1,$2,$3)", [learner, reviewer, otherReviewer]);
  await pool.query("DELETE FROM organizations WHERE organization_id IN ($1,$2)", [org, otherOrg]);
  await pool.query("INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,$2,$2,'SHF','active'),($3,$4,$4,'Partner','active')", [org, "Phase 16 Runtime", otherOrg, "Other Runtime"]);
  await pool.query("INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'active','test'),($5,$2,$6,$7,'active','test'),($8,$9,$10,$11,'active','test')", [learner, org, `${learner}@test.invalid`, "Learner", reviewer, `${reviewer}@test.invalid`, "Reviewer", otherReviewer, otherOrg, `${otherReviewer}@test.invalid`, "Other Reviewer"]);
  t.after(async () => {
    await pool.query("DELETE FROM integration_outbox WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await pool.query("DELETE FROM learner_competency_decisions WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await pool.query("DELETE FROM prepare_prove_evidence WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await pool.query("DELETE FROM prepare_prove_activity_results WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await pool.query("DELETE FROM users WHERE user_id IN ($1,$2,$3)", [learner, reviewer, otherReviewer]);
    await pool.query("DELETE FROM organizations WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await pool.end();
  });
  const service = new PrepareProveService();
  const learnerActor = { user_id: learner, organization_id: org, tenant_id: `tenant:${org}`, permissions: ["curriculum.lesson.complete"] };
  const reviewerActor = { user_id: reviewer, organization_id: org, tenant_id: `tenant:${org}`, permissions: ["verification.review", "verification.approve"] };
  const result = await service.submitProofResult({ actor: learnerActor, result: { observations: ["temperature warning", "service online"], affected_system: "cooling", uncertainty: "synthetic", safe_next_step: "escalate" } });
  assert.equal(result.activity_id, PROOF_ACTIVITY_ID);
  assert.equal((await pool.query("SELECT COUNT(*) FROM prepare_prove_evidence WHERE user_id=$1", [learner])).rows[0].count, "0");
  assert.equal((await pool.query("SELECT COUNT(*) FROM learner_competency_decisions WHERE user_id=$1", [learner])).rows[0].count, "0");
  const evidence = await service.createEvidence({ actor: learnerActor, sourceResultId: result.result_id, criterion: "safe-finding" });
  assert.equal(evidence.status, "REVIEWABLE");
  assert.equal((await service.getProofStatus(learnerActor)).evidence.evidence_id, evidence.evidence_id);
  assert.equal((await service.getProofStatus(learnerActor)).decision, null);
  assert.equal((await pool.query("SELECT COUNT(*) FROM learner_competency_decisions WHERE user_id=$1", [learner])).rows[0].count, "0");
  await assert.rejects(() => service.reviewEvidence({ actor: learnerActor, evidenceId: evidence.evidence_id, decision: "DEMONSTRATED" }), /verification_review_required/);
  await assert.rejects(() => service.reviewEvidence({ actor: { user_id: otherReviewer, organization_id: otherOrg, tenant_id: `tenant:${otherOrg}`, permissions: ["verification.review", "verification.approve"] }, evidenceId: evidence.evidence_id, decision: "DEMONSTRATED" }), /evidence_not_found/);
  const decision = await service.reviewEvidence({ actor: reviewerActor, evidenceId: evidence.evidence_id, decision: "DEMONSTRATED" });
  const repeated = await service.reviewEvidence({ actor: reviewerActor, evidenceId: evidence.evidence_id, decision: "DEMONSTRATED" });
  assert.equal(decision.decision, "DEMONSTRATED");
  assert.equal(repeated.decision_id, decision.decision_id);
  assert.equal((await service.getProofStatus(learnerActor)).decision.decision, "DEMONSTRATED");
  const counts = await pool.query("SELECT (SELECT COUNT(*) FROM learner_competency_decisions WHERE decision_id=$1) AS decisions, (SELECT COUNT(*) FROM integration_outbox WHERE idempotency_key=$2) AS outbox", [decision.decision_id, `competency.reviewed:${decision.decision_id}`]);
  assert.deepEqual(counts.rows[0], { decisions: "1", outbox: "1" });
  const lineage = await pool.query("SELECT d.decision_id, d.reviewer_user_id, d.criteria_version, e.source_record_id, r.activity_id FROM learner_competency_decisions d JOIN prepare_prove_evidence e ON e.evidence_id=d.evidence_id JOIN prepare_prove_activity_results r ON r.result_id=e.source_record_id WHERE d.decision_id=$1", [decision.decision_id]);
  assert.deepEqual(lineage.rows[0], { decision_id: decision.decision_id, reviewer_user_id: reviewer, criteria_version: 1, source_record_id: result.result_id, activity_id: PROOF_ACTIVITY_ID });
  assert.equal((await pool.query("SELECT COUNT(*) FROM prepare_prove_activity_results WHERE activity_id=$1", [PROOF_ACTIVITY_ID])).rows[0].count, "1");
  assert.equal(IntegrationOutboxRepo.name, "IntegrationOutboxRepo");
});
