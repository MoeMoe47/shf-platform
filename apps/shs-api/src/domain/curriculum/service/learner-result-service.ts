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
export function deriveMasteryStatus(outcomeType: string): "NOT_DEMONSTRATED" | "DEVELOPING" | "DEMONSTRATED" { return outcomeType === "PASSED" || outcomeType === "DEMONSTRATED" ? "DEMONSTRATED" : outcomeType === "FAILED" || outcomeType === "NOT_DEMONSTRATED" ? "NOT_DEMONSTRATED" : "DEVELOPING"; }
export function deriveVerificationStatus(evidenceIds: string[] = []): "UNVERIFIED" | "EVIDENCE_PENDING" { return evidenceIds.length ? "EVIDENCE_PENDING" : "UNVERIFIED"; }

async function verifiedEvidenceStatus(actor: ActivityActor, competencyId: string, evidenceIds: string[], outcomeType: string) {
  if (outcomeType !== "PASSED" && outcomeType !== "DEMONSTRATED") return "UNVERIFIED" as const;
  if (!evidenceIds.length) return "UNVERIFIED" as const;
  const result = await query(`SELECT 1 FROM learner_competency_decisions
    WHERE organization_id=$1 AND tenant_id=$2 AND user_id=$3 AND competency_id=$4
      AND evidence_id = ANY($5::text[]) AND decision='DEMONSTRATED' LIMIT 1`,
    [actor.organization_id, tenant(actor), actor.user_id, competencyId, evidenceIds]);
  return result.rows[0] ? "VERIFIED" as const : "EVIDENCE_PENDING" as const;
}

export async function recordOutcome(actor: ActivityActor, input: { sourceType: string; sourceId: string; outcomeType: any; score?: number | null; assignmentId?: string | null; courseId?: string | null; unitStableKey?: string | null; lessonStableKey?: string | null; competencyId?: string | null; evidenceIds?: string[]; value?: any; provenance?: any }) {
  if (tenant(actor) !== `tenant:${actor.organization_id}`) throw new Error("learner_result_scope_missing");
  const priorOutcomeId = await repo.currentOutcomeId(actor.organization_id, actor.user_id, input.sourceType, input.assignmentId, input.lessonStableKey);
  const outcome = await repo.insertOutcome({ outcomeId: `learner_outcome_${id(actor.organization_id, actor.user_id, input.sourceType, input.sourceId)}`, organizationId: actor.organization_id, tenantId: tenant(actor), learnerUserId: actor.user_id, ...input, supersedesOutcomeId: priorOutcomeId, idempotencyKey: `learner-outcome:${input.sourceType}:${input.sourceId}` });
  if (input.assignmentId && input.lessonStableKey) await repo.supersedePrior(actor.organization_id, input.sourceType, actor.user_id, input.assignmentId, input.lessonStableKey, outcome.outcomeId);
  let mastery = null;
  if (input.competencyId) {
    const verificationStatus = await verifiedEvidenceStatus(actor, input.competencyId, input.evidenceIds || [], input.outcomeType);
    mastery = await repo.upsertMastery({ masteryId: `learner_mastery_${id(actor.organization_id, actor.user_id, input.competencyId)}`, organizationId: actor.organization_id, tenantId: tenant(actor), learnerUserId: actor.user_id, competencyId: input.competencyId, masteryStatus: deriveMasteryStatus(input.outcomeType), verificationStatus, sourceOutcomeId: outcome.outcomeId, evidenceIds: input.evidenceIds, provenance: { derivedFrom: outcome.outcomeId, policy: "curriculum-academic-result-v1", verificationAuthority: verificationStatus === "VERIFIED" ? "learner_competency_decisions" : null } });
  }
  await portfolio.projectLearnerResult(actor, outcome, mastery);
  await outbox.enqueue({ producer_id: "curriculum.learner-result", event_type: "learner.outcome.recorded", subject_type: "learner_outcome", subject_id: outcome.outcomeId, organization_id: actor.organization_id, originating_actor_id: actor.user_id, tenant_id: tenant(actor), occurred_at: outcome.evaluatedAt, idempotency_key: `learner.outcome.recorded:${outcome.outcomeId}`, correlation_id: `learner-result:${outcome.outcomeId}`, destination: "curriculum-learner-results", payload: { outcome_id: outcome.outcomeId, learner_user_id: actor.user_id, outcome_type: outcome.outcomeType, verification_status: mastery?.verificationStatus || "UNVERIFIED" } });
  return outcome;
}

export async function getLearnerResults(actor: any, courseId?: string | null) { const organizationId = String(actor.organization_id || actor.active_organization_id || ""); const tenantId = tenant({ ...actor, organization_id: organizationId }); const outcomes = await repo.listOutcomes(organizationId, tenantId, actor.user_id); const currentOutcomes = outcomes.filter((item) => item.status === "CURRENT"); const mastery = await repo.listMastery(organizationId, tenantId, actor.user_id); const progress = await repo.progress(organizationId, tenantId, actor.user_id, courseId); return { outcomes, currentOutcomes, mastery, progress, contractVersion: "1.0" }; }
