// MET-8 — bid/proposal contract and identity/team unforgeability (build
// brief §8/§22/§23). Bidder identity, team membership, and evidence
// ownership are always server-derived here — a client body can request a
// bidderType but never assert whose bid it is or which team it belongs to.
import { randomUUID } from "crypto";
import { query } from "../../../../db/client.js";
import { OpportunityExchangeRepo } from "../repo/opportunity-exchange-repo.js";
import { StudentOpportunityBid, OpportunityCompensationType } from "../model/opportunity-contract.js";
import { OpportunityExchangeError, OpportunityNotFoundError, getOpportunityByIdOrThrow, getEligibilityForActor, assertCanManageOpportunity } from "./opportunity-service.js";
import { getEvidenceForActor } from "../../../verified-evidence/service/verified-evidence-service.js";
import { isAdminTier } from "../../../shared/audience-eligibility.js";

const repo = new OpportunityExchangeRepo();

function scope(actor: any) {
  const userId = String(actor?.user_id || "");
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId) throw new OpportunityExchangeError("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.", 403);
  return { userId, organizationId, tenantId, roles: actor?.roles || [] };
}

async function assertActiveStudioTeamMember(teamId: string, organizationId: string, tenantId: string, userId: string) {
  const result = await query(
    `SELECT t.studio_team_id, t.name FROM studio_teams t
     JOIN studio_team_members m ON m.studio_team_id=t.studio_team_id AND m.organization_id=t.organization_id AND m.tenant_id=t.tenant_id
     WHERE t.studio_team_id=$1 AND t.organization_id=$2 AND t.tenant_id=$3 AND t.status='ACTIVE'
       AND m.user_id=$4 AND m.status='ACTIVE' AND m.left_at IS NULL`,
    [teamId, organizationId, tenantId, userId],
  );
  if (!result.rows[0]) throw new OpportunityExchangeError("TEAM_MEMBERSHIP_REQUIRED", "Team not found or you are not an active member.", 403);
  return result.rows[0];
}

async function activeStudioTeamMemberCount(teamId: string, organizationId: string, tenantId: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*)::int AS n FROM studio_team_members WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='ACTIVE' AND left_at IS NULL`,
    [teamId, organizationId, tenantId],
  );
  return Number(result.rows[0]?.n || 0);
}

async function assertEvidenceOwnership(actor: any, refs: string[] | undefined) {
  for (const evidenceId of refs || []) {
    const evidence = await getEvidenceForActor({ user_id: actor.user_id, organization_id: actor.organization_id || actor.active_organization_id }, evidenceId);
    if (!evidence) throw new OpportunityExchangeError("EVIDENCE_NOT_OWNED", `Evidence reference ${evidenceId} is not yours or does not exist.`, 403);
  }
}

export interface SubmitBidInput {
  bidderType: "INDIVIDUAL" | "TEAM";
  teamId?: string;
  proposalSummary: string;
  approach?: string;
  requestedCompensationAmount?: number;
  requestedCompensationType?: OpportunityCompensationType;
  estimatedCompletionDays?: number;
  portfolioEvidenceRefs?: string[];
  skillEvidenceRefs?: string[];
  availability?: string;
}

export async function submitBid(actor: any, opportunityId: string, input: SubmitBidInput): Promise<StudentOpportunityBid> {
  const s = scope(actor);
  const opportunity = await getOpportunityByIdOrThrow(opportunityId);
  if (opportunity.organizationId !== s.organizationId) throw new OpportunityNotFoundError();

  const evaluation = await getEligibilityForActor(actor, opportunity);
  if (evaluation.result === "RESTRICTED") {
    // The only RESTRICTED reason today is "you already have an active bid"
    // (opportunity-eligibility.ts) — surface it as the more specific
    // conflict it is, not a generic ineligibility.
    throw new OpportunityExchangeError("DUPLICATE_BID", "An active bid already exists for this opportunity.", 409);
  }
  if (evaluation.result !== "ELIGIBLE") {
    throw new OpportunityExchangeError("NOT_ELIGIBLE", `You are not eligible to bid on this opportunity (${evaluation.result}).`, 403);
  }

  const bidderType = input.bidderType === "TEAM" ? "TEAM" : "INDIVIDUAL";
  if (bidderType === "TEAM" && opportunity.participationMode === "INDIVIDUAL") {
    throw new OpportunityExchangeError("PARTICIPATION_MODE_MISMATCH", "This opportunity does not accept team bids.", 400);
  }
  if (bidderType === "INDIVIDUAL" && opportunity.participationMode === "TEAM") {
    throw new OpportunityExchangeError("PARTICIPATION_MODE_MISMATCH", "This opportunity requires a team bid.", 400);
  }

  let studentId: string | null = null;
  let teamId: string | null = null;
  if (bidderType === "INDIVIDUAL") {
    studentId = s.userId; // never accepted from the client body
  } else {
    const requestedTeamId = String(input.teamId || "").trim();
    if (!requestedTeamId) throw new OpportunityExchangeError("TEAM_ID_REQUIRED", "teamId is required for a team bid.", 400);
    await assertActiveStudioTeamMember(requestedTeamId, s.organizationId, s.tenantId, s.userId);
    const memberCount = await activeStudioTeamMemberCount(requestedTeamId, s.organizationId, s.tenantId);
    if (opportunity.teamSizeMin && memberCount < opportunity.teamSizeMin) {
      throw new OpportunityExchangeError("TEAM_TOO_SMALL", `This opportunity requires at least ${opportunity.teamSizeMin} team members.`, 400);
    }
    if (opportunity.teamSizeMax && memberCount > opportunity.teamSizeMax) {
      throw new OpportunityExchangeError("TEAM_TOO_LARGE", `This opportunity allows at most ${opportunity.teamSizeMax} team members.`, 400);
    }
    teamId = requestedTeamId;
  }

  const existing = studentId
    ? await repo.findActiveBidByStudent(opportunityId, studentId)
    : await repo.findActiveBidByTeam(opportunityId, teamId as string);
  if (existing) throw new OpportunityExchangeError("DUPLICATE_BID", "An active bid already exists for this opportunity.", 409);

  await assertEvidenceOwnership(actor, input.portfolioEvidenceRefs);
  await assertEvidenceOwnership(actor, input.skillEvidenceRefs);

  const proposalSummary = String(input.proposalSummary || "").trim();
  if (!proposalSummary) throw new OpportunityExchangeError("PROPOSAL_SUMMARY_REQUIRED", "proposalSummary is required.", 400);
  if (proposalSummary.length > 4000) throw new OpportunityExchangeError("PROPOSAL_SUMMARY_TOO_LONG", "proposalSummary exceeds maximum length.", 400);

  const now = new Date().toISOString();
  try {
    return await repo.createBid({
      bidId: `student_opportunity_bid_${randomUUID()}`,
      opportunityId,
      organizationId: s.organizationId,
      tenantId: s.tenantId,
      bidderType,
      studentId,
      teamId,
      proposalSummary,
      approach: input.approach?.trim() || null,
      requestedCompensationAmount: input.requestedCompensationAmount ?? null,
      requestedCompensationType: input.requestedCompensationType ?? null,
      estimatedCompletionDays: input.estimatedCompletionDays ?? null,
      portfolioEvidenceRefs: input.portfolioEvidenceRefs || [],
      skillEvidenceRefs: input.skillEvidenceRefs || [],
      availability: input.availability?.trim() || null,
      submittedAt: now,
      status: "SUBMITTED",
      revision: 1,
      withdrawnAt: null,
      createdByUserId: s.userId,
    });
  } catch (error: any) {
    if (String(error?.message || "").includes("duplicate key")) {
      throw new OpportunityExchangeError("DUPLICATE_BID", "An active bid already exists for this opportunity.", 409);
    }
    throw error;
  }
}

async function assertBidderOrManager(actor: any, bid: StudentOpportunityBid) {
  const s = scope(actor);
  if (bid.organizationId !== s.organizationId) throw new OpportunityExchangeError("NOT_FOUND", "Bid not found.", 404);
  if (isAdminTier(s.roles)) return;
  if (bid.bidderType === "INDIVIDUAL" && bid.studentId === s.userId) return;
  if (bid.bidderType === "TEAM" && bid.teamId) {
    await assertActiveStudioTeamMember(bid.teamId, s.organizationId, s.tenantId, s.userId);
    return;
  }
  throw new OpportunityExchangeError("FORBIDDEN", "You do not own this bid.", 403);
}

export async function withdrawBid(actor: any, bidId: string): Promise<StudentOpportunityBid> {
  const bid = await repo.getBidById(bidId);
  if (!bid) throw new OpportunityExchangeError("NOT_FOUND", "Bid not found.", 404);
  await assertBidderOrManager(actor, bid);
  if (!["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"].includes(bid.status)) {
    throw new OpportunityExchangeError("INVALID_BID_TRANSITION", `Cannot withdraw a bid in status ${bid.status}.`, 400);
  }
  const updated = await repo.updateBidStatus(bidId, "WITHDRAWN", undefined, { withdrawnAt: new Date().toISOString() });
  return updated as StudentOpportunityBid;
}

export async function listBidsForSponsor(actor: any, opportunityId: string): Promise<StudentOpportunityBid[]> {
  const opportunity = await getOpportunityByIdOrThrow(opportunityId);
  assertCanManageOpportunity(actor, opportunity);
  return repo.listBidsForOpportunity(opportunityId);
}

export async function getMyBidForOpportunity(actor: any, opportunityId: string): Promise<StudentOpportunityBid | null> {
  const s = scope(actor);
  const individual = await repo.findActiveBidByStudent(opportunityId, s.userId);
  return individual;
}

export async function shortlistBid(actor: any, bidId: string): Promise<StudentOpportunityBid> {
  const bid = await repo.getBidById(bidId);
  if (!bid) throw new OpportunityExchangeError("NOT_FOUND", "Bid not found.", 404);
  const opportunity = await getOpportunityByIdOrThrow(bid.opportunityId);
  assertCanManageOpportunity(actor, opportunity);
  if (bid.status !== "SUBMITTED" && bid.status !== "UNDER_REVIEW") {
    throw new OpportunityExchangeError("INVALID_BID_TRANSITION", `Cannot shortlist a bid in status ${bid.status}.`, 400);
  }
  const updated = await repo.updateBidStatus(bidId, "SHORTLISTED");
  return updated as StudentOpportunityBid;
}

export async function declineBid(actor: any, bidId: string): Promise<StudentOpportunityBid> {
  const bid = await repo.getBidById(bidId);
  if (!bid) throw new OpportunityExchangeError("NOT_FOUND", "Bid not found.", 404);
  const opportunity = await getOpportunityByIdOrThrow(bid.opportunityId);
  assertCanManageOpportunity(actor, opportunity);
  if (["ACCEPTED", "WITHDRAWN", "DECLINED", "EXPIRED"].includes(bid.status)) {
    throw new OpportunityExchangeError("INVALID_BID_TRANSITION", `Cannot decline a bid in status ${bid.status}.`, 400);
  }
  const updated = await repo.updateBidStatus(bidId, "DECLINED");
  return updated as StudentOpportunityBid;
}

export { repo as bidRepo };
