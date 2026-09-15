// MET-7 — City Mission orchestrator (build brief §7/§9/§11/§12/§24).
//
// The ONLY module in this domain that touches the database or another
// domain's service layer. Every fact is fetched fresh on every call —
// nothing about a mission is cached or persisted (build brief §31), so a
// mission's status, prerequisites, and entry decision are always
// re-derived from live canonical state. This is what makes "protected
// entry rechecks mission authority" and "direct URL/API cannot bypass
// mission eligibility" true by construction rather than by a special
// revalidation code path.
import type { ActorUser } from "../../assignments/service/assignment-service.js";
import * as entitlement from "../../assignments/service/assignment-entitlement-service.js";
import type { ResolvedAssignmentWork } from "../../assignments/service/assignment-entitlement-service.js";
import { evaluateAssignmentCompletion } from "../../completion-policy/service/completion-evaluator.js";
import type { RequirementResult } from "../../completion-policy/model/completion-policy.js";
import { CompletionPolicyRepo } from "../../completion-policy/repo/completion-policy-repo.js";
import { ArcadeRepo } from "../../arcade/repo/arcade-repo.js";
import { CurriculumCatalogRepo } from "../../curriculum-catalog/repo/curriculum-catalog-repo.js";
import { EnrollmentRepo } from "../../enrollments/repo/enrollment-repo.js";
import { StudioProjectService } from "../../studio/service/studio-project-service.js";
import { resolveMissionCareerContext } from "./mission-career-adapter.js";
import { buildCityMission, deriveMissionProjectionId, type ArcadeCandidate, type StudioLinkage } from "./mission-authority-adapter.js";
import { MetaverseEntryService, statusForMetaverseError, MetaverseEntryServiceError } from "../runtime/metaverse-entry-service.js";
import { MetaverseResourceResolutionError } from "../runtime/metaverse-resource-resolver.js";
import { emitMetaverseMissionEvent, type MissionOperationalEventName } from "./mission-event-adapter.js";
import type { CityMission } from "./mission-contract.js";

const completionPolicyRepo = new CompletionPolicyRepo();
const arcadeRepo = new ArcadeRepo();
const catalogRepo = new CurriculumCatalogRepo();
const enrollmentRepo = new EnrollmentRepo();
const studioProjectService = new StudioProjectService();

export class MissionServiceError extends Error {
  constructor(public code: string, message: string, public statusCode = 403) {
    super(message);
  }
}

export class MissionNotFoundError extends MissionServiceError {
  constructor() { super("MISSION_NOT_FOUND", "Mission not found.", 404); }
}

export class MissionNotEnterableError extends MissionServiceError {
  constructor(public mission: CityMission) {
    super("MISSION_NOT_ENTERABLE", mission.nextAction.reason || "This mission cannot be entered right now.", 403);
  }
}

export class MissionSubmissionNotSupportedError extends MissionServiceError {
  constructor() {
    super("MISSION_SUBMISSION_NOT_SUPPORTED", "This mission type has no canonical submission authority in the metaverse. Complete it through its owning domain (curriculum, Arcade, or Studio) directly.", 409);
  }
}

function narrowActor(user: any): ActorUser {
  const userId = String(user?.user_id || user?.id || "");
  const organizationId = String(user?.active_organization_id || user?.organization_id || "");
  if (!userId || !organizationId) throw new MetaverseEntryServiceError("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.", 403);
  return { user_id: userId, organization_id: organizationId, roles: user?.roles || [] };
}

async function resolveArcadeCandidates(actor: ActorUser, work: ResolvedAssignmentWork): Promise<ArcadeCandidate[]> {
  const assignment = work.assignment;
  const candidates = new Map<string, ArcadeCandidate>();

  if (assignment.completionPolicyId) {
    const requirements = await completionPolicyRepo.listRequirements(actor.organization_id, assignment.completionPolicyId);
    for (const req of requirements) {
      if (req.requirementType !== "ARCADE" || !req.targetReference) continue;
      const activity = await arcadeRepo.getActivityById(req.targetReference);
      if (!activity) continue;
      const mastery = await arcadeRepo.hasMasteryForActivity(actor.organization_id, actor.user_id, activity.id);
      candidates.set(activity.id, { arcadeActivityId: activity.id, title: activity.title, lessonId: activity.lessonId, requiredByPolicy: req.required, masteryAchieved: Boolean(mastery) });
    }
  }

  const lesson = work.scopeLessons[0];
  if (assignment.assignedContentType === "LESSON" && lesson) {
    // curriculum_lesson_arcade_activities (migration 064) is the real
    // Lesson<->Arcade Activity DEFINITION link — arcade_activities.lesson_id
    // is documented dead/free-text with zero runtime consumers, so it is
    // never read here.
    const lessonRowId = await catalogRepo.findLessonIdByStableKeys(actor.organization_id, lesson.unitStableKey, lesson.lessonStableKey);
    if (lessonRowId) {
      const links = await catalogRepo.listArcadeLinksForLesson(actor.organization_id, lessonRowId);
      for (const link of links) {
        if (candidates.has(link.arcadeActivityId)) continue;
        const mastery = await arcadeRepo.hasMasteryForActivity(actor.organization_id, actor.user_id, link.arcadeActivityId);
        candidates.set(link.arcadeActivityId, { arcadeActivityId: link.arcadeActivityId, title: link.title, lessonId: lessonRowId, requiredByPolicy: false, masteryAchieved: Boolean(mastery) });
      }
    }
  }
  return [...candidates.values()];
}

async function resolveRequirements(actor: ActorUser, work: ResolvedAssignmentWork): Promise<RequirementResult[]> {
  const assignment = work.assignment;
  if (assignment.assignedContentType !== "LESSON" || !assignment.completionPolicyId) return [];
  const lesson = work.scopeLessons[0];
  if (!lesson) return [];
  try {
    const evaluation = await evaluateAssignmentCompletion(actor, assignment.id, lesson.unitStableKey, lesson.lessonStableKey);
    return evaluation.requirements;
  } catch {
    return [];
  }
}

// Studio linkage is read-only and best-effort: a student without Studio
// access, or an assignment with no Studio project yet, must never block
// mission projection — see StudioProjectService.list()'s own permission
// gate, which this deliberately swallows rather than propagating.
async function resolveStudioLinkage(user: any, assignmentId: string): Promise<StudioLinkage | null> {
  try {
    const projects = await studioProjectService.list(user);
    const project = projects.find((p: any) => p.assignmentId === assignmentId);
    if (!project) return { hasProject: false, studioStatus: null, reviewStatus: null, deliveryStatus: null };
    return { hasProject: true, studioStatus: project.status, reviewStatus: project.reviewStatus, deliveryStatus: project.deliveryStatus };
  } catch {
    return null;
  }
}

async function resolveProgramId(actor: ActorUser, work: ResolvedAssignmentWork): Promise<string | null> {
  if (!work.assignment.cohortId) return null;
  try {
    const cohort = await enrollmentRepo.getCohortById(work.assignment.cohortId);
    return cohort && cohort.organizationId === actor.organization_id ? cohort.programId : null;
  } catch {
    return null;
  }
}

async function projectMission(user: any, actor: ActorUser, work: ResolvedAssignmentWork, now: Date): Promise<CityMission> {
  const [requirements, arcadeCandidates, studio, programId] = await Promise.all([
    resolveRequirements(actor, work),
    resolveArcadeCandidates(actor, work),
    work.assignment.assignmentType === "artifact" ? resolveStudioLinkage(user, work.assignment.id) : Promise.resolve<StudioLinkage | null>(null),
    resolveProgramId(actor, work),
  ]);
  const careerContext = await resolveMissionCareerContext(actor.organization_id, programId);
  const mission = buildCityMission({ work, organizationId: actor.organization_id, studentId: actor.user_id, requirements, arcadeCandidates, studio, careerContext, now });
  return { ...mission, programId };
}

export async function listMissionsForActor(user: any, now: Date = new Date()): Promise<CityMission[]> {
  const actor = narrowActor(user);
  const workItems = await entitlement.listAssignedWork(actor, now);
  return Promise.all(workItems.map((work) => projectMission(user, actor, work, now)));
}

export async function getMissionForActor(user: any, missionProjectionId: string, now: Date = new Date()): Promise<CityMission | null> {
  const actor = narrowActor(user);
  const workItems = await entitlement.listAssignedWork(actor, now);
  const match = workItems.find((work) => deriveMissionProjectionId(actor.organization_id, actor.user_id, work.assignment.id) === missionProjectionId);
  if (!match) return null;
  return projectMission(user, actor, match, now);
}

const entryService = new MetaverseEntryService();

function missionResource(mission: CityMission) {
  return mission.location.metaverseActivityId
    ? { scope: "activity", district_id: mission.location.districtId, facility_id: mission.location.facilityId, activity_id: mission.location.metaverseActivityId }
    : { scope: "facility", district_id: mission.location.districtId, facility_id: mission.location.facilityId };
}

function canEnterMission(mission: CityMission): boolean {
  return mission.missionStatus !== "LOCKED" && mission.missionStatus !== "CLOSED";
}

export async function enterMission(user: any, missionProjectionId: string, options: { cameraContext?: any; clientBody?: any; exit?: boolean; now?: Date } = {}) {
  const mission = await getMissionForActor(user, missionProjectionId, options.now);
  if (!mission) throw new MissionNotFoundError();
  if (!options.exit && !canEnterMission(mission)) throw new MissionNotEnterableError(mission);

  const entry = await entryService.decide({
    user,
    resource: missionResource(mission),
    clientBody: options.clientBody,
    cameraContext: options.cameraContext,
    emitEvent: true,
    eventName: options.exit ? "activity_exit" : "activity_start",
  });

  const enterable = canEnterMission(mission) && entry.can_enter;
  if (options.exit) {
    emitMetaverseMissionEvent("metaverse.mission.exited", { missionProjectionId: mission.missionProjectionId, assignmentId: mission.assignmentId, missionStatus: mission.missionStatus });
  } else if (enterable) {
    emitMetaverseMissionEvent("metaverse.mission.started", { missionProjectionId: mission.missionProjectionId, assignmentId: mission.assignmentId, missionStatus: mission.missionStatus });
  }
  return { mission, entry, can_enter: enterable };
}

export async function recordMissionViewed(user: any, missionProjectionId: string, now?: Date) {
  const mission = await getMissionForActor(user, missionProjectionId, now);
  if (!mission) throw new MissionNotFoundError();
  emitMetaverseMissionEvent("metaverse.mission.viewed", { missionProjectionId: mission.missionProjectionId, assignmentId: mission.assignmentId, missionStatus: mission.missionStatus });
  return mission;
}

export async function recordMissionActivityCompleted(user: any, missionProjectionId: string, now?: Date) {
  const mission = await getMissionForActor(user, missionProjectionId, now);
  if (!mission) throw new MissionNotFoundError();
  if (!canEnterMission(mission)) throw new MissionNotEnterableError(mission);
  // Operational fact only — never writes curriculum_lesson_completions,
  // arcade_results, assessment_results, or any evidence/outcome table.
  emitMetaverseMissionEvent("metaverse.mission.activity_completed", { missionProjectionId: mission.missionProjectionId, assignmentId: mission.assignmentId, missionStatus: mission.missionStatus });
  return mission;
}

export async function submitMission(user: any, missionProjectionId: string, now?: Date) {
  const mission = await getMissionForActor(user, missionProjectionId, now);
  if (!mission) throw new MissionNotFoundError();
  if (!canEnterMission(mission)) throw new MissionNotEnterableError(mission);
  if (mission.evidenceExpectations.possibleSourceType !== "STUDIO_DELIVERY") throw new MissionSubmissionNotSupportedError();
  emitMetaverseMissionEvent("metaverse.mission.submitted", { missionProjectionId: mission.missionProjectionId, assignmentId: mission.assignmentId, missionStatus: mission.missionStatus });
  return {
    mission,
    recorded: true,
    note: "This records an operational fact only. It does not submit a Studio delivery, create evidence, or change assignment/curriculum truth — use Studio's own submit-for-review flow to actually submit your project.",
  };
}

export function statusForMissionError(error: any): number {
  if (error instanceof MissionServiceError) return error.statusCode;
  if (error instanceof MetaverseEntryServiceError || error instanceof MetaverseResourceResolutionError) return statusForMetaverseError(error);
  return statusForMetaverseError(error);
}

export { MetaverseEntryServiceError };
export type { MissionOperationalEventName };
