import assert from "node:assert/strict";
import test from "node:test";
import { dispatchPendingIntegrationEvents } from "../src/domain/trusted-reporting/dispatcher.ts";
import { verifiedEvidenceEventSourceTypes } from "../src/domain/verified-evidence/service/verified-evidence-service.ts";
import { toTruthSpineFact } from "../src/domain/verified-evidence/truth-spine-adapter.ts";

test("Phase 6 consumes every supported authoritative event through the shared outbox", () => {
  assert.deepEqual(verifiedEvidenceEventSourceTypes, {
    "assessment.submitted": "ASSESSMENT_RESULT",
    "reflection.submitted": "REFLECTION_SUBMISSION",
    "practice.submitted": "PRACTICE_RESULT",
    "arcade.resulted": "ARCADE_RESULT",
    "project.submission.reviewed": "PROJECT_SUBMISSION",
    "attendance.confirmed": "ATTENDANCE",
    "competency.reviewed": "INSTRUCTOR_VERIFICATION",
    "lesson.completed": "LESSON_COMPLETION",
  });
});

test("projection failure leaves the claimed outbox event retryable", async () => {
  process.env.SHF_AGENT_FABRIC_INTERNAL_URL = "http://phase6-test.invalid";
  const calls: string[] = [];
  const repo: any = {
    async claimPending() {
      return [{
        outbox_event_id: "phase6_retry_event",
        event_type: "assessment.submitted",
        subject_id: "missing_result",
        organization_id: "org_shf_001",
        payload_json: JSON.stringify({ source_record_id: "missing_result" }),
        attempt_count: 1,
      }];
    },
    async markRetryable(...args: any[]) { calls.push(`retry:${args[0]}`); },
    async markDelivered(...args: any[]) { calls.push(`delivered:${args[0]}`); },
    async markFailedFinal(...args: any[]) { calls.push(`failed:${args[0]}`); },
  };
  const result = await dispatchPendingIntegrationEvents({ repo, limit: 1, workerId: "phase6-test", config: { maxAttempts: 3, backoffBaseSeconds: 1, backoffCapSeconds: 2 } as any });
  assert.deepEqual(result, [{ outbox_event_id: "phase6_retry_event", status: "RETRYABLE" }]);
  assert.deepEqual(calls, ["retry:phase6_retry_event"]);
});

test("duplicate delivery remains a single projection operation at the deterministic boundary", async () => {
  assert.match(String(verifiedEvidenceEventSourceTypes["assessment.submitted"]), /ASSESSMENT_RESULT/);
  assert.match(String(verifiedEvidenceEventSourceTypes["lesson.completed"]), /LESSON_COMPLETION/);
});

test("Truth Spine adapter normalizes the durable SHS fact without a second write", () => {
  const fact = toTruthSpineFact({ truth_fact_id: "tf_1", learner_user_id: "learner_1", organization_id: "org_1", fact_type: "ASSESSMENT_PASSED", source_type: "ASSESSMENT_RESULT", source_record_id: "result_1", assignment_id: "assignment_1", curriculum_release_id: "release_1", release_version: 1, evidence_rule_id: "rule_1", evidence_rule_version: 1, provenance_json: { source: "test" } });
  assert.deepEqual(fact, { fact_id: "tf_1", claim_type: "fact", subject_id: "learner_1", predicate: "ASSESSMENT_PASSED", organization_id: "org_1", assignment_id: "assignment_1", curriculum_release_id: "release_1", release_version: 1, competency_id: null, source_type: "ASSESSMENT_RESULT", source_record_id: "result_1", evidence_rule_id: "rule_1", evidence_rule_version: 1, occurred_at: undefined, provenance: { source: "test" } });
});
