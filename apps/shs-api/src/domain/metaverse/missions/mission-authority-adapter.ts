// MET-7 — City Mission builder (build brief §2/§3/§9).
//
// Pure composition only: every fact this module reads (assignment,
// resolved curriculum progress, completion-policy requirement results,
// arcade mastery, studio project status, career context) is produced
// elsewhere by canonical authorities and passed in already-resolved.
// This file never queries the database itself — see
// mission-projection-service.ts for the DB-touching orchestrator that
// gathers these inputs and calls buildCityMission().
import { createHash } from "node:crypto";
import type { Assignment } from "../../assignments/model/assignment.js";
import type { ResolvedAssignmentWork, DerivedAccessState } from "../../assignments/service/assignment-entitlement-service.js";
import type { RequirementResult } from "../../completion-policy/model/completion-policy.js";
import { computeDueState } from "../../assignments/model/assignment.js";
import { resolveMissionLocation } from "./mission-location-resolver.js";
import { describeMissionEvidenceExpectation, describeArcadePracticeEvidenceExpectation } from "./mission-evidence-adapter.js";
import type {
  CityMission,
  MissionArcadeRelation,
  MissionCareerContext,
  MissionNextAction,
  MissionNextActionKind,
  MissionPrerequisiteStatus,
  MissionStatus,
} from "./mission-contract.js";

export interface StudioLinkage {
  hasProject: boolean;
  studioStatus: string | null;
  reviewStatus: string | null;
  deliveryStatus: string | null;
}

export interface ArcadeCandidate {
  arcadeActivityId: string;
  title: string;
  lessonId: string | null;
  requiredByPolicy: boolean;
  masteryAchieved: boolean;
}

export function deriveMissionProjectionId(organizationId: string, studentId: string, assignmentId: string): string {
  const hash = createHash("sha256").update(`${organizationId}|${studentId}|${assignmentId}`, "utf8").digest("hex").slice(0, 32);
  return `miss_${hash}`;
}

const REQUIREMENT_PRIORITY = ["PRACTICE", "ARCADE", "ASSESSMENT", "REFLECTION", "STUDIO_PROJECT", "PROJECT", "LIVE_ATTENDANCE", "INSTRUCTOR_VERIFICATION", "EVIDENCE", "CONTENT"];

const REQUIREMENT_ACTION_KIND: Record<string, MissionNextActionKind> = {
  PRACTICE: "PRACTICE_SKILL",
  ARCADE: "PLAY_ARCADE_CHALLENGE",
  ASSESSMENT: "COMPLETE_ASSESSMENT",
  REFLECTION: "COMPLETE_ASSESSMENT",
  STUDIO_PROJECT: "SUBMIT_ARTIFACT",
  PROJECT: "SUBMIT_ARTIFACT",
  LIVE_ATTENDANCE: "AWAIT_INSTRUCTOR_REVIEW",
  INSTRUCTOR_VERIFICATION: "AWAIT_INSTRUCTOR_REVIEW",
  EVIDENCE: "AWAIT_INSTRUCTOR_REVIEW",
  CONTENT: "CONTINUE_LESSON",
};

function toPrerequisiteStatuses(results: RequirementResult[]): MissionPrerequisiteStatus[] {
  return results.map((r) => ({
    requirementType: r.type,
    required: r.required,
    satisfied: r.status === "SATISFIED",
    status: r.status,
    detail: r.reason,
  }));
}

function firstUnsatisfiedRequired(results: RequirementResult[]): RequirementResult | null {
  const byPriority = [...results].sort((a, b) => REQUIREMENT_PRIORITY.indexOf(a.type) - REQUIREMENT_PRIORITY.indexOf(b.type));
  return byPriority.find((r) => r.required && r.status !== "SATISFIED") || null;
}

// Studio review is a canonical human-verification authority (studio
// domain) — the only assignment-linked source honest enough to justify
// COMPLETED_VERIFIED_SOURCE here without the metaverse inventing its own
// verification step. Every other missionStatus is derived strictly from
// assignment-entitlement-service's own DerivedAccessState.
function deriveMissionStatus(accessState: DerivedAccessState, studio: StudioLinkage | null): MissionStatus {
  if (studio?.hasProject) {
    if (studio.deliveryStatus === "DELIVERED" || studio.reviewStatus === "APPROVED") return "COMPLETED_VERIFIED_SOURCE";
    if (studio.reviewStatus === "PENDING") return "SUBMITTED";
    if (studio.reviewStatus === "CHANGES_REQUIRED") return "IN_PROGRESS";
  }
  if (accessState === "COMPLETED") return "COMPLETED_SOURCE_PENDING_VERIFICATION";
  return accessState; // LOCKED | AVAILABLE | IN_PROGRESS | OVERDUE — identical vocabulary, reused verbatim.
}

function deriveNextAction(input: {
  missionStatus: MissionStatus;
  requirements: RequirementResult[];
  hasNextLesson: boolean;
  hasCareerContext: boolean;
  availableAt: string | null;
}): MissionNextAction {
  if (input.missionStatus === "LOCKED") {
    return {
      kind: "NONE",
      label: "Locked",
      reason: input.availableAt ? `Opens ${input.availableAt}.` : "This mission is not yet available.",
      blockingRequirementType: null,
    };
  }
  const blocking = firstUnsatisfiedRequired(input.requirements);
  if (blocking) {
    return {
      kind: REQUIREMENT_ACTION_KIND[blocking.type] || "START_CITY_MISSION",
      label: `Complete required ${blocking.type.toLowerCase()} step`,
      reason: blocking.reason,
      blockingRequirementType: blocking.type,
    };
  }
  if (input.missionStatus === "SUBMITTED") {
    return { kind: "AWAIT_INSTRUCTOR_REVIEW", label: "Await instructor review", reason: "Your submission is awaiting instructor review.", blockingRequirementType: null };
  }
  if (input.missionStatus === "COMPLETED_SOURCE_PENDING_VERIFICATION" || input.missionStatus === "COMPLETED_VERIFIED_SOURCE") {
    return input.hasCareerContext
      ? { kind: "CONTINUE_CAREER_PATHWAY", label: "Continue career pathway", reason: "This mission is complete; explore its related career pathway.", blockingRequirementType: null }
      : { kind: "NONE", label: "Complete", reason: "This mission is complete.", blockingRequirementType: null };
  }
  if (input.hasNextLesson) {
    return { kind: "CONTINUE_LESSON", label: "Continue lesson", reason: "Continue the next lesson in this mission's curriculum scope.", blockingRequirementType: null };
  }
  return { kind: "START_CITY_MISSION", label: "Start City Mission", reason: "Enter this mission's district and facility to begin.", blockingRequirementType: null };
}

export function buildCityMission(input: {
  work: ResolvedAssignmentWork;
  organizationId: string;
  studentId: string;
  requirements: RequirementResult[];
  arcadeCandidates: ArcadeCandidate[];
  studio: StudioLinkage | null;
  careerContext: MissionCareerContext | null;
  now: Date;
}): CityMission {
  const assignment: Assignment = input.work.assignment;
  const missionStatus = deriveMissionStatus(input.work.accessState, input.studio);
  const location = resolveMissionLocation({
    courseStableKey: input.work.curriculumRelease?.courseStableKey ?? null,
    courseTitle: input.work.curriculumRelease?.courseTitle ?? null,
    unitStableKey: input.work.scopeLessons[0]?.unitStableKey ?? null,
    lessonStableKey: assignment.assignedContentType === "LESSON" ? input.work.scopeLessons[0]?.lessonStableKey ?? null : null,
    lessonTitle: input.work.assignedContent?.type === "LESSON" ? input.work.assignedContent.title : null,
    assignmentType: assignment.assignmentType,
  });

  const arcadeRelations: MissionArcadeRelation[] = input.arcadeCandidates.map((candidate) => ({
    arcadeActivityId: candidate.arcadeActivityId,
    title: candidate.title,
    relationshipType: "ARCADE_PRACTICE_FOR_MISSION",
    requiredOrRecommended: candidate.requiredByPolicy ? "REQUIRED" : "RECOMMENDED",
    masteryAchieved: candidate.masteryAchieved,
    source: candidate.requiredByPolicy ? "completion_policy_requirement" : "lesson_link",
  }));

  const nextAction = deriveNextAction({
    missionStatus,
    requirements: input.requirements,
    hasNextLesson: Boolean(input.work.nextLesson),
    hasCareerContext: Boolean(input.careerContext?.careerIds.length),
    availableAt: assignment.availableAt,
  });

  const evidenceExpectations = arcadeRelations.some((r) => r.requiredOrRecommended === "REQUIRED") && !input.work.assignedContent
    ? describeArcadePracticeEvidenceExpectation()
    : describeMissionEvidenceExpectation({
      assignmentType: assignment.assignmentType,
      assignedContentType: assignment.assignedContentType,
      hasStudioProject: Boolean(input.studio?.hasProject),
    });

  return {
    missionProjectionId: deriveMissionProjectionId(input.organizationId, input.studentId, assignment.id),
    organizationId: input.organizationId,
    studentId: input.studentId,
    assignmentId: assignment.id,
    assignmentType: assignment.assignmentType,
    programId: null, // filled by orchestrator when resolvable from cohort/target
    courseStableKey: input.work.curriculumRelease?.courseStableKey ?? null,
    unitStableKey: location.metaverseActivityId ? null : input.work.scopeLessons[0]?.unitStableKey ?? null,
    lessonStableKey: assignment.assignedContentType === "LESSON" ? input.work.scopeLessons[0]?.lessonStableKey ?? null : null,
    arcadeAssignmentId: null,
    location,
    missionTitle: assignment.title,
    missionSummary: assignment.description || input.work.assignedContent?.title || assignment.title,
    missionStatus,
    dueState: computeDueState(assignment.dueAt, input.now),
    dueAt: assignment.dueAt,
    prerequisites: toPrerequisiteStatuses(input.requirements),
    arcadeRelations,
    nextAction,
    evidenceExpectations,
    careerContext: input.careerContext,
    projectionVersion: "MET-7",
    computedAt: input.now.toISOString(),
  };
}
