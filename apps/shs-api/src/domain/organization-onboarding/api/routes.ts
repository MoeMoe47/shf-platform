import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { OrganizationOnboardingError, toOnboardingCaseResponse, toOnboardingDecisionResponse } from "../model/organization-onboarding.js";
import { OrganizationOnboardingService } from "../service/organization-onboarding-service.js";

const service = new OrganizationOnboardingService();

function handleError(error: any, res: any, next: any) {
  if (error instanceof OrganizationOnboardingError) {
    return res.status(error.statusCode).json(fail(error.code, error.message));
  }
  return next(error);
}

export function registerOrganizationOnboardingRoutes(app: any) {
  app.get("/organization-onboarding/cases", requirePermission("organization.onboarding.view"), async (req: any, res: any, next: any) => {
    try {
      const items = await service.listCases(req.user);
      return res.json(ok({ items: items.map(toOnboardingCaseResponse) }));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/organization-onboarding/cases", requirePermission("organization.onboarding.submit"), async (req: any, res: any, next: any) => {
    try {
      const created = await service.submitCase(req.body || {}, req.user);
      return res.status(201).json(ok(toOnboardingCaseResponse(created)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.get("/organization-onboarding/cases/:caseId", requirePermission("organization.onboarding.view"), async (req: any, res: any, next: any) => {
    try {
      const found = await service.getCase(req.params.caseId, req.user);
      if (!found) return res.status(404).json(fail("NOT_FOUND", "Onboarding case not found"));
      return res.json(ok({
        ...toOnboardingCaseResponse(found),
        decisions: (found.decisions || []).map(toOnboardingDecisionResponse),
      }));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/organization-onboarding/cases/:caseId/approve", requirePermission("organization.onboarding.review"), async (req: any, res: any, next: any) => {
    try {
      const updated = await service.approveCase(req.params.caseId, req.body || {}, req.user);
      return res.json(ok(toOnboardingCaseResponse(updated)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/organization-onboarding/cases/:caseId/decline", requirePermission("organization.onboarding.review"), async (req: any, res: any, next: any) => {
    try {
      const updated = await service.declineCase(req.params.caseId, req.body || {}, req.user);
      return res.json(ok(toOnboardingCaseResponse(updated)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/organization-onboarding/cases/:caseId/activate", requirePermission("organization.onboarding.activate"), async (req: any, res: any, next: any) => {
    try {
      const updated = await service.activateCase(req.params.caseId, req.body || {}, req.user);
      return res.json(ok(toOnboardingCaseResponse(updated)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/organization-onboarding/cases/:caseId/suspend", requirePermission("organization.onboarding.suspend"), async (req: any, res: any, next: any) => {
    try {
      const updated = await service.suspendCase(req.params.caseId, req.body || {}, req.user);
      return res.json(ok(toOnboardingCaseResponse(updated)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/organization-onboarding/cases/:caseId/exit", requirePermission("organization.onboarding.exit"), async (req: any, res: any, next: any) => {
    try {
      const updated = await service.exitCase(req.params.caseId, req.body || {}, req.user);
      return res.json(ok(toOnboardingCaseResponse(updated)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });
}
