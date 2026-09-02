import { randomUUID } from "node:crypto";
import { withTransaction } from "../../../db/transaction.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { CurriculumCatalogRepo } from "../../curriculum-catalog/repo/curriculum-catalog-repo.js";
import { CompletionPolicyRepo } from "../../completion-policy/repo/completion-policy-repo.js";
import * as assignmentService from "../../assignments/service/assignment-service.js";
import type { ActivityActor, ActivityDefinitionRef } from "../model/activity-domain.js";
import { ActivityDomainRepo } from "../repo/activity-domain-repo.js";

const repo = new ActivityDomainRepo();
const catalogRepo = new CurriculumCatalogRepo();
const policyRepo = new CompletionPolicyRepo();
const outboxRepo = new IntegrationOutboxRepo();

export class ActivityDomainError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = "ActivityDomainError";
  }
}

function actorScope(actor: ActivityActor) {
  const organizationId = String(actor.organization_id || "");
  const userId = String(actor.user_id || "");
  if (!organizationId || !userId) throw new ActivityDomainError("SCOPE_MISSING", "Actor organization/user is required.", 403);
  return { organizationId, userId };
}

function findLesson(snapshot: any, unitStableKey: string, lessonStableKey: string): any | null {
  const unit = (snapshot?.units || []).find((u: any) => u.stableKey === unitStableKey);
  return unit?.lessons?.find((l: any) => l.stableKey === lessonStableKey) || null;
}

function stripKeys(items: any[] = []) {
  return items.map((item) => {
    const { correctIndex, modelAnswer, ...rest } = item || {};
    return rest;
  });
}

export async function resolveActivityDefinition(actor: ActivityActor, assignmentId: string, unitStableKey: string, lessonStableKey: string): Promise<ActivityDefinitionRef> {
  const { organizationId } = actorScope(actor);
  const assignment = await assignmentService.getAssignmentForActor(assignmentId, actor);
  if (!assignment || !assignment.curriculumReleaseId) throw new ActivityDomainError("ASSIGNMENT_NOT_FOUND", "Assignment not found.", 404);
  const release = await catalogRepo.findRelease(organizationId, assignment.curriculumReleaseId);
  if (!release) throw new ActivityDomainError("RELEASE_NOT_FOUND", "Assignment release not found.", 404);
  const lesson = findLesson(release.snapshot, unitStableKey, lessonStableKey);
  if (!lesson) throw new ActivityDomainError("LESSON_NOT_IN_RELEASE", "Lesson is not part of this assignment's bound release.", 404);
  if (assignment.assignedContentType === "LESSON" && assignment.assignedContentId !== `${unitStableKey}:${lessonStableKey}`) {
    throw new ActivityDomainError("LESSON_NOT_IN_ASSIGNMENT_SCOPE", "Lesson is not part of this assignment scope.", 404);
  }
  if (assignment.assignedContentType === "UNIT" && assignment.assignedContentId !== unitStableKey) {
    throw new ActivityDomainError("LESSON_NOT_IN_ASSIGNMENT_SCOPE", "Lesson is not part of this assignment scope.", 404);
  }
  return {
    assignmentId: assignment.id,
    curriculumReleaseId: release.releaseId,
    releaseVersion: release.versionNumber,
    unitStableKey,
    lessonStableKey,
    assessmentDefinitionId: lesson.assessmentDefinition?.assessmentDefinitionId,
    reflectionDefinitionId: lesson.reflectionDefinition?.reflectionDefinitionId,
    practiceDefinitionId: lesson.practiceDefinition?.practiceDefinitionId,
    assessmentItems: lesson.assessmentDefinition?.items || [],
    reflectionItems: lesson.reflectionDefinition?.items || [],
    practiceItems: lesson.practiceDefinition?.items || [],
    completionMode: lesson.practiceDefinition?.completionMode,
    passThresholdPercent: null,
  };
}

async function findAssessmentThreshold(actor: ActivityActor, assignmentId: string): Promise<number | null> {
  const assignment = await assignmentService.getAssignmentForActor(assignmentId, actor);
  if (!assignment?.completionPolicyId) return null;
  const requirements = await policyRepo.listRequirements(actor.organization_id, assignment.completionPolicyId);
  const req = requirements.find((item) => item.requirementType === "ASSESSMENT" && item.required);
  const threshold = Number((req?.configuration as any)?.passThresholdPercent);
  return Number.isFinite(threshold) ? threshold : null;
}

function normalizeItems(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function scoreObjective(items: any[], answers: any[]) {
  const byId = new Map(answers.map((a: any) => [String(a?.itemId || ""), a]));
  let score = 0;
  let maxScore = 0;
  let needsReview = false;
  for (const item of items) {
    if (item?.type === "mcq" && Number.isInteger(item.correctIndex)) {
      maxScore += 1;
      const answer = byId.get(String(item.itemId));
      if (Number(answer?.choiceIndex) === Number(item.correctIndex)) score += 1;
    } else {
      needsReview = true;
    }
  }
  const percent = maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : null;
  return { score: maxScore > 0 ? score : null, maxScore: maxScore > 0 ? maxScore : null, percent, needsReview };
}

function validateIdempotency(idempotencyKey: unknown) {
  const key = String(idempotencyKey || "").trim();
  if (!key) throw new ActivityDomainError("IDEMPOTENCY_KEY_REQUIRED", "idempotencyKey is required.", 400);
  return key.slice(0, 200);
}

async function enqueueCommittedActivityEvent(kind: "assessment" | "reflection" | "practice", actor: ActivityActor, subjectId: string, idempotencyKey: string, payload: Record<string, unknown>) {
  await outboxRepo.enqueue({
    producer_id: `curriculum.${kind}`,
    event_type: `${kind}.submitted`,
    subject_type: kind,
    subject_id: subjectId,
    organization_id: actor.organization_id,
    originating_actor_id: actor.user_id,
    occurred_at: new Date().toISOString(),
    idempotency_key: `${kind}.submitted:${idempotencyKey}`,
    correlation_id: `corr_${subjectId}`,
    destination: "activity-domain",
    ...payload,
  });
}

export async function getLearnerActivityState(actor: ActivityActor, assignmentId: string, unitStableKey: string, lessonStableKey: string) {
  const ref = await resolveActivityDefinition(actor, assignmentId, unitStableKey, lessonStableKey);
  return {
    assignmentId: ref.assignmentId,
    curriculumReleaseId: ref.curriculumReleaseId,
    releaseVersion: ref.releaseVersion,
    unitStableKey,
    lessonStableKey,
    assessment: ref.assessmentDefinitionId ? { assessmentDefinitionId: ref.assessmentDefinitionId, items: stripKeys(ref.assessmentItems || []) } : null,
    reflection: ref.reflectionDefinitionId ? { reflectionDefinitionId: ref.reflectionDefinitionId, items: ref.reflectionItems || [] } : null,
    practice: ref.practiceDefinitionId ? { practiceDefinitionId: ref.practiceDefinitionId, completionMode: ref.completionMode, items: stripKeys(ref.practiceItems || []) } : null,
  };
}

export async function submitAssessment(actor: ActivityActor, input: { assignmentId: string; unitStableKey: string; lessonStableKey: string; answers: unknown; idempotencyKey: unknown }) {
  const { organizationId, userId } = actorScope(actor);
  const idempotencyKey = validateIdempotency(input.idempotencyKey);
  const existing = await repo.getAssessmentResultByIdempotency(organizationId, userId, idempotencyKey);
  if (existing) return existing;
  const ref = await resolveActivityDefinition(actor, input.assignmentId, input.unitStableKey, input.lessonStableKey);
  if (!ref.assessmentDefinitionId) throw new ActivityDomainError("ASSESSMENT_NOT_DEFINED", "No assessment definition exists for this assigned lesson.", 404);
  const answers = normalizeItems(input.answers);
  const scored = scoreObjective(ref.assessmentItems || [], answers);
  const threshold = await findAssessmentThreshold(actor, ref.assignmentId);
  if (threshold == null && !scored.needsReview) throw new ActivityDomainError("PASS_THRESHOLD_NOT_CONFIGURED", "Assessment policy has no pass threshold configured.", 422);
  const passed = !scored.needsReview && scored.percent != null && threshold != null && scored.percent >= threshold;

  const created = await withTransaction(async (client: any) => {
    const txRepo = new ActivityDomainRepo(client.query.bind(client));
    const attemptNumber = await txRepo.nextAssessmentAttemptNumber(organizationId, userId, ref.assignmentId, ref.lessonStableKey);
    return txRepo.createAssessmentAttemptAndResult({
      assessmentAttemptId: `assessment_attempt_${randomUUID()}`,
      assessmentResultId: `assessment_result_${randomUUID()}`,
      organizationId, learnerUserId: userId, assignmentId: ref.assignmentId, curriculumReleaseId: ref.curriculumReleaseId,
      releaseVersion: ref.releaseVersion, unitStableKey: ref.unitStableKey, lessonStableKey: ref.lessonStableKey,
      assessmentDefinitionId: ref.assessmentDefinitionId, attemptNumber, idempotencyKey, answers,
      score: scored.score, maxScore: scored.maxScore, percent: scored.percent, passThresholdPercent: threshold,
      passed, needsReview: scored.needsReview,
    });
  });
  await enqueueCommittedActivityEvent("assessment", actor, created.assessmentResultId, idempotencyKey, { result_status: created.needsReview ? "PENDING_REVIEW" : created.passed ? "PASSED" : "NOT_PASSED" });
  return created;
}

export async function submitReflection(actor: ActivityActor, input: { assignmentId: string; unitStableKey: string; lessonStableKey: string; responses: unknown; idempotencyKey: unknown }) {
  const { organizationId, userId } = actorScope(actor);
  const idempotencyKey = validateIdempotency(input.idempotencyKey);
  const existing = await repo.getReflectionByIdempotency(organizationId, userId, idempotencyKey);
  if (existing) return existing;
  const ref = await resolveActivityDefinition(actor, input.assignmentId, input.unitStableKey, input.lessonStableKey);
  if (!ref.reflectionDefinitionId) throw new ActivityDomainError("REFLECTION_NOT_DEFINED", "No reflection definition exists for this assigned lesson.", 404);
  const responses = normalizeItems(input.responses);
  if (!responses.length) throw new ActivityDomainError("REFLECTION_RESPONSE_REQUIRED", "At least one response is required.", 400);
  const created = await withTransaction(async (client: any) => {
    const txRepo = new ActivityDomainRepo(client.query.bind(client));
    const version = await txRepo.nextReflectionVersion(organizationId, userId, ref.assignmentId, ref.lessonStableKey);
    return txRepo.createReflectionSubmission({
      reflectionSubmissionId: `reflection_submission_${randomUUID()}`,
      organizationId, learnerUserId: userId, assignmentId: ref.assignmentId, curriculumReleaseId: ref.curriculumReleaseId,
      releaseVersion: ref.releaseVersion, unitStableKey: ref.unitStableKey, lessonStableKey: ref.lessonStableKey,
      reflectionDefinitionId: ref.reflectionDefinitionId, version, responses, idempotencyKey,
    });
  });
  await enqueueCommittedActivityEvent("reflection", actor, created.reflectionSubmissionId, idempotencyKey, { result_status: created.status });
  return created;
}

export async function submitPractice(actor: ActivityActor, input: { assignmentId: string; unitStableKey: string; lessonStableKey: string; actions: unknown; idempotencyKey: unknown }) {
  const { organizationId, userId } = actorScope(actor);
  const idempotencyKey = validateIdempotency(input.idempotencyKey);
  const existing = await repo.getPracticeResultByIdempotency(organizationId, userId, idempotencyKey);
  if (existing) return existing;
  const ref = await resolveActivityDefinition(actor, input.assignmentId, input.unitStableKey, input.lessonStableKey);
  if (!ref.practiceDefinitionId) throw new ActivityDomainError("PRACTICE_NOT_DEFINED", "No practice definition exists for this assigned lesson.", 404);
  const actions = normalizeItems(input.actions);
  if (!actions.length) throw new ActivityDomainError("PRACTICE_ACTION_REQUIRED", "At least one canonical practice action is required.", 400);
  const scored = ref.completionMode === "OBJECTIVE" ? scoreObjective(ref.practiceItems || [], actions) : { score: null, maxScore: null, percent: null, needsReview: false };
  const completed = ref.completionMode === "OBJECTIVE" ? !!(scored.maxScore && scored.score === scored.maxScore) : true;
  const created = await withTransaction(async (client: any) => {
    const txRepo = new ActivityDomainRepo(client.query.bind(client));
    const attemptNumber = await txRepo.nextPracticeAttemptNumber(organizationId, userId, ref.assignmentId, ref.lessonStableKey);
    return txRepo.createPracticeAttemptAndResult({
      practiceAttemptId: `practice_attempt_${randomUUID()}`,
      practiceResultId: `practice_result_${randomUUID()}`,
      organizationId, learnerUserId: userId, assignmentId: ref.assignmentId, curriculumReleaseId: ref.curriculumReleaseId,
      releaseVersion: ref.releaseVersion, unitStableKey: ref.unitStableKey, lessonStableKey: ref.lessonStableKey,
      practiceDefinitionId: ref.practiceDefinitionId, attemptNumber, idempotencyKey, actions,
      score: scored.score, maxScore: scored.maxScore, completed,
    });
  });
  await enqueueCommittedActivityEvent("practice", actor, created.practiceResultId, idempotencyKey, { result_status: created.completed ? "COMPLETED" : "INCOMPLETE" });
  return created;
}

export const activityDomainRepo = repo;
