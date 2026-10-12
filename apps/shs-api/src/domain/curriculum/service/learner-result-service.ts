import { createHash } from "node:crypto";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { LearnerResultRepo } from "../repo/learner-result-repo.js";
import type { ActivityActor } from "../../activity-domains/model/activity-domain.js";
import { PortfolioService } from "../../portfolio/service/portfolio-service.js";
import { query } from "../../../db/client.js";

const repo = new LearnerResultRepo();
const outbox = new IntegrationOutboxRepo();
const portfolio = new PortfolioService();
const tenant = (actor: any) => String(actor.tenant_id || `tenant:${actor.organization_id}`);
const id = (...parts: string[]) => createHash("sha256").update(parts.join("|"), "utf8").digest("hex").slice(0, 32);
export function deriveMasteryStatus(outcomeType: string): "NOT_DEMONSTRATED" | "DEVELOPING" | "DEMONSTRATED" { return outcomeType === "DEMONSTRATED" ? "DEMONSTRATED" : outcomeType === "FAILED" || outcomeType === "NOT_DEMONSTRATED" ? "NOT_DEMONSTRATED" : "DEVELOPING"; }
export function deriveVerificationStatus(evidenceIds: string[] = []): "UNVERIFIED" | "EVIDENCE_PENDING" { return evidenceIds.length ? "EVIDENCE_PENDING" : "UNVERIFIED"; }

export async function recordOutcome(actor: ActivityActor, input: { sourceType: string; sourceId: string; outcomeType: any; score?: number | null; assignmentId?: string | null; courseId?: string | null; unitStableKey?: string | null; lessonStableKey?: string | null; competencyId?: string | null; evidenceIds?: string[]; value?: any; provenance?: any }) {
  if (tenant(actor) !== `tenant:${actor.organization_id}`) throw new Error("learner_result_scope_missing");
  const priorOutcomeId = await repo.currentOutcomeId(actor.organization_id, actor.user_id, input.sourceType, input.assignmentId, input.lessonStableKey);
  const outcome = await repo.insertOutcome({ outcomeId: `learner_outcome_${id(actor.organization_id, actor.user_id, input.sourceType, input.sourceId)}`, organizationId: actor.organization_id, tenantId: tenant(actor), learnerUserId: actor.user_id, ...input, supersedesOutcomeId: priorOutcomeId, idempotencyKey: `learner-outcome:${input.sourceType}:${input.sourceId}` });
  if (input.assignmentId && input.lessonStableKey) await repo.supersedePrior(actor.organization_id, input.sourceType, actor.user_id, input.assignmentId, input.lessonStableKey, outcome.outcomeId);
  const mastery = null;
  await portfolio.projectLearnerResult(actor, outcome, mastery);
  await outbox.enqueue({ producer_id: "curriculum.learner-result", event_type: "learner.outcome.recorded", subject_type: "learner_outcome", subject_id: outcome.outcomeId, organization_id: actor.organization_id, originating_actor_id: actor.user_id, tenant_id: tenant(actor), occurred_at: outcome.evaluatedAt, idempotency_key: `learner.outcome.recorded:${outcome.outcomeId}`, correlation_id: `learner-result:${outcome.outcomeId}`, destination: "curriculum-learner-results", payload: { outcome_id: outcome.outcomeId, learner_user_id: actor.user_id, outcome_type: outcome.outcomeType, verification_status: "UNVERIFIED" } });
  return outcome;
}

export async function projectCompetencyDecisionToMastery(decisionId: string, executor: { query: (sql: string, params?: unknown[]) => Promise<any> } = { query }) {
  const decision = await executor.query(
    `SELECT d.*, e.status AS evidence_status, e.user_id AS evidence_user_id,
            e.organization_id AS evidence_organization_id, e.tenant_id AS evidence_tenant_id,
            e.source_record_id, e.source_type, e.activity_id, e.assignment_id, e.curriculum_release_id,
            e.release_version, e.course_id, e.unit_stable_key, e.lesson_stable_key,
            e.supersedes_evidence_id, c.status AS competency_status
       FROM learner_competency_decisions d
       JOIN prepare_prove_evidence e
         ON e.evidence_id=d.evidence_id
        AND e.organization_id=d.organization_id
        AND e.tenant_id=d.tenant_id
        AND e.user_id=d.user_id
       JOIN competency_definitions c
         ON c.competency_id=d.competency_id
      WHERE d.decision_id=$1`,
    [decisionId],
  );
  const row = decision.rows[0];
  if (!row) throw new Error("competency_decision_not_found");
  if (row.organization_id !== row.evidence_organization_id || row.tenant_id !== row.evidence_tenant_id || row.user_id !== row.evidence_user_id) {
    throw new Error("decision_evidence_scope_mismatch");
  }
  if (row.decision !== "DEMONSTRATED") return { projected: false, reason: "decision_not_demonstrated", decision: row };
  if (row.evidence_status === "SUPERSEDED" || row.evidence_status === "CANDIDATE") return { projected: false, reason: "evidence_not_authoritative", decision: row };
  if (!row.evidence_id) throw new Error("decision_evidence_missing");
  if (!row.competency_id || row.competency_status !== "ACTIVE") throw new Error("decision_competency_missing");
  if (row.reviewer_user_id === row.user_id) throw new Error("reviewer_must_differ_from_learner");
  const prior = await executor.query(
    `SELECT outcome_id
       FROM curriculum_learner_outcomes
      WHERE organization_id=$1 AND tenant_id=$2 AND learner_user_id=$3
        AND competency_id=$4 AND source_type='COMPETENCY_REVIEW' AND status='CURRENT'
      ORDER BY occurred_at DESC, outcome_id DESC
      LIMIT 1`,
    [row.organization_id, row.tenant_id, row.user_id, row.competency_id],
  );
  const outcomeId = `learner_outcome_${id(row.organization_id, row.user_id, "COMPETENCY_REVIEW", row.decision_id)}`;
  const priorOutcomeId = prior.rows[0]?.outcome_id && prior.rows[0].outcome_id !== outcomeId ? prior.rows[0].outcome_id : null;
  const provenance = {
    policy: "authorized-demonstrated-decision.v1",
    source_authority: "learner_competency_decisions",
    decision_id: row.decision_id,
    reviewer_user_id: row.reviewer_user_id,
    learner_user_id: row.user_id,
    evidence_id: row.evidence_id,
    source_evidence_type: row.source_type,
    source_record_id: row.source_record_id,
    criteria_version: row.criteria_version,
    supersedes_outcome_id: priorOutcomeId,
  };
  const outcomeResult = await executor.query(
    `INSERT INTO curriculum_learner_outcomes
     (outcome_id, organization_id, tenant_id, learner_user_id, course_id, unit_stable_key,
      lesson_stable_key, activity_id, assignment_id, source_type, source_id, outcome_type,
      status, competency_id, evidence_ids, occurred_at, evaluated_at, provenance_json,
      supersedes_outcome_id, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'COMPETENCY_REVIEW',$10,'DEMONSTRATED',
      'CURRENT',$11,$12::jsonb,$13,NOW(),$14::jsonb,$15,$16)
     ON CONFLICT (organization_id, source_type, source_id)
     DO UPDATE SET outcome_id=curriculum_learner_outcomes.outcome_id
     RETURNING *`,
    [
      outcomeId,
      row.organization_id,
      row.tenant_id,
      row.user_id,
      row.course_id || null,
      row.unit_stable_key || null,
      row.lesson_stable_key || null,
      row.activity_id || row.source_record_id || null,
      row.assignment_id || null,
      row.decision_id,
      row.competency_id,
      JSON.stringify([row.evidence_id]),
      row.reviewed_at || new Date(),
      JSON.stringify(provenance),
      priorOutcomeId,
      `competency-decision:${row.decision_id}`,
    ],
  );
  await executor.query(
    `UPDATE curriculum_learner_outcomes
        SET status='SUPERSEDED'
      WHERE organization_id=$1 AND tenant_id=$2 AND learner_user_id=$3
        AND competency_id=$4 AND source_type='COMPETENCY_REVIEW'
        AND outcome_id<>$5 AND status='CURRENT'`,
    [row.organization_id, row.tenant_id, row.user_id, row.competency_id, outcomeResult.rows[0].outcome_id],
  );
  const masteryRepo = new LearnerResultRepo(executor.query.bind(executor));
  const mastery = await masteryRepo.upsertMastery({
    masteryId: `learner_mastery_${id(row.organization_id, row.user_id, row.competency_id)}`,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    learnerUserId: row.user_id,
    competencyId: row.competency_id,
    masteryStatus: "DEMONSTRATED",
    verificationStatus: "VERIFIED",
    sourceOutcomeId: outcomeResult.rows[0].outcome_id,
    evidenceIds: [row.evidence_id],
    sourceDecisionId: row.decision_id,
    reviewerUserId: row.reviewer_user_id,
    sourceAuthority: "curriculum.authorized-review-decision",
    effectiveAt: row.reviewed_at || new Date(),
    provenance,
  });
  await outbox.enqueue({
    producer_id: "curriculum.competency-mastery",
    event_type: "learner.competency_mastery.projected",
    schema_version: "1.0",
    subject_type: "curriculum_learner_mastery",
    subject_id: mastery.masteryId,
    organization_id: row.organization_id,
    originating_actor_id: row.reviewer_user_id,
    originating_actor_type: "user",
    tenant_id: row.tenant_id,
    occurred_at: mastery.effectiveAt || new Date().toISOString(),
    idempotency_key: `learner.competency_mastery.projected:${row.decision_id}`,
    correlation_id: `competency-decision:${row.decision_id}`,
    payload: { decision_id: row.decision_id, learner_user_id: row.user_id, competency_id: row.competency_id, mastery_id: mastery.masteryId, outcome_id: outcomeResult.rows[0].outcome_id },
    destination: "curriculum-learner-results",
  }, executor);
  return { projected: true, outcome: outcomeResult.rows[0], mastery, decision: row };
}

export async function getLearnerResults(actor: any, courseId?: string | null) { const organizationId = String(actor.organization_id || actor.active_organization_id || ""); const tenantId = tenant({ ...actor, organization_id: organizationId }); const outcomes = await repo.listOutcomes(organizationId, tenantId, actor.user_id); const currentOutcomes = outcomes.filter((item) => item.status === "CURRENT"); const mastery = await repo.listMastery(organizationId, tenantId, actor.user_id); const progress = await repo.progress(organizationId, tenantId, actor.user_id, courseId); return { outcomes, currentOutcomes, mastery, progress, contractVersion: "1.0" }; }
