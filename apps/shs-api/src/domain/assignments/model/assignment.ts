// SHF Calendar Wave 2A — canonical Assignment domain model.
// Mirrors the shape/conventions established by
// src/domain/live-learning/model/live-session.ts.

export const ASSIGNMENT_STATUSES = ["draft", "published", "archived"] as const;
export type AssignmentStatus = typeof ASSIGNMENT_STATUSES[number];

export const ASSIGNMENT_TYPES = ["assignment", "quiz", "reflection", "artifact"] as const;
export type AssignmentType = typeof ASSIGNMENT_TYPES[number];

/**
 * SHF Calendar Wave 2A.1 — explicit visibility scope. There is no
 * "unset"/default value: every assignment must be created with one of
 * these two, on purpose (see the Wave 2A.1 report §9 — ambiguous
 * targeting must fail validation, never silently resolve to org-wide).
 *
 * "organization" = every student in the organization is entitled to see
 * it. "targeted" = only students with a row in assignment_targets for
 * this assignment are entitled to see it. There is no cohort/course/
 * program scope — no canonical membership model exists yet to check
 * those against (see the migration file's own header for the audit that
 * established this).
 */
export const ASSIGNMENT_VISIBILITY_SCOPES = ["organization", "targeted"] as const;
export type AssignmentVisibilityScope = typeof ASSIGNMENT_VISIBILITY_SCOPES[number];

export const ASSIGNMENT_TARGET_TYPES = ["LEARNER", "COHORT", "PROGRAM", "ORGANIZATION"] as const;
export type AssignmentTargetType = typeof ASSIGNMENT_TARGET_TYPES[number];

export interface AssignmentTarget {
  id: string;
  assignmentId: string;
  organizationId: string;
  targetType: AssignmentTargetType;
  userId: string | null;
  cohortId: string | null;
  programId: string | null;
  createdBy: string;
  createdAt: string;
}

export const ASSIGNED_CONTENT_TYPES = ["COURSE", "UNIT", "LESSON"] as const;
export type AssignedContentType = typeof ASSIGNED_CONTENT_TYPES[number];

export interface Assignment {
  id: string;
  organizationId: string;
  cohortId: string | null;
  courseId: string | null;
  lessonId: string | null;
  title: string;
  description: string | null;
  assignmentType: AssignmentType;
  visibilityScope: AssignmentVisibilityScope;
  createdBy: string;
  availableAt: string | null; // ISO 8601, UTC
  dueAt: string;              // ISO 8601, UTC
  closesAt: string | null;    // ISO 8601, UTC
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
  // SHF Lesson + Assignment + Curriculum Phase 3 — immutable curriculum
  // binding (migration 060). Null on every pre-existing assignment and on
  // any new assignment that doesn't reference the canonical catalog.
  // Never updatable after creation (see assignment-service.ts's
  // updateAssignment — no field here is ever accepted on update).
  curriculumReleaseId: string | null;
  assignedContentType: AssignedContentType | null;
  assignedContentId: string | null;
  // SHF Lesson + Assignment + Curriculum Phase 4 — Completion Policy
  // binding (migration 061). Null means this assignment has no
  // institutional completion gating (legacy/demo compatibility). Never
  // updatable after creation — see assignment-service.ts's
  // updateAssignment, which never accepts this field.
  completionPolicyId: string | null;
}

/**
 * Derives a truthful, real-fact-only Calendar status. Deliberately does
 * NOT include "Submitted"/"Completed" — no submission/grading domain
 * exists in this repository to own that truth (see the Wave 2A report's
 * Assignment Ownership Boundaries section). Adding those states here
 * would mean this function silently invents completion — the one thing
 * the build brief explicitly forbids.
 */
export const DUE_STATE_UPCOMING = "upcoming";
export const DUE_STATE_DUE_TODAY = "due_today";
export const DUE_STATE_DUE_SOON = "due_soon";
export const DUE_STATE_OVERDUE = "overdue";

export type DueState =
  | typeof DUE_STATE_UPCOMING
  | typeof DUE_STATE_DUE_TODAY
  | typeof DUE_STATE_DUE_SOON
  | typeof DUE_STATE_OVERDUE;

export function computeDueState(dueAt: string, now: Date = new Date()): DueState {
  const due = new Date(dueAt);
  const dueDayStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  const daysUntilDue = Math.round((dueDayStart.getTime() - todayStart.getTime()) / dayMs);

  if (daysUntilDue < 0) return DUE_STATE_OVERDUE;
  if (daysUntilDue === 0) return DUE_STATE_DUE_TODAY;
  if (daysUntilDue <= 3) return DUE_STATE_DUE_SOON;
  return DUE_STATE_UPCOMING;
}
