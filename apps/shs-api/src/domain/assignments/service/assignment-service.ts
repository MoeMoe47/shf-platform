// SHF Learning Ecosystem Phase 2 — Assignment service. Reconciles the
// existing Assignment domain with canonical Enrollment/Cohort targeting.
import { randomUUID } from "crypto";
import { withTransaction } from "../../../db/transaction.js";
import { AssignmentRepo } from "../repo/assignment-repo.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { EnrollmentRepo } from "../../enrollments/repo/enrollment-repo.js";
import { EnrollmentService } from "../../enrollments/service/enrollment-service.js";
import { CurriculumCatalogRepo } from "../../curriculum-catalog/repo/curriculum-catalog-repo.js";
import { CompletionPolicyRepo } from "../../completion-policy/repo/completion-policy-repo.js";
import {
  Assignment,
  AssignedContentType,
  AssignmentStatus,
  AssignmentTargetType,
  AssignmentType,
  AssignmentVisibilityScope,
  ASSIGNED_CONTENT_TYPES,
  ASSIGNMENT_TARGET_TYPES,
  ASSIGNMENT_TYPES,
  ASSIGNMENT_VISIBILITY_SCOPES,
} from "../model/assignment.js";

const repo = new AssignmentRepo();
const enrollmentRepo = new EnrollmentRepo();
const enrollmentService = new EnrollmentService(enrollmentRepo);
const catalogRepo = new CurriculumCatalogRepo();
const completionPolicyRepo = new CompletionPolicyRepo();

const ADMIN_TIER_ROLES = ["shf_admin", "shs_admin", "org_admin", "super_admin", "program_manager"];

export interface ActorUser {
  user_id: string;
  organization_id: string;
  roles: string[];
}

export interface CreateAssignmentInput {
  title: string;
  description?: string;
  assignmentType?: AssignmentType;
  cohortId?: string;
  courseId?: string;
  lessonId?: string;
  availableAt?: string;
  dueAt: string;
  closesAt?: string;
  status?: AssignmentStatus;
  visibilityScope: AssignmentVisibilityScope;
  targetUserIds?: string[];
  targets?: AssignmentTargetInput[];
  // Phase 3 — institutional curriculum binding. curriculumReleaseId must
  // reference a PUBLISHED release in the actor's own organization;
  // assignedContentUnitKey/assignedContentLessonKey resolve WITHIN that
  // release's immutable snapshot (see resolveContentWithinRelease below).
  curriculumReleaseId?: string;
  assignedContentType?: AssignedContentType;
  assignedContentUnitKey?: string;
  assignedContentLessonKey?: string;
  // Phase 4 — optional Completion Policy binding. Must be ACTIVE, in the
  // actor's own organization, and bound to the SAME curriculum release as
  // this assignment (a policy authored for a different release cannot be
  // silently reused). Never updatable after creation.
  completionPolicyId?: string;
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string | null;
  availableAt?: string | null;
  dueAt?: string;
  closesAt?: string | null;
  status?: AssignmentStatus;
}

export class CurriculumBindingError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "CurriculumBindingError";
  }
}

// Resolves a requested UNIT/LESSON binding against an immutable release
// SNAPSHOT (never the live, mutable curriculum_units/curriculum_lessons
// tables) — this is what makes the binding release-intrinsic. Returns
// the stored assigned_content_id form ("<unitKey>" or "<unitKey>:
// <lessonKey>") plus a human-readable title for convenience. Throws
// CurriculumBindingError for anything that doesn't resolve.
export function resolveContentWithinRelease(
  snapshot: any,
  contentType: AssignedContentType,
  unitStableKey?: string,
  lessonStableKey?: string,
): { assignedContentId: string | null; title: string } {
  if (contentType === "COURSE") {
    return { assignedContentId: null, title: snapshot?.course?.title || "" };
  }
  const units: any[] = Array.isArray(snapshot?.units) ? snapshot.units : [];
  const unit = units.find((u) => u.stableKey === unitStableKey);
  if (!unit) throw new CurriculumBindingError("UNIT_NOT_IN_RELEASE", `Unit "${unitStableKey}" is not part of this curriculum release.`);
  if (contentType === "UNIT") {
    return { assignedContentId: unit.stableKey, title: unit.title };
  }
  const lessons: any[] = Array.isArray(unit.lessons) ? unit.lessons : [];
  const lesson = lessons.find((l) => l.stableKey === lessonStableKey);
  if (!lesson) throw new CurriculumBindingError("LESSON_NOT_IN_RELEASE", `Lesson "${lessonStableKey}" is not part of unit "${unitStableKey}" in this curriculum release.`);
  return { assignedContentId: `${unit.stableKey}:${lesson.stableKey}`, title: lesson.title };
}

export interface AssignmentTargetInput {
  targetType?: AssignmentTargetType;
  type?: AssignmentTargetType;
  userId?: string;
  learnerUserId?: string;
  cohortId?: string;
  programId?: string;
}

type NormalizedTarget = {
  targetType: AssignmentTargetType;
  userId: string | null;
  cohortId: string | null;
  programId: string | null;
}

export class InvalidTargetUsersError extends Error {
  constructor(public invalidUserIds: string[]) {
    super(`targetUserIds includes user(s) not in the creator's organization: ${invalidUserIds.join(", ")}`);
    this.name = "InvalidTargetUsersError";
  }
}

export class InvalidAssignmentTargetsError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "InvalidAssignmentTargetsError";
  }
}

function isAdminTier(roles: string[]): boolean {
  return roles.some((r) => ADMIN_TIER_ROLES.includes(r));
}

function isStudentOnly(roles: string[]): boolean {
  return roles.includes("student") && !roles.includes("instructor") && !isAdminTier(roles);
}

/**
 * Synchronous shape validation only — targetUserIds' real-user/real-org
 * check requires a DB round trip and happens in createAssignment()
 * itself (see InvalidTargetUsersError). Kept separate on purpose,
 * mirroring live-learning-service.ts's own validate-then-act split.
 */
export function validateCreateInput(body: any): string | null {
  if (!body || typeof body !== "object") return "Request body is required.";
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) return "title is required.";
  if (!body.dueAt || Number.isNaN(Date.parse(body.dueAt))) return "dueAt must be a valid ISO 8601 timestamp.";
  if (body.availableAt != null && Number.isNaN(Date.parse(body.availableAt))) return "availableAt must be a valid ISO 8601 timestamp.";
  if (body.closesAt != null && Number.isNaN(Date.parse(body.closesAt))) return "closesAt must be a valid ISO 8601 timestamp.";
  if (body.assignmentType != null && !ASSIGNMENT_TYPES.includes(body.assignmentType)) {
    return `assignmentType must be one of: ${ASSIGNMENT_TYPES.join(", ")}`;
  }
  for (const idField of ["cohortId", "courseId", "lessonId"]) {
    if (body[idField] != null && typeof body[idField] !== "string") return `${idField} must be a string.`;
  }

  if (body.visibilityScope != null && !ASSIGNMENT_VISIBILITY_SCOPES.includes(body.visibilityScope)) {
    return `visibilityScope must be one of: ${ASSIGNMENT_VISIBILITY_SCOPES.join(", ")}`;
  }
  if (body.targets != null) {
    if (!Array.isArray(body.targets) || body.targets.length === 0) return "targets must be a non-empty array.";
    for (const target of body.targets) {
      if (!target || typeof target !== "object") return "each target must be an object.";
      const type = target.targetType || target.type;
      if (!ASSIGNMENT_TARGET_TYPES.includes(type)) return `targetType must be one of: ${ASSIGNMENT_TARGET_TYPES.join(", ")}`;
    }
  } else if (!body.visibilityScope) {
    return "targets are required; legacy visibilityScope may be supplied for backward compatibility.";
  }
  if (body.visibilityScope === "targeted" && body.targets == null) {
    if (!Array.isArray(body.targetUserIds) || body.targetUserIds.length === 0) {
      return "targetUserIds must be a non-empty array when visibilityScope is 'targeted'.";
    }
    if (!body.targetUserIds.every((id: unknown) => typeof id === "string" && id.trim())) {
      return "targetUserIds must be an array of non-empty strings.";
    }
  }
  if (body.curriculumReleaseId != null || body.assignedContentType != null) {
    if (typeof body.curriculumReleaseId !== "string" || !body.curriculumReleaseId.trim()) {
      return "curriculumReleaseId is required when binding institutional curriculum.";
    }
    if (!ASSIGNED_CONTENT_TYPES.includes(body.assignedContentType)) {
      return `assignedContentType must be one of: ${ASSIGNED_CONTENT_TYPES.join(", ")}`;
    }
    if (body.assignedContentType === "UNIT" && (typeof body.assignedContentUnitKey !== "string" || !body.assignedContentUnitKey.trim())) {
      return "assignedContentUnitKey is required when assignedContentType is UNIT.";
    }
    if (body.assignedContentType === "LESSON" && (typeof body.assignedContentUnitKey !== "string" || !body.assignedContentUnitKey.trim() || typeof body.assignedContentLessonKey !== "string" || !body.assignedContentLessonKey.trim())) {
      return "assignedContentUnitKey and assignedContentLessonKey are required when assignedContentType is LESSON.";
    }
  }
  return null;
}

function targetKey(target: NormalizedTarget) {
  return [target.targetType, target.userId || "", target.cohortId || "", target.programId || ""].join(":");
}

function normalizeTargets(input: CreateAssignmentInput): NormalizedTarget[] {
  const targets: NormalizedTarget[] = [];
  if (Array.isArray(input.targets)) {
    for (const raw of input.targets) {
      const targetType = (raw.targetType || raw.type) as AssignmentTargetType;
      targets.push({
        targetType,
        userId: targetType === "LEARNER" ? String(raw.learnerUserId || raw.userId || "") : null,
        cohortId: targetType === "COHORT" ? String(raw.cohortId || "") : null,
        programId: targetType === "PROGRAM" ? String(raw.programId || "") : null,
      });
    }
  } else if (input.visibilityScope === "organization") {
    targets.push({ targetType: "ORGANIZATION", userId: null, cohortId: null, programId: null });
  } else if (input.visibilityScope === "targeted") {
    for (const userId of input.targetUserIds || []) {
      targets.push({ targetType: "LEARNER", userId, cohortId: null, programId: null });
    }
  }

  const unique = new Map<string, NormalizedTarget>();
  for (const target of targets) unique.set(targetKey(target), target);
  return [...unique.values()];
}

function visibilityForTargets(targets: NormalizedTarget[]): AssignmentVisibilityScope {
  return targets.length === 1 && targets[0].targetType === "ORGANIZATION" ? "organization" : "targeted";
}

async function validateTargets(actor: ActorUser, assignmentProgramId: string | null, targets: NormalizedTarget[]) {
  if (!targets.length) throw new InvalidAssignmentTargetsError("ASSIGNMENT_TARGET_REQUIRED", "At least one explicit assignment target is required.");
  for (const target of targets) {
    if (target.targetType === "LEARNER") {
      if (!target.userId) throw new InvalidAssignmentTargetsError("INVALID_ASSIGNMENT_TARGET", "LEARNER target requires learnerUserId.");
      if (!(await enrollmentRepo.userExistsInOrganization(target.userId, actor.organization_id))) {
        throw new InvalidTargetUsersError([target.userId]);
      }
    } else if (target.targetType === "COHORT") {
      if (!target.cohortId) throw new InvalidAssignmentTargetsError("INVALID_ASSIGNMENT_TARGET", "COHORT target requires cohortId.");
      const cohort = await enrollmentRepo.getCohortById(target.cohortId);
      if (!cohort || cohort.organizationId !== actor.organization_id) {
        throw new InvalidAssignmentTargetsError("COHORT_NOT_FOUND", "Cohort target not found in organization.");
      }
      if (cohort.status !== "ACTIVE") {
        throw new InvalidAssignmentTargetsError("COHORT_INACTIVE", "Cohort targets require an ACTIVE cohort.");
      }
      if (assignmentProgramId && cohort.programId !== assignmentProgramId) {
        throw new InvalidAssignmentTargetsError("COHORT_PROGRAM_MISMATCH", "Assignment programId must match targeted cohort program.");
      }
      if (!isAdminTier(actor.roles) && !(await enrollmentRepo.isActiveCohortStaff(actor.organization_id, target.cohortId, actor.user_id))) {
        throw new InvalidAssignmentTargetsError("COHORT_STAFF_REQUIRED", "Instructor must be active cohort staff to target a cohort.");
      }
    } else if (target.targetType === "PROGRAM") {
      if (!target.programId) throw new InvalidAssignmentTargetsError("INVALID_ASSIGNMENT_TARGET", "PROGRAM target requires programId.");
      if (!(await enrollmentRepo.programExistsInOrganization(target.programId, actor.organization_id))) {
        throw new InvalidAssignmentTargetsError("PROGRAM_NOT_FOUND", "Program target not found in organization.");
      }
      if (assignmentProgramId && target.programId !== assignmentProgramId) {
        throw new InvalidAssignmentTargetsError("ASSIGNMENT_PROGRAM_MISMATCH", "Assignment programId must match targeted programId.");
      }
      if (!isAdminTier(actor.roles)) {
        throw new InvalidAssignmentTargetsError("PROGRAM_MANAGER_REQUIRED", "Program targets require an admin or program manager.");
      }
    } else if (target.targetType === "ORGANIZATION") {
      if (target.userId || target.cohortId || target.programId) {
        throw new InvalidAssignmentTargetsError("INVALID_ASSIGNMENT_TARGET", "ORGANIZATION target cannot include learner, cohort, or program ids.");
      }
    } else {
      throw new InvalidAssignmentTargetsError("INVALID_ASSIGNMENT_TARGET", "Unsupported assignment target type.");
    }
  }
}

async function assignmentCohortProgram(actor: ActorUser, cohortId?: string): Promise<string | null> {
  if (!cohortId) return null;
  const cohort = await enrollmentRepo.getCohortById(cohortId);
  if (!cohort || cohort.organizationId !== actor.organization_id) {
    throw new InvalidAssignmentTargetsError("COHORT_NOT_FOUND", "Assignment cohortId not found in organization.");
  }
  return cohort.programId;
}

// Phase 3 Step 4/18: institutional curriculum may only bind to a
// PUBLISHED release in the actor's own organization, and the requested
// course/unit/lesson must actually resolve inside that release's
// immutable snapshot. Returns the three columns to persist, or null if
// the input didn't request a curriculum binding at all.
async function resolveCurriculumBinding(actor: ActorUser, input: CreateAssignmentInput): Promise<{ curriculumReleaseId: string; assignedContentType: AssignedContentType; assignedContentId: string | null } | null> {
  if (!input.curriculumReleaseId) return null;
  const release = await catalogRepo.findRelease(actor.organization_id, input.curriculumReleaseId);
  if (!release) throw new CurriculumBindingError("RELEASE_NOT_FOUND", "curriculumReleaseId does not exist in your organization.");
  if (release.status !== "PUBLISHED") throw new CurriculumBindingError("RELEASE_NOT_PUBLISHED", "Only a PUBLISHED curriculum release may be institutionally assigned.");
  const contentType = input.assignedContentType as AssignedContentType;
  const resolved = resolveContentWithinRelease(release.snapshot, contentType, input.assignedContentUnitKey, input.assignedContentLessonKey);
  return { curriculumReleaseId: release.releaseId, assignedContentType: contentType, assignedContentId: resolved.assignedContentId };
}

// Phase 4 — validates an optional Completion Policy binding at creation
// time only. A policy authored for a DIFFERENT release, a different
// organization, or that isn't ACTIVE yet can never be attached — this is
// the same "published-only, same-org" discipline already applied to
// curriculumReleaseId itself in resolveCurriculumBinding above.
async function resolveCompletionPolicyBinding(actor: ActorUser, input: CreateAssignmentInput, curriculumReleaseId: string | null): Promise<string | null> {
  if (!input.completionPolicyId) return null;
  const policy = await completionPolicyRepo.findById(actor.organization_id, input.completionPolicyId);
  if (!policy) throw new CurriculumBindingError("POLICY_NOT_FOUND", "completionPolicyId does not exist in your organization.");
  if (policy.status !== "ACTIVE") throw new CurriculumBindingError("POLICY_NOT_ACTIVE", "Only an ACTIVE completion policy may be bound to an assignment.");
  if (policy.curriculumReleaseId !== curriculumReleaseId) throw new CurriculumBindingError("POLICY_RELEASE_MISMATCH", "completionPolicyId must be bound to the same curriculum release as this assignment.");
  return policy.policyId;
}

export async function createAssignment(actor: ActorUser, input: CreateAssignmentInput): Promise<Assignment> {
  const id = `asmt_${randomUUID()}`;
  const targets = normalizeTargets(input);
  const assignmentProgramId = await assignmentCohortProgram(actor, input.cohortId);
  if (input.cohortId) {
    const mismatchedCohortTarget = targets.find((target) => target.targetType === "COHORT" && target.cohortId !== input.cohortId);
    if (mismatchedCohortTarget) {
      throw new InvalidAssignmentTargetsError("ASSIGNMENT_COHORT_MISMATCH", "Assignment cohortId must match COHORT target.");
    }
  }
  await validateTargets(actor, assignmentProgramId, targets);
  const curriculumBinding = await resolveCurriculumBinding(actor, input);
  const completionPolicyId = await resolveCompletionPolicyBinding(actor, input, curriculumBinding?.curriculumReleaseId ?? null);

  const created = await withTransaction(async (client) => {
    const txRepo = new AssignmentRepo(client.query.bind(client));
    const assignment = await txRepo.create({
      id,
      organizationId: actor.organization_id,
      cohortId: input.cohortId ?? null,
      courseId: input.courseId ?? null,
      lessonId: input.lessonId ?? null,
      title: input.title,
      description: input.description ?? null,
      assignmentType: input.assignmentType || "assignment",
      visibilityScope: visibilityForTargets(targets),
      createdBy: actor.user_id,
      availableAt: input.availableAt ?? null,
      dueAt: input.dueAt,
      closesAt: input.closesAt ?? null,
      status: input.status || "published",
      curriculumReleaseId: curriculumBinding?.curriculumReleaseId ?? null,
      assignedContentType: curriculumBinding?.assignedContentType ?? null,
      assignedContentId: curriculumBinding?.assignedContentId ?? null,
      completionPolicyId,
    });
    for (const target of targets) {
      await txRepo.addTarget({
        id: `atgt_${randomUUID()}`,
        assignmentId: id,
        organizationId: actor.organization_id,
        targetType: target.targetType,
        userId: target.userId,
        cohortId: target.cohortId,
        programId: target.programId,
        createdBy: actor.user_id,
      });
    }
    return assignment;
  });

  await writeAuditEvent({
    audit_event_id: `audit_${randomUUID()}`,
    organization_id: actor.organization_id,
    actor_user_id: actor.user_id,
    target_object_type: "assignment",
    target_object_id: id,
    action_type: "assignment.created",
    new_state_json: {
      title: created.title,
      dueAt: created.dueAt,
      status: created.status,
      visibilityScope: created.visibilityScope,
      targetTypes: targets.map((target) => target.targetType),
      targetCount: targets.length,
      curriculumReleaseId: created.curriculumReleaseId,
      assignedContentType: created.assignedContentType,
      assignedContentId: created.assignedContentId,
      completionPolicyId: created.completionPolicyId,
    },
    correlation_id: `corr_${id}`,
    source_channel: "api",
  });

  return created;
}

export class AssignmentNotFoundError extends Error {
  constructor() { super("assignment_not_found"); this.name = "AssignmentNotFoundError"; }
}

// Deliberately narrow (see AssignmentRepo.updateSafeFields's own header):
// title/description/availability/due/closes/status only. There is no
// path here — or anywhere in this file — that changes curriculum_
// release_id/assigned_content_type/assigned_content_id after creation,
// which is what makes content binding immutable-after-activation true.
export async function updateAssignment(actor: ActorUser, id: string, input: UpdateAssignmentInput): Promise<Assignment> {
  const existing = await repo.getById(id);
  if (!existing || existing.organizationId !== actor.organization_id) throw new AssignmentNotFoundError();
  if (input.dueAt != null && Number.isNaN(Date.parse(input.dueAt))) throw new InvalidAssignmentTargetsError("VALIDATION_ERROR", "dueAt must be a valid ISO 8601 timestamp.");
  if (input.status != null && !["draft", "published", "archived"].includes(input.status)) throw new InvalidAssignmentTargetsError("VALIDATION_ERROR", "status must be one of: draft, published, archived.");

  const updated = await repo.updateSafeFields(id, actor.organization_id, input);
  if (!updated) throw new AssignmentNotFoundError();

  await writeAuditEvent({
    audit_event_id: `audit_${randomUUID()}`,
    organization_id: actor.organization_id,
    actor_user_id: actor.user_id,
    target_object_type: "assignment",
    target_object_id: id,
    action_type: "assignment.updated",
    previous_state_json: { title: existing.title, dueAt: existing.dueAt, status: existing.status },
    new_state_json: { title: updated.title, dueAt: updated.dueAt, status: updated.status },
    correlation_id: `corr_${id}_${updated.version}`,
    source_channel: "api",
  });

  return updated;
}

/**
 * Phase 2 — role-aware, entitlement-scoped read. Organization match alone
 * is not sufficient for student assignment visibility.
 *
 * - student-only: organization match AND at least one explicit target
 *   matching the learner, an active Enrollment-derived cohort/program, or
 *   an explicit organization-wide target.
 * - instructor (non-admin): assignments they created plus cohort-targeted
 *   assignments where they are active cohort_staff.
 * - admin-tier (shf_admin/shs_admin/org_admin/super_admin): full
 *   organization scope, matching the existing broader-oversight pattern
 *   already established for Live Learning (SHF_ADMIN gets org-wide
 *   Live Learning management too).
 */
export async function listForUser(actor: ActorUser): Promise<Assignment[]> {
  if (isAdminTier(actor.roles)) {
    return repo.listForOrganization({ organizationId: actor.organization_id, status: "published" });
  }
  if (isStudentOnly(actor.roles)) {
    const active = await enrollmentService.listActiveEnrollmentsForLearner(actor);
    const programIds = Array.from(new Set(active.map((enrollment) => enrollment.programId)));
    const cohortIds = Array.from(new Set(active.map((enrollment) => enrollment.cohortId).filter(Boolean))) as string[];
    return repo.listEntitledForStudent({ organizationId: actor.organization_id, userId: actor.user_id, programIds, cohortIds, status: "published" });
  }
  // Instructor (or any other non-student, non-admin role holding
  // ASSIGNMENT_VIEW): assignments they created plus cohort-targeted
  // assignments for cohorts where they are active cohort_staff.
  return repo.listForInstructor({ organizationId: actor.organization_id, userId: actor.user_id, status: "published" });
}

/**
 * Entitlement-checked direct-id read — the exact boundary a known/
 * guessed assignment_id must never bypass. Does
 * NOT reuse the plain repo.getById() result without an entitlement
 * check layered on top; callers (routes.ts) must use this, not
 * repo.getById() directly, for any role-gated read.
 */
export async function getAssignmentForActor(id: string, actor: ActorUser): Promise<Assignment | null> {
  const assignment = await repo.getById(id);
  if (!assignment) return null;
  if (assignment.organizationId !== actor.organization_id) return null;

  if (isAdminTier(actor.roles)) return assignment;

  if (isStudentOnly(actor.roles)) {
    const active = await enrollmentService.listActiveEnrollmentsForLearner(actor);
    const programIds = Array.from(new Set(active.map((enrollment) => enrollment.programId)));
    const cohortIds = Array.from(new Set(active.map((enrollment) => enrollment.cohortId).filter(Boolean))) as string[];
    const entitled = await repo.hasEntitlementTarget({ assignmentId: id, organizationId: actor.organization_id, userId: actor.user_id, programIds, cohortIds });
    return entitled ? assignment : null;
  }

  if (assignment.createdBy === actor.user_id) return assignment;
  const targets = await repo.listTargets(id);
  for (const target of targets) {
    if (target.targetType === "COHORT" && target.cohortId && await enrollmentRepo.isActiveCohortStaff(actor.organization_id, target.cohortId, actor.user_id)) {
      return assignment;
    }
  }
  return null;
}
