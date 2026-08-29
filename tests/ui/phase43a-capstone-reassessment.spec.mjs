import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { branchData, call, establishGrade11, establishGrade12, gate, proof, program, reviewer, token } from "./phase43a-capstone-test-helpers.mjs";

test("Phase 43A proves capstone reassessment lock, unlock, history, and replay", { timeout: 240_000 }, async ({ page }) => {
  const learnerId = "user_assignment_technical_001";
  const learner = token(learnerId);
  const activity = branchData["technical-operations"].proof;

  await establishGrade11(page, learnerId, "technical-operations");
  await establishGrade12(page, learnerId, "technical-operations", { omitProof: true });

  const insufficient = await proof(page, learner, activity, "phase43a-reassessment-insufficient", "EVIDENCE_INSUFFICIENT");
  const locked = await gate(page, learner);
  expect(locked.status).toBe("CAPSTONE_ENTRY_NOT_ELIGIBLE");
  const insufficientReview = await call(page, "get", `/prepare-prove/proof-status?activity_id=${activity}`, learner);
  expect(insufficientReview.decision.decision).toBe("EVIDENCE_INSUFFICIENT");

  const reassessed = await proof(page, learner, activity, "phase43a-reassessment-demonstrated", null);
  const reviewed = await call(page, "post", `/prepare-prove/evidence/${reassessed.evidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" }, 200);
  const unlocked = await gate(page, learner);
  expect(unlocked.status).toBe("CAPSTONE_ENTRY_ELIGIBLE");
  expect(reassessed.result.result_id).toBe(insufficient.result.result_id);
  expect(reassessed.evidence.evidence_id).not.toBe(insufficient.evidence.evidence_id);
  expect(reviewed.decision).toBe("DEMONSTRATED");

  const insufficientStatus = await call(page, "get", `/prepare-prove/proof-status?activity_id=${activity}`, learner);
  expect(insufficientStatus.decision.decision).toBe("DEMONSTRATED");
  expect(insufficientStatus.evidence.evidence_id).toBe(reassessed.evidence.evidence_id);

  const replay = await call(page, "post", `/prepare-prove/evidence/${reassessed.evidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" }, 200);
  expect(replay.decision_id).toBe(reviewed.decision_id);
  const final = await gate(page, learner);
  expect(final.status).toBe("CAPSTONE_ENTRY_ELIGIBLE");
  const db = (sql) => execFileSync("psql", [process.env.SHS_TEST_DATABASE_URL, "-At", "-F", "\t", "-c", sql], { encoding: "utf8" }).trim();
  const history = db(`SELECT (SELECT COUNT(*) FROM prepare_prove_activity_results WHERE user_id='${learnerId}' AND activity_id='${activity}'), (SELECT COUNT(*) FROM prepare_prove_evidence WHERE user_id='${learnerId}' AND activity_id='${activity}'), (SELECT COUNT(*) FROM learner_competency_decisions d JOIN prepare_prove_evidence e ON e.evidence_id=d.evidence_id WHERE d.user_id='${learnerId}' AND e.activity_id='${activity}'), (SELECT string_agg(d.decision, ',' ORDER BY d.reviewed_at, d.decision_id) FROM learner_competency_decisions d JOIN prepare_prove_evidence e ON e.evidence_id=d.evidence_id WHERE d.user_id='${learnerId}' AND e.activity_id='${activity}'), (SELECT COUNT(*) FROM integration_outbox WHERE event_type='competency.reviewed' AND subject_id IN ('${insufficientReview.decision.decision_id}','${reviewed.decision_id}'))`);
  const [resultCount, evidenceCount, decisionCount, decisionOrder, eventCount] = history.split("\t");
  expect(decisionOrder).toBe("EVIDENCE_INSUFFICIENT,DEMONSTRATED");
  expect(Number(eventCount)).toBe(2);
  expect(Number(resultCount)).toBe(1);
  expect(Number(evidenceCount)).toBe(2);
  expect(Number(decisionCount)).toBe(2);
  console.log(`[phase43a-reassessment] ${JSON.stringify({ lock: locked.status, unlock: unlocked.status, original_result: insufficient.result.result_id, reassessed_result: reassessed.result.result_id, first_evidence: insufficient.evidence.evidence_id, second_evidence: reassessed.evidence.evidence_id, final_decision: reviewed.decision, replay_decision: replay.decision_id })}`);
});
