// SHF Lesson + Assignment + Curriculum Ingestion — Phase 2.
//
// Every route is staff-only (no learner-facing read exists this phase —
// see Step 24's "no assignment linkage yet"). Actor organization always
// comes from the authenticated session's active organization context,
// never a client-supplied field — mirrors every other org-scoped domain
// in this codebase (source-ingestion, assignments, enrollments).
import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { requireOrganizationServiceEntitlement } from "../../../auth/service-entitlement-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/curriculum-catalog-service.js";
import {
  CatalogValidationError,
  StaleRevisionError,
  NotFoundError,
  InvalidTransitionError,
  NotEditableError,
} from "../service/curriculum-catalog-service.js";
import { listImportableCurricula, importStaticCurriculum } from "../service/curriculum-import-service.js";

function actorFromRequest(req: any): service.CatalogActor {
  return { userId: String(req.user.user_id), organizationId: String(req.user.active_organization_id || req.user.organization_id) };
}

function parseRevision(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : NaN;
}

function handleError(error: unknown, res: any, next: any) {
  if (error instanceof CatalogValidationError) return res.status(422).json(fail("INVALID_REQUEST", error.message, "corr_curriculum_catalog_invalid", { issues: error.issues }));
  if (error instanceof StaleRevisionError) return res.status(409).json(fail("STALE_REVISION", "This record was changed elsewhere. Reload and try again.", "corr_curriculum_catalog_stale"));
  if (error instanceof NotFoundError) return res.status(404).json(fail("NOT_FOUND", error.message, "corr_curriculum_catalog_not_found"));
  if (error instanceof InvalidTransitionError) return res.status(409).json(fail("INVALID_TRANSITION", error.message, "corr_curriculum_catalog_transition"));
  if (error instanceof NotEditableError) return res.status(409).json(fail("NOT_EDITABLE", error.message, "corr_curriculum_catalog_not_editable"));
  return next(error);
}

export function registerCurriculumCatalogRoutes(app: any) {
  app.use("/curriculum/catalog", requireOrganizationServiceEntitlement("curriculum"));
  const manage = requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_MANAGE);
  const approvePermission = requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_APPROVE);
  const publishPermission = requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_PUBLISH);
  const retirePermission = requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_RETIRE);

  // ---------------- Course ----------------
  app.post("/curriculum/catalog/courses", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.createCourse(actorFromRequest(req), req.body || {}))); } catch (e) { handleError(e, res, next); }
  });
  app.get("/curriculum/catalog/courses", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.listCourses(actorFromRequest(req)))); } catch (e) { handleError(e, res, next); }
  });
  app.get("/curriculum/catalog/courses/:courseId", manage, async (req: any, res: any, next: any) => {
    try {
      const actor = actorFromRequest(req);
      const course = await service.getCourse(actor, req.params.courseId);
      const units = await service.listUnits(actor, req.params.courseId);
      const unitsWithLessons = await Promise.all(units.map(async (u) => ({ ...u, lessons: await service.listLessons(actor, u.unitId) })));
      res.json(ok({ course, units: unitsWithLessons }));
    } catch (e) { handleError(e, res, next); }
  });
  app.patch("/curriculum/catalog/courses/:courseId", manage, async (req: any, res: any, next: any) => {
    try {
      const { revision, ...fields } = req.body || {};
      res.json(ok(await service.updateCourse(actorFromRequest(req), req.params.courseId, parseRevision(revision), fields)));
    } catch (e) { handleError(e, res, next); }
  });

  app.post("/curriculum/catalog/courses/:courseId/submit-review", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.submitForReview(actorFromRequest(req), req.params.courseId, parseRevision(req.body?.revision)))); } catch (e) { handleError(e, res, next); }
  });
  app.post("/curriculum/catalog/courses/:courseId/approve", approvePermission, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.approveCourse(actorFromRequest(req), req.params.courseId, parseRevision(req.body?.revision)))); } catch (e) { handleError(e, res, next); }
  });
  app.post("/curriculum/catalog/courses/:courseId/reopen", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.reopenCourse(actorFromRequest(req), req.params.courseId, parseRevision(req.body?.revision)))); } catch (e) { handleError(e, res, next); }
  });
  app.post("/curriculum/catalog/courses/:courseId/publish", publishPermission, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.publishCourse(actorFromRequest(req), req.params.courseId, parseRevision(req.body?.revision)))); } catch (e) { handleError(e, res, next); }
  });
  app.post("/curriculum/catalog/courses/:courseId/retire", retirePermission, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.retireCourse(actorFromRequest(req), req.params.courseId, parseRevision(req.body?.revision)))); } catch (e) { handleError(e, res, next); }
  });

  // ---------------- Releases ----------------
  app.get("/curriculum/catalog/courses/:courseId/releases", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.listReleases(actorFromRequest(req), req.params.courseId))); } catch (e) { handleError(e, res, next); }
  });
  app.get("/curriculum/catalog/releases/:releaseId", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.getRelease(actorFromRequest(req), req.params.releaseId))); } catch (e) { handleError(e, res, next); }
  });
  app.post("/curriculum/catalog/courses/:courseId/releases/:releaseId/retire", retirePermission, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.retireRelease(actorFromRequest(req), req.params.courseId, req.params.releaseId))); } catch (e) { handleError(e, res, next); }
  });

  // ---------------- Units ----------------
  app.post("/curriculum/catalog/courses/:courseId/units", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.createUnit(actorFromRequest(req), req.params.courseId, req.body || {}))); } catch (e) { handleError(e, res, next); }
  });
  app.patch("/curriculum/catalog/units/:unitId", manage, async (req: any, res: any, next: any) => {
    try {
      const { revision, ...fields } = req.body || {};
      res.json(ok(await service.updateUnit(actorFromRequest(req), req.params.unitId, parseRevision(revision), fields)));
    } catch (e) { handleError(e, res, next); }
  });
  app.patch("/curriculum/catalog/courses/:courseId/units/reorder", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.reorderUnits(actorFromRequest(req), req.params.courseId, req.body?.order || []))); } catch (e) { handleError(e, res, next); }
  });

  // ---------------- Lessons ----------------
  app.post("/curriculum/catalog/units/:unitId/lessons", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.createLesson(actorFromRequest(req), req.params.unitId, req.body || {}))); } catch (e) { handleError(e, res, next); }
  });
  app.patch("/curriculum/catalog/lessons/:lessonId", manage, async (req: any, res: any, next: any) => {
    try {
      const { revision, ...fields } = req.body || {};
      res.json(ok(await service.updateLesson(actorFromRequest(req), req.params.lessonId, parseRevision(revision), fields)));
    } catch (e) { handleError(e, res, next); }
  });
  app.patch("/curriculum/catalog/units/:unitId/lessons/reorder", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.reorderLessons(actorFromRequest(req), req.params.unitId, req.body?.order || []))); } catch (e) { handleError(e, res, next); }
  });

  // ---------------- Resources ----------------
  app.post("/curriculum/catalog/resources", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.createResource(actorFromRequest(req), req.body || {}))); } catch (e) { handleError(e, res, next); }
  });
  app.get("/curriculum/catalog/resources", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.listResources(actorFromRequest(req)))); } catch (e) { handleError(e, res, next); }
  });
  app.post("/curriculum/catalog/lessons/:lessonId/resources/:resourceId", manage, async (req: any, res: any, next: any) => {
    try { await service.attachResource(actorFromRequest(req), req.params.lessonId, req.params.resourceId); res.json(ok({ attached: true })); } catch (e) { handleError(e, res, next); }
  });
  app.delete("/curriculum/catalog/lessons/:lessonId/resources/:resourceId", manage, async (req: any, res: any, next: any) => {
    try { await service.detachResource(actorFromRequest(req), req.params.lessonId, req.params.resourceId); res.json(ok({ detached: true })); } catch (e) { handleError(e, res, next); }
  });

  // ---------------- Static content import (dry-run by default) ----------------
  app.get("/curriculum/catalog/import/static", manage, async (_req: any, res: any) => {
    res.json(ok({ curricula: listImportableCurricula() }));
  });
  app.post("/curriculum/catalog/import/static/:curriculumId", manage, async (req: any, res: any, next: any) => {
    try {
      const dryRun = req.body?.dryRun !== false;
      res.json(ok(await importStaticCurriculum(actorFromRequest(req), req.params.curriculumId, { dryRun })));
    } catch (e: any) {
      if (e instanceof Error && /already exists|no static content folder|not found/.test(e.message)) {
        return res.status(422).json(fail("IMPORT_INVALID", e.message, "corr_curriculum_import_invalid"));
      }
      return next(e);
    }
  });
}
