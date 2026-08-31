import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { EnrollmentService, LearningDomainError } from "../service/enrollment-service.js";

const service = new EnrollmentService();

function actorFromRequest(req: any) {
  return {
    user_id: req.user.user_id,
    organization_id: req.user.organization_id,
    active_organization_id: req.user.active_organization_id,
    tenant_id: req.user.tenant_id,
    roles: req.user.roles || [],
    permissions: req.user.permissions || [],
  };
}

function sendDomainError(error: any, res: any, next: any) {
  if (error instanceof LearningDomainError) {
    return res.status(error.statusCode).json(fail(error.code, error.message));
  }
  return next(error);
}

export function registerEnrollmentRoutes(app: any) {
  app.get("/enrollments/me", requirePermission(SHS_SECURITY_PERMISSIONS.ENROLLMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      return res.json(ok({ items: await service.listMyEnrollments(actorFromRequest(req)) }));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.get("/enrollments/:id", requirePermission(SHS_SECURITY_PERMISSIONS.ENROLLMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const enrollment = await service.getEnrollment(actorFromRequest(req), req.params.id);
      if (!enrollment) return res.status(404).json(fail("NOT_FOUND", "Enrollment not found."));
      return res.json(ok(enrollment));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.post("/enrollments", requirePermission(SHS_SECURITY_PERMISSIONS.ENROLLMENT_MANAGE), async (req: any, res: any, next: any) => {
    try {
      return res.status(201).json(ok(await service.createEnrollment(actorFromRequest(req), req.body || {})));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.patch("/enrollments/:id/status", requirePermission(SHS_SECURITY_PERMISSIONS.ENROLLMENT_MANAGE), async (req: any, res: any, next: any) => {
    try {
      return res.json(ok(await service.transitionEnrollment(actorFromRequest(req), req.params.id, String(req.body?.status || ""))));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.patch("/enrollments/:id/cohort", requirePermission(SHS_SECURITY_PERMISSIONS.ENROLLMENT_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const cohortId = req.body?.cohortId ?? req.body?.cohort_id ?? null;
      return res.json(ok(await service.assignEnrollmentCohort(actorFromRequest(req), req.params.id, cohortId)));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.post("/cohorts", requirePermission(SHS_SECURITY_PERMISSIONS.COHORT_MANAGE), async (req: any, res: any, next: any) => {
    try {
      return res.status(201).json(ok(await service.createCohort(actorFromRequest(req), req.body || {})));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.get("/cohorts/:id", requirePermission(SHS_SECURITY_PERMISSIONS.COHORT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const cohort = await service.getCohort(actorFromRequest(req), req.params.id);
      if (!cohort) return res.status(404).json(fail("NOT_FOUND", "Cohort not found."));
      return res.json(ok(cohort));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.patch("/cohorts/:id", requirePermission(SHS_SECURITY_PERMISSIONS.COHORT_MANAGE), async (req: any, res: any, next: any) => {
    try {
      return res.json(ok(await service.updateCohort(actorFromRequest(req), req.params.id, req.body || {})));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.post("/cohorts/:id/staff", requirePermission(SHS_SECURITY_PERMISSIONS.COHORT_MANAGE), async (req: any, res: any, next: any) => {
    try {
      return res.status(201).json(ok(await service.addCohortStaff(actorFromRequest(req), req.params.id, req.body || {})));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.get("/cohorts/:id/roster", requirePermission(SHS_SECURITY_PERMISSIONS.ENROLLMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      return res.json(ok({ items: await service.listRoster(actorFromRequest(req), req.params.id) }));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });
}
