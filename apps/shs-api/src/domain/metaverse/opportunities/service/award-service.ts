// MET-8 — award model (build brief §12/§18). Accepting a bid produces an
// immutable snapshot of exactly what was awarded. An award never creates
// employment, a credential, or verified skill by itself (build brief
// §18/§28) — those remain the sole authority of their own canonical
// domains (a future employment workflow, credentials, verified-evidence).
import { randomUUID } from "crypto";
import { OpportunityExchangeRepo } from "../repo/opportunity-exchange-repo.js";
import { StudentOpportunityAward } from "../model/opportunity-contract.js";
import { OpportunityExchangeError, getOpportunityByIdOrThrow, assertCanManageOpportunity } from "./opportunity-service.js";
import { tryProjectScheduleProjection } from "./opportunity-project-adapter.js";
import { IntegrationOutboxRepo } from "../../../trusted-reporting/outbox-repo.js";
import { enterpriseRepo } from "../../enterprise/service/enterprise-policy.js";

const repo = new OpportunityExchangeRepo();
const outbox = new IntegrationOutboxRepo();

function scope(actor: any) {
  const userId = String(actor?.user_id || "");
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId) throw new OpportunityExchangeError("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.", 403);
  return { userId, organizationId, tenantId };
}

// Payment intent markers are inert strings the future Treasury domain can
// key off of — MET-8 never writes a balance or ledger row (build brief §9).
function paymentIntentRef(awardId: string, compensationType: string): string | null {
  if (compensationType === "NONE" || compensationType === "NON_MONETARY") return null;
  return `payment_intent_${awardId}`;
}

export async function acceptBid(actor: any, bidId: string): Promise<StudentOpportunityAward> {
  const s = scope(actor);
  const bid = await repo.getBidById(bidId);
  if (!bid || bid.organizationId !== s.organizationId) throw new OpportunityExchangeError("NOT_FOUND", "Bid not found.", 404);
  const opportunity = await getOpportunityByIdOrThrow(bid.opportunityId);
  assertCanManageOpportunity(actor, opportunity);

  if (!["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"].includes(bid.status)) {
    throw new OpportunityExchangeError("INVALID_BID_TRANSITION", `Cannot accept a bid in status ${bid.status}.`, 400);
  }
  if (!["OPEN", "PAUSED", "CLOSED", "AWARD_PENDING"].includes(opportunity.status)) {
    throw new OpportunityExchangeError("OPPORTUNITY_NOT_AWARDABLE", `Opportunity is ${opportunity.status} and cannot accept a new award.`, 400);
  }
  const activeAwardsCount = await repo.countActiveAwardsForOpportunity(opportunity.opportunityId);
  if (activeAwardsCount >= opportunity.maxAwards) {
    throw new OpportunityExchangeError("AWARD_LIMIT_REACHED", "This opportunity already has its maximum number of active awards.", 409);
  }

  const awardId = `student_opportunity_award_${randomUUID()}`;
  const projectRef = await tryProjectScheduleProjection(actor, {
    title: opportunity.title,
    dueDate: opportunity.deadline,
    opportunityType: opportunity.opportunityType,
  });

  const award = await repo.createAward({
    awardId,
    opportunityId: opportunity.opportunityId,
    bidId: bid.bidId,
    organizationId: s.organizationId,
    tenantId: s.tenantId,
    studentId: bid.studentId,
    teamId: bid.teamId,
    sponsorUserId: s.userId,
    awardedAt: new Date().toISOString(),
    workScopeSnapshot: { title: opportunity.title, summary: opportunity.summary, description: opportunity.description, requiredSkills: opportunity.requiredSkills },
    deliverablesSnapshot: opportunity.deliverables,
    compensationSnapshot: { type: opportunity.compensationType, amount: opportunity.compensationAmount, currencyType: opportunity.currencyType, isIntentOnly: true },
    dueDate: opportunity.deadline,
    status: "AWARDED",
    projectRef,
    paymentIntentRef: paymentIntentRef(awardId, opportunity.compensationType),
  });

  await repo.updateBidStatus(bidId, "ACCEPTED");

  const nowActiveCount = activeAwardsCount + 1;
  if (nowActiveCount >= opportunity.maxAwards && opportunity.status !== "AWARDED") {
    // System-driven roll-forward: reaching max_awards is an unambiguous
    // terminal condition regardless of which intermediate lifecycle status
    // the opportunity was in when the last award landed.
    await repo.updateOpportunityStatus(opportunity.opportunityId, "AWARDED", opportunity.version);
  }

  await outbox.enqueue({
    producer_id: "shs-api.metaverse.opportunity-exchange",
    event_type: "opportunity_exchange.bid.accepted",
    subject_type: "student_opportunity_award",
    subject_id: awardId,
    organization_id: s.organizationId,
    originating_actor_id: s.userId,
    occurred_at: new Date().toISOString(),
    idempotency_key: awardId,
    correlation_id: `opportunity_exchange:${opportunity.opportunityId}`,
    destination: "shs-metaverse-opportunity-exchange",
    payload: { opportunity_id: opportunity.opportunityId, bid_id: bidId, award_id: awardId, student_user_id: bid.studentId, team_id: bid.teamId },
  });

  if (opportunity.sourceType === "STUDENT_ENTERPRISE" && opportunity.sourceRef) {
    // MET-12 — best-effort enterprise history only; the Award record
    // itself remains MET-8's durable execution authority.
    await enterpriseRepo.recordHistory({
      enterpriseId: opportunity.sourceRef,
      organizationId: s.organizationId,
      tenantId: s.tenantId,
      eventType: "OPPORTUNITY_AWARDED",
      actorUserId: s.userId,
      detail: { opportunityId: opportunity.opportunityId, awardId },
    }).catch(() => {});
  }

  return award;
}

export async function cancelAward(actor: any, awardId: string): Promise<StudentOpportunityAward> {
  const award = await repo.getAwardById(awardId);
  if (!award) throw new OpportunityExchangeError("NOT_FOUND", "Award not found.", 404);
  const opportunity = await getOpportunityByIdOrThrow(award.opportunityId);
  assertCanManageOpportunity(actor, opportunity);
  if (["COMPLETED", "CANCELLED", "EXPIRED"].includes(award.status)) {
    throw new OpportunityExchangeError("INVALID_AWARD_TRANSITION", `Cannot cancel an award in status ${award.status}.`, 400);
  }
  const updated = await repo.updateAwardStatus(awardId, "CANCELLED");
  return updated as StudentOpportunityAward;
}

async function isActiveTeamMember(teamId: string, organizationId: string, tenantId: string, userId: string): Promise<boolean> {
  const { query } = await import("../../../../db/client.js");
  const member = await query(
    "SELECT 1 FROM studio_team_members WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4 AND status='ACTIVE' AND left_at IS NULL",
    [teamId, organizationId, tenantId, userId],
  );
  return Boolean(member.rows[0]);
}

/** True if the actor is the awarded individual, an active member of the
 * awarded team, or a sponsor/admin who can manage the opportunity. Used to
 * gate both viewing an award and submitting work against it. */
export async function assertAwardParticipant(actor: any, award: StudentOpportunityAward): Promise<"STUDENT" | "SPONSOR"> {
  const s = scope(actor);
  if (award.organizationId !== s.organizationId) throw new OpportunityExchangeError("NOT_FOUND", "Award not found.", 404);
  if (award.studentId === s.userId) return "STUDENT";
  if (award.teamId && (await isActiveTeamMember(award.teamId, s.organizationId, s.tenantId, s.userId))) return "STUDENT";
  const opportunity = await getOpportunityByIdOrThrow(award.opportunityId);
  assertCanManageOpportunity(actor, opportunity);
  return "SPONSOR";
}

export async function getAwardForActor(actor: any, awardId: string): Promise<StudentOpportunityAward | null> {
  const s = scope(actor);
  const award = await repo.getAwardById(awardId);
  if (!award || award.organizationId !== s.organizationId) return null;
  try {
    await assertAwardParticipant(actor, award);
    return award;
  } catch {
    return null;
  }
}

export async function listAwardsForActor(actor: any): Promise<StudentOpportunityAward[]> {
  const s = scope(actor);
  return repo.listAwardsForStudent(s.organizationId, s.userId);
}

export { repo as awardRepo };
