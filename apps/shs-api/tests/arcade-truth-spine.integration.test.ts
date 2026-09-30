import assert from "node:assert/strict";
import { after, test } from "node:test";
import { query } from "../src/db/client.ts";
import { createActivity, startAttempt, submitResult } from "../src/domain/arcade/service/arcade-service.ts";
import { createEvidenceRule } from "../src/domain/verified-evidence/service/verified-evidence-service.ts";
import { IntegrationOutboxRepo } from "../src/domain/trusted-reporting/outbox-repo.ts";
import { dispatchPendingIntegrationEvents } from "../src/domain/trusted-reporting/dispatcher.ts";

const RUN = `arcade_truth_spine_${Date.now()}`;
const ORG = "org_shf_001";
const LEARNER = "user_assignment_technical_001";
const ADMIN = "user_admin_001";
const learner = { user_id: LEARNER, organization_id: ORG, roles: ["student"], permissions: ["arcade.attempt"] };
const admin = { user_id: ADMIN, organization_id: ORG, roles: ["org_admin"], permissions: ["arcade.activity.manage"] };
const createdResults: string[] = [];
const createdAttempts: string[] = [];
const createdActivities: string[] = [];
const createdRules: string[] = [];

async function cleanup() {
  if (createdResults.length) {
    await query("DELETE FROM curriculum_truth_facts WHERE source_record_id = ANY($1::text[])", [createdResults]);
    await query("DELETE FROM prepare_prove_evidence WHERE source_record_id = ANY($1::text[])", [createdResults]);
    await query("DELETE FROM arcade_results WHERE arcade_result_id = ANY($1::text[])", [createdResults]);
    await query("DELETE FROM integration_outbox WHERE subject_id = ANY($1::text[])", [createdResults]);
  }
  if (createdRules.length) await query("DELETE FROM curriculum_evidence_rules WHERE evidence_rule_id = ANY($1::text[])", [createdRules]);
  if (createdAttempts.length) await query("DELETE FROM arcade_attempts WHERE arcade_attempt_id = ANY($1::text[])", [createdAttempts]);
  if (createdActivities.length) await query("DELETE FROM arcade_activities WHERE arcade_activity_id = ANY($1::text[])", [createdActivities]);
}

after(cleanup);

test("canonical Arcade Result projects through reviewed Evidence to the signed Truth Spine boundary", { concurrency: false }, async () => {
  const activity = await createActivity(admin as any, {
    slug: `${RUN}-activity`,
    title: "Arcade Truth Bridge Test",
    activityType: "SCENARIO",
    masteryRule: "PASSED_FLAG",
  });
  createdActivities.push(activity.id);
  const attempt = await startAttempt(learner as any, activity.id);
  createdAttempts.push(attempt.id);
  const result = await submitResult(learner as any, attempt.id, { passed: true });
  createdResults.push(result.id);
  assert.equal(result.masteryAchieved, true);

  const eventResult = await query("SELECT * FROM integration_outbox WHERE organization_id=$1 AND producer_id='curriculum.arcade' AND idempotency_key=$2", [ORG, `arcade.resulted:${result.id}`]);
  assert.equal(eventResult.rows.length, 1);
  const outboxEvent = eventResult.rows[0];
  const originalBody = typeof outboxEvent.payload_json === "string" ? JSON.parse(outboxEvent.payload_json) : outboxEvent.payload_json;
  assert.equal(originalBody.event_type, "arcade.resulted");
  assert.equal(originalBody.payload.source_record_id, result.id);
  assert.equal(originalBody.payload.arcade_activity_id, activity.id);
  assert.equal(originalBody.payload.mastery_achieved, true);

  const ruleId = `${RUN}-rule`;
  createdRules.push(ruleId);
  await createEvidenceRule({ user_id: ADMIN, organization_id: ORG }, {
    evidenceRuleId: ruleId,
    sourceType: "ARCADE_RESULT",
    evidenceType: "ARCADE_RESULT",
    truthFactType: "ARCADE_MASTERY_ACHIEVED",
    ruleVersion: 1,
    reviewRequired: false,
  });

  const previous = {
    url: process.env.SHF_AGENT_FABRIC_INTERNAL_URL,
    kid: process.env.SHF_INTERNAL_SERVICE_ACTIVE_KID,
    keys: process.env.SHF_INTERNAL_SERVICE_KEYS_JSON,
  };
  process.env.SHF_AGENT_FABRIC_INTERNAL_URL = "http://truth-spine.integration.test";
  process.env.SHF_INTERNAL_SERVICE_ACTIVE_KID = "arcade-test";
  process.env.SHF_INTERNAL_SERVICE_KEYS_JSON = JSON.stringify({ "arcade-test": "arcade-test-secret" });
  try {
    const delegate = new IntegrationOutboxRepo();
    let sentBody: any;
    const states: string[] = [];
    const repo: any = {
      async claimPending() { return [outboxEvent]; },
      async markDelivered() { states.push("DELIVERED"); },
      async markRetryable() { states.push("RETRYABLE"); },
      async markFailedFinal() { states.push("FAILED_FINAL"); },
      async getBacklogStatus(...args: any[]) { return delegate.getBacklogStatus(...args); },
    };
    const dispatched = await dispatchPendingIntegrationEvents({
      repo,
      fetchImpl: async (_url, init) => {
        sentBody = JSON.parse(init.body);
        assert.match(init.headers["X-SHF-Service-Signature"], /^[a-f0-9]{64}$/);
        return { ok: true, status: 200, json: async () => ({ ok: true, projection: { truth_spine_record_id: "truth-record-simulated" } }) };
      },
    });
    assert.equal(dispatched[0].status, "DELIVERED");
    assert.deepEqual(states, ["DELIVERED"]);
    assert.equal(sentBody.producer_id, "curriculum.arcade");
    assert.equal(sentBody.event_type, "arcade.resulted");
    assert.deepEqual(sentBody.evidence_references, [sentBody.payload.verified_evidence[0].evidence_id]);
    assert.equal(sentBody.payload.verified_evidence[0].source_type, "ARCADE_RESULT");
    assert.equal(sentBody.payload.verified_evidence[0].status, "REVIEWED");
    assert.equal(sentBody.payload.verified_evidence[0].arcade_activity_id, activity.id);
    assert.equal("xpDelta" in sentBody.payload, false);
    assert.equal("evuDelta" in sentBody.payload, false);
    assert.equal("txHash" in sentBody.payload, false);

    const evidence = await query("SELECT evidence_id,status,source_type FROM prepare_prove_evidence WHERE organization_id=$1 AND source_record_id=$2 AND evidence_rule_id=$3", [ORG, result.id, ruleId]);
    const fact = await query("SELECT truth_fact_id,fact_type,source_record_id FROM curriculum_truth_facts WHERE organization_id=$1 AND source_record_id=$2 AND evidence_rule_id=$3", [ORG, result.id, ruleId]);
    assert.equal(evidence.rows.length, 1);
    assert.equal(evidence.rows[0].status, "REVIEWED");
    assert.equal(evidence.rows[0].source_type, "ARCADE_RESULT");
    assert.equal(fact.rows.length, 1);
    assert.equal(fact.rows[0].fact_type, "ARCADE_MASTERY_ACHIEVED");
    assert.equal(sentBody.payload.verified_evidence[0].evidence_id, evidence.rows[0].evidence_id);
    assert.equal(sentBody.payload.verified_evidence[0].evidence_id, evidence.rows[0].evidence_id);
    await query("UPDATE curriculum_evidence_rules SET status='RETIRED' WHERE organization_id=$1 AND evidence_rule_id=$2", [ORG, ruleId]);
  } finally {
    if (previous.url === undefined) delete process.env.SHF_AGENT_FABRIC_INTERNAL_URL; else process.env.SHF_AGENT_FABRIC_INTERNAL_URL = previous.url;
    if (previous.kid === undefined) delete process.env.SHF_INTERNAL_SERVICE_ACTIVE_KID; else process.env.SHF_INTERNAL_SERVICE_ACTIVE_KID = previous.kid;
    if (previous.keys === undefined) delete process.env.SHF_INTERNAL_SERVICE_KEYS_JSON; else process.env.SHF_INTERNAL_SERVICE_KEYS_JSON = previous.keys;
  }
});

test("an Arcade Result without an active evidence rule cannot produce a fact", { concurrency: false }, async () => {
  const activity = await createActivity(admin as any, {
    slug: `${RUN}-no-rule-activity`,
    title: "Arcade Missing Rule Test",
    activityType: "SCENARIO",
    masteryRule: "PASSED_FLAG",
  });
  createdActivities.push(activity.id);
  const attempt = await startAttempt(learner as any, activity.id);
  createdAttempts.push(attempt.id);
  const result = await submitResult(learner as any, attempt.id, { passed: true });
  createdResults.push(result.id);
  const event = await query("SELECT * FROM integration_outbox WHERE organization_id=$1 AND idempotency_key=$2", [ORG, `arcade.resulted:${result.id}`]);
  assert.equal(event.rows.length, 1);
  const stored = event.rows[0];
  const payload = typeof stored.payload_json === "string" ? JSON.parse(stored.payload_json) : stored.payload_json;
  await assert.rejects(
    () => import("../src/domain/verified-evidence/service/verified-evidence-service.ts").then(({ projectAuthoritativeOutboxEvent }) => projectAuthoritativeOutboxEvent({ ...stored, payload_json: payload })),
    /arcade_evidence_rule_missing/,
  );
  const evidence = await query("SELECT COUNT(*)::int AS n FROM prepare_prove_evidence WHERE organization_id=$1 AND source_record_id=$2", [ORG, result.id]);
  const facts = await query("SELECT COUNT(*)::int AS n FROM curriculum_truth_facts WHERE organization_id=$1 AND source_record_id=$2", [ORG, result.id]);
  assert.equal(evidence.rows[0].n, 0);
  assert.equal(facts.rows[0].n, 0);
});

test("an Arcade Result with only a retired evidence rule cannot produce Evidence or Truth", { concurrency: false }, async () => {
  const activity = await createActivity(admin as any, {
    slug: `${RUN}-retired-rule-activity`,
    title: "Arcade Retired Rule Test",
    activityType: "SCENARIO",
    masteryRule: "PASSED_FLAG",
  });
  createdActivities.push(activity.id);
  const attempt = await startAttempt(learner as any, activity.id);
  createdAttempts.push(attempt.id);
  const result = await submitResult(learner as any, attempt.id, { passed: true });
  createdResults.push(result.id);
  const ruleId = `${RUN}-retired-rule`;
  createdRules.push(ruleId);
  await createEvidenceRule({ user_id: ADMIN, organization_id: ORG }, {
    evidenceRuleId: ruleId,
    sourceType: "ARCADE_RESULT",
    evidenceType: "ARCADE_RESULT",
    truthFactType: "ARCADE_MASTERY_ACHIEVED",
    ruleVersion: 1,
    reviewRequired: false,
  });
  await query("UPDATE curriculum_evidence_rules SET status='RETIRED' WHERE organization_id=$1 AND evidence_rule_id=$2", [ORG, ruleId]);

  const stored = (await query("SELECT * FROM integration_outbox WHERE organization_id=$1 AND idempotency_key=$2", [ORG, `arcade.resulted:${result.id}`])).rows[0];
  const payload = typeof stored.payload_json === "string" ? JSON.parse(stored.payload_json) : stored.payload_json;
  await assert.rejects(
    () => import("../src/domain/verified-evidence/service/verified-evidence-service.ts").then(({ projectAuthoritativeOutboxEvent }) => projectAuthoritativeOutboxEvent({ ...stored, payload_json: payload })),
    /arcade_evidence_rule_missing/,
  );
  const evidence = await query("SELECT COUNT(*)::int AS n FROM prepare_prove_evidence WHERE organization_id=$1 AND source_record_id=$2", [ORG, result.id]);
  const facts = await query("SELECT COUNT(*)::int AS n FROM curriculum_truth_facts WHERE organization_id=$1 AND source_record_id=$2", [ORG, result.id]);
  assert.equal(evidence.rows[0].n, 0);
  assert.equal(facts.rows[0].n, 0);
});

test("Result persistence rolls back when transactional outbox enqueue fails and can be retried", { concurrency: false }, async () => {
  const activity = await createActivity(admin as any, {
    slug: `${RUN}-outbox-failure-activity`,
    title: "Arcade Outbox Atomicity Test",
    activityType: "SCENARIO",
    masteryRule: "PASSED_FLAG",
  });
  createdActivities.push(activity.id);
  const attempt = await startAttempt(learner as any, activity.id);
  createdAttempts.push(attempt.id);

  const originalEnqueue = IntegrationOutboxRepo.prototype.enqueue;
  IntegrationOutboxRepo.prototype.enqueue = async () => { throw new Error("test_outbox_insert_failure"); };
  try {
    await assert.rejects(() => submitResult(learner as any, attempt.id, { passed: true }), /test_outbox_insert_failure/);
  } finally {
    IntegrationOutboxRepo.prototype.enqueue = originalEnqueue;
  }

  const rolledBack = await query("SELECT a.status, COUNT(r.arcade_result_id)::int AS result_count FROM arcade_attempts a LEFT JOIN arcade_results r ON r.arcade_attempt_id=a.arcade_attempt_id WHERE a.arcade_attempt_id=$1 GROUP BY a.status", [attempt.id]);
  assert.equal(rolledBack.rows[0].status, "STARTED");
  assert.equal(rolledBack.rows[0].result_count, 0);

  const retried = await submitResult(learner as any, attempt.id, { passed: true });
  createdResults.push(retried.id);
  const event = await query("SELECT COUNT(*)::int AS n FROM integration_outbox WHERE organization_id=$1 AND idempotency_key=$2", [ORG, `arcade.resulted:${retried.id}`]);
  assert.equal(event.rows[0].n, 1);
});
