// SHF Lesson + Assignment + Curriculum — Phase 3.
//
// The ONE canonical place that answers "what curriculum is this learner
// assigned, and what should they do next?" (Steps 7/12). Every consumer
// (student assigned-work API, Calendar, future Curriculum/Career
// surfaces) must call through here rather than re-deriving this logic —
// see assignment-service.ts's own listForUser()/getAssignmentForActor(),
// which this module wraps and enriches, never re-implements.
//
// Reads curriculum_lesson_completions (Phase 0's canonical backend fact)
// to derive progress. Never writes to it, never invents a new completion
// concept, never creates a Completion Policy Engine (that's Phase 4).
import { query } from "../../../db/client.js";
import { CurriculumCatalogRepo } from "../../curriculum-catalog/repo/curriculum-catalog-repo.js";
import * as assignmentService from "./assignment-service.js";
import type { ActorUser } from "./assignment-service.js";
import type { Assignment } from "../model/assignment.js";
import { computeDueState } from "../model/assignment.js";

const catalogRepo = new CurriculumCatalogRepo();

export type DerivedAccessState = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "OVERDUE" | "COMPLETED";

export interface ResolvedLessonRef {
  unitStableKey: string;
  lessonStableKey: string;
  title: string;
  sequence: number;
  completed: boolean;
}

export interface ResolvedAssignmentWork {
  assignment: Assignment;
  studioRequirement: { required: boolean; projectType: "WEBSITE" | "AI_AGENT" | null } | null;
  curriculumRelease: { releaseId: string; versionNumber: number; courseTitle: string; courseStableKey: string } | null;
  assignedContent: { type: "COURSE" | "UNIT" | "LESSON"; title: string } | null;
  scopeLessons: ResolvedLessonRef[]; // empty for legacy/non-catalog assignments
  completedCount: number;
  totalCount: number;
  nextLesson: ResolvedLessonRef | null; // first incomplete lesson in scope, or null if all complete / not applicable
  accessState: DerivedAccessState;
}

function withinScope(snapshot: any, contentType: string | null, contentId: string | null): { unitStableKey: string; lessonStableKey: string; title: string; sequence: number }[] {
  const units: any[] = Array.isArray(snapshot?.units) ? snapshot.units : [];
  const flat: { unitStableKey: string; lessonStableKey: string; title: string; sequence: number }[] = [];
  const orderedUnits = [...units].sort((a, b) => a.sequence - b.sequence);

  for (const unit of orderedUnits) {
    if (contentType === "UNIT" && unit.stableKey !== contentId) continue;
    const lessons: any[] = Array.isArray(unit.lessons) ? [...unit.lessons].sort((a, b) => a.sequence - b.sequence) : [];
    for (const lesson of lessons) {
      if (contentType === "LESSON") {
        const [unitKey, lessonKey] = String(contentId).split(":");
        if (unit.stableKey !== unitKey || lesson.stableKey !== lessonKey) continue;
      }
      flat.push({ unitStableKey: unit.stableKey, lessonStableKey: lesson.stableKey, title: lesson.title, sequence: lesson.sequence });
    }
  }
  return flat;
}

// Exported (Phase 5.5) so student-catalog-service.ts can compute whole-
// course progress with the exact same query this file already uses for
// per-assignment progress — never a second, drifting implementation.
export async function completedLessonKeys(organizationId: string, userId: string, curriculumId: string): Promise<Set<string>> {
  const res = await query(
    `SELECT lesson_id FROM curriculum_lesson_completions WHERE organization_id = $1 AND user_id = $2 AND curriculum_id = $3`,
    [organizationId, userId, curriculumId],
  );
  return new Set(res.rows.map((r: any) => r.lesson_id));
}

// Deterministic access-state rule (Step 12/16), applied in this fixed
// order — never re-ordered per assignment or per caller:
//   1. now < availableAt              -> LOCKED
//   2. all scope lessons completed    -> COMPLETED (an honest aggregate
//      of already-canonical per-lesson facts, never a new completion
//      concept — see file header)
//   3. now > dueAt                    -> OVERDUE
//   4. some (but not all) completed   -> IN_PROGRESS
//   5. otherwise                      -> AVAILABLE
function deriveAccessState(assignment: Assignment, completedCount: number, totalCount: number, now: Date): DerivedAccessState {
  if (assignment.availableAt && new Date(assignment.availableAt) > now) return "LOCKED";
  if (totalCount > 0 && completedCount === totalCount) return "COMPLETED";
  if (new Date(assignment.dueAt) < now) return "OVERDUE";
  if (completedCount > 0) return "IN_PROGRESS";
  return "AVAILABLE";
}

export async function resolveAssignmentWork(assignment: Assignment, actor: ActorUser, now: Date = new Date()): Promise<ResolvedAssignmentWork> {
  const requirementResult = assignment.completionPolicyId
    ? await query(
      `SELECT required, configuration
       FROM completion_policy_requirements
       WHERE organization_id=$1 AND policy_id=$2 AND requirement_type='STUDIO_PROJECT'
       ORDER BY sequence ASC LIMIT 1`,
      [actor.organization_id, assignment.completionPolicyId],
    )
    : null;
  const studioRequirementValue = requirementResult?.rows[0]
    ? {
      required: Boolean(requirementResult.rows[0].required),
      projectType: (requirementResult.rows[0].configuration?.projectType || requirementResult.rows[0].configuration?.allowedProjectType || null) as "WEBSITE" | "AI_AGENT" | null,
    }
    : null;
  if (!assignment.curriculumReleaseId) {
    return {
      assignment,
      studioRequirement: studioRequirementValue,
      curriculumRelease: null,
      assignedContent: null,
      scopeLessons: [],
      completedCount: 0,
      totalCount: 0,
      nextLesson: null,
      accessState: assignment.availableAt && new Date(assignment.availableAt) > now ? "LOCKED" : new Date(assignment.dueAt) < now ? "OVERDUE" : "AVAILABLE",
    };
  }

  const release = await catalogRepo.findRelease(actor.organization_id, assignment.curriculumReleaseId);
  if (!release) {
    // The release existed at assignment-creation time (FK-enforced) and
    // is immutable, so this can only mean an organization-context
    // mismatch on this read — fail honest/empty, never guess.
    return { assignment, studioRequirement: studioRequirementValue, curriculumRelease: null, assignedContent: null, scopeLessons: [], completedCount: 0, totalCount: 0, nextLesson: null, accessState: "LOCKED" };
  }
  const snapshot: any = release.snapshot;
  const scope = withinScope(snapshot, assignment.assignedContentType, assignment.assignedContentId);
  const completed = await completedLessonKeys(actor.organization_id, actor.user_id, snapshot.course.stableKey);

  const scopeLessons: ResolvedLessonRef[] = scope.map((l) => ({ ...l, completed: completed.has(l.lessonStableKey) }));
  const completedCount = scopeLessons.filter((l) => l.completed).length;
  const nextLesson = scopeLessons.find((l) => !l.completed) || null;

  const contentTitle = assignment.assignedContentType === "COURSE"
    ? snapshot.course.title
    : assignment.assignedContentType === "UNIT"
      ? (snapshot.units.find((u: any) => u.stableKey === assignment.assignedContentId)?.title || "")
      : (scopeLessons[0]?.title || "");

  return {
    assignment,
    studioRequirement: studioRequirementValue,
    curriculumRelease: { releaseId: release.releaseId, versionNumber: release.versionNumber, courseTitle: snapshot.course.title, courseStableKey: snapshot.course.stableKey },
    assignedContent: assignment.assignedContentType ? { type: assignment.assignedContentType, title: contentTitle } : null,
    scopeLessons,
    completedCount,
    totalCount: scopeLessons.length,
    nextLesson,
    accessState: deriveAccessState(assignment, completedCount, scopeLessons.length, now),
  };
}

export async function listAssignedWork(actor: ActorUser, now: Date = new Date()): Promise<ResolvedAssignmentWork[]> {
  const assignments = await assignmentService.listForUser(actor);
  return Promise.all(assignments.map((a) => resolveAssignmentWork(a, actor, now)));
}

export async function resolveAssignmentWorkForActor(assignmentId: string, actor: ActorUser, now: Date = new Date()): Promise<ResolvedAssignmentWork | null> {
  const assignment = await assignmentService.getAssignmentForActor(assignmentId, actor);
  if (!assignment) return null;
  return resolveAssignmentWork(assignment, actor, now);
}

export interface NextWorkResult {
  reason: "actionable_work" | "locked_upcoming" | "nothing_to_do";
  work: ResolvedAssignmentWork | null;
}

// Deterministic global priority (Step 12), documented and fixed:
//   1. OVERDUE assignments, earliest dueAt first
//   2. AVAILABLE/IN_PROGRESS assignments, earliest dueAt first
//   3. (nothing actionable) the soonest LOCKED assignment, as an honest
//      "nothing to do right now, next opens at X" signal
//   4. nothing at all -> reason "nothing_to_do"
// COMPLETED assignments are never returned as next work.
export async function resolveNextWork(actor: ActorUser, now: Date = new Date()): Promise<NextWorkResult> {
  const all = await listAssignedWork(actor, now);
  const byDueAt = (a: ResolvedAssignmentWork, b: ResolvedAssignmentWork) => new Date(a.assignment.dueAt).getTime() - new Date(b.assignment.dueAt).getTime();

  const overdue = all.filter((w) => w.accessState === "OVERDUE").sort(byDueAt);
  if (overdue.length) return { reason: "actionable_work", work: overdue[0] };

  const actionable = all.filter((w) => w.accessState === "AVAILABLE" || w.accessState === "IN_PROGRESS").sort(byDueAt);
  if (actionable.length) return { reason: "actionable_work", work: actionable[0] };

  const locked = all
    .filter((w) => w.accessState === "LOCKED")
    .sort((a, b) => new Date(a.assignment.availableAt || 0).getTime() - new Date(b.assignment.availableAt || 0).getTime());
  if (locked.length) return { reason: "locked_upcoming", work: locked[0] };

  return { reason: "nothing_to_do", work: null };
}

export { computeDueState };
