// SHF Lesson + Assignment + Curriculum — Phase 4.5A.
//
// All routes reuse curriculum.catalog.manage (Step 14) — the same
// permission already gating the old static importer route and every
// other curriculum-authoring write in this domain. No new permission was
// introduced: import creates DRAFT catalog content exactly like manual
// authoring does, and every role holding CURRICULUM_CATALOG_MANAGE today
// is staff-only (org_admin/SHF admin/partner org admin) — no student role
// has ever been granted it, so students can never import curriculum.
//
// Actor organization always comes from the authenticated session's
// active organization context, never a client-supplied field — same
// discipline as api/routes.ts's actorFromRequest.
import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as importService from "../service/curriculum-import-job-service.js";
import {
  ImportValidationError,
  ImportNotFoundError,
  ImportInvalidTransitionError,
  ImportStaleRevisionError,
  ImportExecutionError,
} from "../service/curriculum-import-job-service.js";
import type { CatalogActor } from "../service/curriculum-catalog-service.js";

function actorFromRequest(req: any): CatalogActor {
  return { userId: String(req.user.user_id), organizationId: String(req.user.active_organization_id || req.user.organization_id) };
}

function handleError(error: unknown, res: any, next: any) {
  if (error instanceof ImportValidationError) return res.status(422).json(fail("INVALID_REQUEST", error.message, "corr_curriculum_import_invalid", { issues: error.issues }));
  if (error instanceof ImportNotFoundError) return res.status(404).json(fail("NOT_FOUND", error.message, "corr_curriculum_import_not_found"));
  if (error instanceof ImportInvalidTransitionError) return res.status(409).json(fail("INVALID_TRANSITION", error.message, "corr_curriculum_import_transition"));
  if (error instanceof ImportStaleRevisionError) return res.status(409).json(fail("STALE_REVISION", "This import job was changed elsewhere. Reload and try again.", "corr_curriculum_import_stale"));
  if (error instanceof ImportExecutionError) return res.status(422).json(fail("IMPORT_EXECUTION_FAILED", error.message, "corr_curriculum_import_execution_failed"));
  return next(error);
}

export function registerCurriculumImportJobRoutes(app: any) {
  const manage = requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_MANAGE);

  // List the structured source keys (*-student folders) available to
  // import — read-only, same listing the old static importer's own
  // GET /curriculum/catalog/import/static already exposes.
  app.get("/curriculum/import-jobs/sources", manage, async (_req: any, res: any) => {
    res.json(ok({ sourceKeys: importService.listImportableCurricula() }));
  });

  // Create a job: generates candidates and validates them synchronously
  // (Step 12) — no catalog row is written by this call.
  app.post("/curriculum/import-jobs", manage, async (req: any, res: any, next: any) => {
    try {
      const { job, candidates } = await importService.createImportJob(actorFromRequest(req), req.body || {});
      res.json(ok({ job, candidates }));
    } catch (e) { handleError(e, res, next); }
  });

  app.get("/curriculum/import-jobs", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await importService.listImportJobs(actorFromRequest(req)))); } catch (e) { handleError(e, res, next); }
  });

  app.get("/curriculum/import-jobs/:jobId", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await importService.getImportJob(actorFromRequest(req), req.params.jobId))); } catch (e) { handleError(e, res, next); }
  });

  // Backend preview/dry-run contract (Steps 11-12, 16): candidate tree +
  // warnings/errors + source provenance. Never writes a catalog row.
  app.get("/curriculum/import-jobs/:jobId/preview", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await importService.previewImportJob(actorFromRequest(req), req.params.jobId))); } catch (e) { handleError(e, res, next); }
  });

  // Transaction-safe execution (Steps 9-10, 13, 17): requires READY (or
  // FAILED, for retry); idempotent on an already-COMPLETED job.
  app.post("/curriculum/import-jobs/:jobId/execute", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await importService.executeImportJob(actorFromRequest(req), req.params.jobId))); } catch (e) { handleError(e, res, next); }
  });

  app.post("/curriculum/import-jobs/:jobId/cancel", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await importService.cancelImportJob(actorFromRequest(req), req.params.jobId))); } catch (e) { handleError(e, res, next); }
  });

  // Phase 4.6 (Step 40): the smallest safe candidate-edit contract —
  // title, sequence, inclusion only.
  app.patch("/curriculum/import-jobs/:jobId/candidates/:candidateId", manage, async (req: any, res: any, next: any) => {
    try {
      const { title, sequence, included } = req.body || {};
      res.json(ok(await importService.updateCandidate(actorFromRequest(req), req.params.jobId, req.params.candidateId, { title, sequence, included })));
    } catch (e) { handleError(e, res, next); }
  });
}
