// MET-8 — work submission and sponsor review (build brief §14/§15/§16).
// Submission never automatically verifies evidence, verifies a skill, or
// pays out compensation. Only an accepted submission is even described as
// an evidence candidate, and only via the pure adapter in
// opportunity-evidence-adapter.ts — never a direct write.
import { randomUUID } from "crypto";
import { OpportunityExchangeRepo } from "../repo/opportunity-exchange-repo.js";
import { StudentOpportunitySubmission } from "../model/opportunity-contract.js";
import { OpportunityExchangeError } from "./opportunity-service.js";
import { assertAwardParticipant } from "./award-service.js";
import { describeOpportunitySubmissionEvidenceExpectation } from "./opportunity-evidence-adapter.js";
import { IntegrationOutboxRepo } from "../../../trusted-reporting/outbox-repo.js";

const repo = new OpportunityExchangeRepo();
const outbox = new IntegrationOutboxRepo();

function scope(actor: any) {
  const userId = String(actor?.user_id || "");
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId) throw new OpportunityExchangeError("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.", 403);
  return { userId, organizationId, tenantId };
}

export interface SubmitWorkInput {
  artifactRefs?: string[];
  studentComment?: string;
}

export async function submitWork(actor: any, awardId: string, input: SubmitWorkInput): Promise<StudentOpportunitySubmission> {
  const s = scope(actor);
  const award = await repo.getAwardById(awardId);
  if (!award || award.organizationId !== s.organizationId) throw new OpportunityExchangeError("NOT_FOUND", "Award not found.", 404);
  const role = await assertAwardParticipant(actor, award);
  if (role !== "STUDENT") throw new OpportunityExchangeError("FORBIDDEN", "Only the awarded student or team may submit work.", 403);
  if (!["AWARDED", "ACTIVE"].includes(award.status)) {
    throw new OpportunityExchangeError("AWARD_NOT_SUBMITTABLE", `Cannot submit work for an award in status ${award.status}.`, 400);
  }

  const existing = await repo.listSubmissionsForAward(awardId);
  const version = existing.length + 1;
  const submission = await repo.createSubmission({
    submissionId: `student_opportunity_submission_${randomUUID()}`,
    awardId,
    organizationId: s.organizationId,
    tenantId: s.tenantId,
    submittedByUserId: s.userId,
    artifactRefs: input.artifactRefs || [],
    studentComment: input.studentComment?.trim() || null,
    submittedAt: new Date().toISOString(),
    status: "SUBMITTED",
    reviewedByUserId: null,
    reviewedAt: null,
    reviewFeedback: null,
    version,
  });

  await repo.updateAwardStatus(awardId, "SUBMITTED");
  await outbox.enqueue({
    producer_id: "shs-api.metaverse.opportunity-exchange",
    event_type: "opportunity_exchange.submission.submitted",
    subject_type: "student_opportunity_submission",
    subject_id: submission.submissionId,
    organization_id: s.organizationId,
    originating_actor_id: s.userId,
    occurred_at: new Date().toISOString(),
    idempotency_key: submission.submissionId,
    correlation_id: `opportunity_exchange_award:${awardId}`,
    destination: "shs-metaverse-opportunity-exchange",
    payload: { award_id: awardId, submission_id: submission.submissionId, sponsor_user_id: award.sponsorUserId },
  });
  return submission;
}

export type ReviewDecision = "ACCEPT" | "REQUEST_REVISION" | "DECLINE";

export async function reviewSubmission(actor: any, submissionId: string, decision: ReviewDecision, feedback?: string): Promise<{ submission: StudentOpportunitySubmission; evidenceExpectation: ReturnType<typeof describeOpportunitySubmissionEvidenceExpectation> }> {
  const s = scope(actor);
  const submission = await repo.getSubmissionById(submissionId);
  if (!submission || submission.organizationId !== s.organizationId) throw new OpportunityExchangeError("NOT_FOUND", "Submission not found.", 404);
  const award = await repo.getAwardById(submission.awardId);
  if (!award) throw new OpportunityExchangeError("NOT_FOUND", "Award not found.", 404);
  const role = await assertAwardParticipant(actor, award);
  if (role !== "SPONSOR") throw new OpportunityExchangeError("FORBIDDEN", "Only the sponsor may review work.", 403);
  if (submission.status !== "SUBMITTED") throw new OpportunityExchangeError("INVALID_SUBMISSION_TRANSITION", `Cannot review a submission in status ${submission.status}.`, 400);

  const statusByDecision: Record<ReviewDecision, "ACCEPTED" | "NEEDS_REVISION" | "DECLINED"> = {
    ACCEPT: "ACCEPTED",
    REQUEST_REVISION: "NEEDS_REVISION",
    DECLINE: "DECLINED",
  };
  const nextSubmissionStatus = statusByDecision[decision];
  const updated = await repo.reviewSubmission(submissionId, nextSubmissionStatus, s.userId, feedback?.trim() || null);
  if (!updated) throw new OpportunityExchangeError("NOT_FOUND", "Submission not found.", 404);

  const nextAwardStatus = decision === "ACCEPT" ? "COMPLETED" : decision === "REQUEST_REVISION" ? "ACTIVE" : "CANCELLED";
  await repo.updateAwardStatus(award.awardId, nextAwardStatus);

  await outbox.enqueue({
    producer_id: "shs-api.metaverse.opportunity-exchange",
    event_type: decision === "ACCEPT" ? "opportunity_exchange.submission.accepted" : decision === "REQUEST_REVISION" ? "opportunity_exchange.submission.revision_requested" : "opportunity_exchange.submission.declined",
    subject_type: "student_opportunity_submission",
    subject_id: submissionId,
    organization_id: s.organizationId,
    originating_actor_id: s.userId,
    occurred_at: new Date().toISOString(),
    idempotency_key: `${submissionId}:${nextSubmissionStatus}`,
    correlation_id: `opportunity_exchange_award:${award.awardId}`,
    destination: "shs-metaverse-opportunity-exchange",
    payload: { award_id: award.awardId, submission_id: submissionId, student_user_id: award.studentId, team_id: award.teamId },
  });

  return { submission: updated, evidenceExpectation: describeOpportunitySubmissionEvidenceExpectation(decision === "ACCEPT") };
}

export async function listSubmissionsForAward(actor: any, awardId: string): Promise<StudentOpportunitySubmission[]> {
  const s = scope(actor);
  const award = await repo.getAwardById(awardId);
  if (!award || award.organizationId !== s.organizationId) throw new OpportunityExchangeError("NOT_FOUND", "Award not found.", 404);
  await assertAwardParticipant(actor, award);
  return repo.listSubmissionsForAward(awardId);
}

export { repo as submissionRepo };
