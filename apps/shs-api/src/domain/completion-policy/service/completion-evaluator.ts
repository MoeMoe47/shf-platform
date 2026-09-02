// SHF Lesson + Assignment + Curriculum — Phase 4.
//
// The ONE canonical backend Completion Evaluator (Step 8). Never called
// from the browser directly with a "completed: true" claim — it always
// re-derives eligibility from authoritative domain records via
// requirement-adapters.ts. Server-side only.
import { CompletionPolicyRepo } from "../repo/completion-policy-repo.js";
import { CurriculumCatalogRepo } from "../../curriculum-catalog/repo/curriculum-catalog-repo.js";
import * as assignmentService from "../../assignments/service/assignment-service.js";
import type { ActorUser } from "../../assignments/service/assignment-service.js";
import type { Assignment } from "../../assignments/model/assignment.js";
import { evaluateRequirement } from "./requirement-adapters.js";
import type { RequirementResult, CompletionPolicyRow } from "../model/completion-policy.js";

const policyRepo = new CompletionPolicyRepo();
const catalogRepo = new CurriculumCatalogRepo();

export interface CompletionEvaluationResult {
  eligible: boolean;
  assignmentId: string | null;
  curriculumReleaseId: string | null;
  releaseVersion: number | null;
  completionPolicyId: string | null;
  completionPolicyVersion: number | null;
  requirements: RequirementResult[];
  reason: string;
}

export function findLessonInSnapshot(snapshot: any, unitStableKey: string, lessonStableKey: string): any | null {
  const unit = (snapshot?.units || []).find((u: any) => u.stableKey === unitStableKey);
  const lesson = unit?.lessons?.find((l: any) => l.stableKey === lessonStableKey);
  return lesson || null;
}

// Step 9: deterministic overall decision. ALL required requirements must
// be SATISFIED. Optional requirements never block. A required
// requirement in any other state (UNSATISFIED/NOT_AVAILABLE/
// NOT_VERIFIABLE/ERROR) fails the whole evaluation — never silently
// skipped.
function decideEligible(results: RequirementResult[]): boolean {
  return results.filter((r) => r.required).every((r) => r.status === "SATISFIED");
}

async function evaluateWithPolicy(actor: ActorUser, assignment: Assignment, policy: CompletionPolicyRow, unitStableKey: string, lessonStableKey: string): Promise<CompletionEvaluationResult> {
  const release = await catalogRepo.findRelease(actor.organization_id, policy.curriculumReleaseId);
  const lessonSnapshot = release ? findLessonInSnapshot(release.snapshot, unitStableKey, lessonStableKey) : null;
  const lessonResolved = !!lessonSnapshot;
  const requirements = await policyRepo.listRequirements(actor.organization_id, policy.policyId);
  const results = await Promise.all(requirements.map((r) => evaluateRequirement(r, {
    organizationId: actor.organization_id,
    learnerUserId: actor.user_id,
    assignmentId: assignment.id,
    curriculumReleaseId: policy.curriculumReleaseId,
    releaseVersion: release?.versionNumber ?? null,
    unitStableKey,
    lessonStableKey,
    lessonResolved,
    lessonSnapshot,
  })));
  const eligible = decideEligible(results);
  return {
    eligible,
    assignmentId: assignment.id,
    curriculumReleaseId: policy.curriculumReleaseId,
    releaseVersion: release?.versionNumber ?? null,
    completionPolicyId: policy.policyId,
    completionPolicyVersion: policy.version,
    requirements: results,
    reason: eligible ? "All required requirements satisfied." : "One or more required requirements are not satisfied.",
  };
}

// Reverse lookup used at the legacy gating point (curriculum-completion-
// service.ts): given only (curriculumId, lessonId) — the free-text
// static-content identifiers the existing route already takes — find
// whether ANY assignment this learner is entitled to both (a) resolves
// to this exact curriculum/lesson via its bound release snapshot, and
// (b) has a completion_policy_id bound. If none do, this content is
// simply not institutionally gated (Step 10's explicit legacy/demo
// compatibility requirement) and the caller must preserve old behavior
// unchanged. If one or more do, satisfying ANY one of their policies is
// sufficient (a learner reaching the same real content through more than
// one assignment path should not be double-gated).
export async function findApplicablePolicyForLessonCompletion(
  actor: ActorUser,
  curriculumId: string,
  lessonId: string,
): Promise<{ assignment: Assignment; policy: CompletionPolicyRow; unitStableKey: string; lessonStableKey: string } | null> {
  const assignments = await assignmentService.listForUser(actor);
  for (const assignment of assignments) {
    if (!assignment.curriculumReleaseId || !assignment.completionPolicyId) continue;
    const release = await catalogRepo.findRelease(actor.organization_id, assignment.curriculumReleaseId);
    if (!release) continue;
    const snapshot: any = release.snapshot;
    if (snapshot?.course?.stableKey !== curriculumId) continue;

    for (const unit of snapshot.units || []) {
      const lesson = (unit.lessons || []).find((l: any) => l.stableKey === lessonId);
      if (!lesson) continue;
      if (assignment.assignedContentType === "LESSON" && assignment.assignedContentId !== `${unit.stableKey}:${lessonId}`) continue;
      if (assignment.assignedContentType === "UNIT" && assignment.assignedContentId !== unit.stableKey) continue;
      const policy = await policyRepo.findById(actor.organization_id, assignment.completionPolicyId);
      if (!policy || policy.status !== "ACTIVE") continue;
      if (policy.curriculumReleaseId !== assignment.curriculumReleaseId) continue;
      return { assignment, policy, unitStableKey: unit.stableKey, lessonStableKey: lessonId };
    }
  }
  return null;
}

export async function evaluateLessonCompletion(actor: ActorUser, curriculumId: string, lessonId: string): Promise<CompletionEvaluationResult | null> {
  const applicable = await findApplicablePolicyForLessonCompletion(actor, curriculumId, lessonId);
  if (!applicable) return null; // no institutional policy applies — caller preserves legacy behavior
  return evaluateWithPolicy(actor, applicable.assignment, applicable.policy, applicable.unitStableKey, applicable.lessonStableKey);
}

// Assignment-scoped entry point (Step 29's POST /assignments/:id/check-completion).
export async function evaluateAssignmentCompletion(actor: ActorUser, assignmentId: string, unitStableKey: string, lessonStableKey: string): Promise<CompletionEvaluationResult> {
  const assignment = await assignmentService.getAssignmentForActor(assignmentId, actor);
  if (!assignment) throw new Error("assignment_not_found");
  if (!assignment.completionPolicyId) {
    return { eligible: false, assignmentId, curriculumReleaseId: assignment.curriculumReleaseId, releaseVersion: null, completionPolicyId: null, completionPolicyVersion: null, requirements: [], reason: "This assignment has no completion policy configured." };
  }
  const policy = await policyRepo.findById(actor.organization_id, assignment.completionPolicyId);
  if (!policy || policy.status !== "ACTIVE") {
    return { eligible: false, assignmentId, curriculumReleaseId: assignment.curriculumReleaseId, releaseVersion: null, completionPolicyId: assignment.completionPolicyId, completionPolicyVersion: null, requirements: [], reason: "Assignment's completion policy is not active." };
  }
  return evaluateWithPolicy(actor, assignment, policy, unitStableKey, lessonStableKey);
}
