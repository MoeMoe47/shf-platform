// SHF Calendar Wave 2A / 2A.1 — Assignment HTTP routes. Mirrors
// src/domain/live-learning/api/routes.ts's shape and auth pattern.
//
// Phase 3 additions: GET /assignments and GET /assignments/:id now
// include resolved curriculum-release/next-lesson/access-state data
// (assignment-entitlement-service.ts) alongside the raw assignment
// fields already returned. A new GET /assignments/me/next answers "what
// should I do next" across all entitled assignments, and PATCH
// /assignments/:id allows narrow, non-content-binding edits.
import { ok, fail } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/assignment-service.js";
import { validateCreateInput, InvalidAssignmentTargetsError, InvalidTargetUsersError, CurriculumBindingError, AssignmentNotFoundError } from "../service/assignment-service.js";
import * as entitlement from "../service/assignment-entitlement-service.js";
import { evaluateAssignmentCompletion } from "../../completion-policy/service/completion-evaluator.js";
import { CurriculumCompletionService, CompletionPolicyNotSatisfiedError } from "../../curriculum/service/curriculum-completion-service.js";
import { CurriculumCatalogRepo } from "../../curriculum-catalog/repo/curriculum-catalog-repo.js";

const completionService = new CurriculumCompletionService();
const catalogRepo = new CurriculumCatalogRepo();

function actorFromRequest(req: any) {
  return { user_id: req.user.user_id, organization_id: req.user.organization_id, roles: req.user.roles || [] };
}

function serializeWork(work: import("../service/assignment-entitlement-service.js").ResolvedAssignmentWork) {
  return {
    ...work.assignment,
    studioEligible: Boolean(work.studioRequirement),
    projectType: work.studioRequirement?.projectType || null,
    curriculumRelease: work.curriculumRelease,
    assignedContent: work.assignedContent,
    progress: { completed: work.completedCount, total: work.totalCount },
    nextLesson: work.nextLesson,
    accessState: work.accessState,
    dueState: entitlement.computeDueState(work.assignment.dueAt),
  };
}

export function registerAssignmentRoutes(app: any) {
  app.get("/assignments", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const work = await entitlement.listAssignedWork(actorFromRequest(req));
      return res.json(ok({ items: work.map(serializeWork) }));
    } catch (error) {
      return next(error);
    }
  });

  app.get("/assignments/me/next", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const result = await entitlement.resolveNextWork(actorFromRequest(req));
      return res.json(ok({ reason: result.reason, work: result.work ? serializeWork(result.work) : null }));
    } catch (error) {
      return next(error);
    }
  });

  app.get("/assignments/:id", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      // Wave 2A.1: entitlement-checked, not just organization-checked —
      // see getAssignmentForActor()'s own doc for exactly what it
      // verifies for each role tier. A known/guessed id for an
      // assignment this actor isn't entitled to 404s the same as one
      // that doesn't exist at all — never a distinguishable "exists but
      // forbidden" response, which would itself leak information.
      const work = await entitlement.resolveAssignmentWorkForActor(req.params.id, actorFromRequest(req));
      if (!work) return res.status(404).json(fail("NOT_FOUND", "Assignment not found."));
      return res.json(ok(serializeWork(work)));
    } catch (error) {
      return next(error);
    }
  });

  app.post("/assignments", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const validationError = validateCreateInput(req.body);
      if (validationError) return res.status(400).json(fail("VALIDATION_ERROR", validationError));

      const created = await service.createAssignment(actorFromRequest(req), req.body);
      return res.status(201).json(ok(created));
    } catch (error: any) {
      if (error instanceof InvalidTargetUsersError) {
        return res.status(400).json(fail("INVALID_TARGET_USERS", error.message, "corr_dev", { invalidUserIds: error.invalidUserIds }));
      }
      if (error instanceof InvalidAssignmentTargetsError) {
        return res.status(400).json(fail(error.code, error.message));
      }
      if (error instanceof CurriculumBindingError) {
        return res.status(422).json(fail(error.code, error.message));
      }
      return next(error);
    }
  });

  // Step 11/29 — "Check Completion," not "Mark Complete": the browser
  // requests evaluation; the backend decides. req.body may suggest which
  // lesson within a COURSE/UNIT-scoped assignment to check, but never
  // "completed: true" — no such field is ever read.
  app.post("/assignments/:id/check-completion", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const actor = actorFromRequest(req);
      const assignment = await service.getAssignmentForActor(req.params.id, actor);
      if (!assignment) return res.status(404).json(fail("NOT_FOUND", "Assignment not found."));

      let unitStableKey = String(req.body?.unitStableKey || "");
      let lessonStableKey = String(req.body?.lessonStableKey || "");
      if (assignment.assignedContentType === "LESSON" && assignment.assignedContentId) {
        [unitStableKey, lessonStableKey] = assignment.assignedContentId.split(":");
      }
      if (!unitStableKey || !lessonStableKey) {
        return res.status(422).json(fail("LESSON_REQUIRED", "unitStableKey and lessonStableKey are required for a COURSE/UNIT-scoped assignment."));
      }

      const evaluation = await evaluateAssignmentCompletion(actor, req.params.id, unitStableKey, lessonStableKey);
      if (!evaluation.eligible) {
        return res.status(200).json(ok({ complete: false, reason: evaluation.reason, requirements: evaluation.requirements }));
      }

      // Eligible — persist through the same gated write path used by the
      // legacy lesson-complete route, so idempotency/outbox behavior is
      // identical regardless of which route triggered it.
      const release = evaluation.curriculumReleaseId ? await catalogRepo.findRelease(actor.organization_id, evaluation.curriculumReleaseId) : null;
      const curriculumId = (release?.snapshot as any)?.course?.stableKey;
      if (!curriculumId) return res.status(500).json(fail("RELEASE_UNRESOLVED", "Could not resolve the bound curriculum release."));

      try {
        const result = await completionService.complete({ lessonId: lessonStableKey, curriculumId, actor: req.user });
        return res.status(200).json(ok({ complete: true, reason: evaluation.reason, requirements: evaluation.requirements, completion: result.completion }));
      } catch (error: any) {
        if (error instanceof CompletionPolicyNotSatisfiedError) {
          return res.status(200).json(ok({ complete: false, reason: error.evaluation.reason, requirements: error.evaluation.requirements }));
        }
        throw error;
      }
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/assignments/:id", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const { curriculumReleaseId, assignedContentType, assignedContentUnitKey, assignedContentLessonKey, courseId, lessonId, completionPolicyId, ...safeFields } = req.body || {};
      const updated = await service.updateAssignment(actorFromRequest(req), req.params.id, safeFields);
      return res.json(ok(updated));
    } catch (error: any) {
      if (error instanceof AssignmentNotFoundError) return res.status(404).json(fail("NOT_FOUND", "Assignment not found."));
      if (error instanceof InvalidAssignmentTargetsError) return res.status(422).json(fail(error.code, error.message));
      return next(error);
    }
  });
}
