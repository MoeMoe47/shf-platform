import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/opportunity-service.js";
import { OpportunityDomainError, OpportunityNotFoundError } from "../service/opportunity-service.js";
import { isStudentOnly } from "../../shared/audience-eligibility.js";
import { toStudentFacingOpportunity } from "../model/opportunity.js";

function actorFromRequest(req: any) {
  return { user_id: req.user.user_id, organization_id: req.user.organization_id, roles: req.user.roles || [] };
}

function sendDomainError(error: any, res: any, next: any) {
  if (error instanceof OpportunityDomainError) return res.status(error.statusCode).json(fail(error.code, error.message));
  if (error instanceof OpportunityNotFoundError) return res.status(404).json(fail("NOT_FOUND", error.message));
  return next(error);
}

export function registerOpportunityRoutes(app: any) {
  app.get("/public/career/opportunities", async (_req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listPublicOpportunities() })); } catch (error) { return next(error); }
  });

  app.get("/public/career/opportunities/:id", async (req: any, res: any, next: any) => {
    try {
      const item = await service.getPublicOpportunity(req.params.id);
      if (!item) return res.status(404).json(fail("NOT_FOUND", "Opportunity not found."));
      return res.json(ok(item));
    } catch (error) { return next(error); }
  });

  app.get("/public/career/employers", async (_req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listPublicEmployers() })); } catch (error) { return next(error); }
  });

  app.get("/public/career/employers/:id", async (req: any, res: any, next: any) => {
    try {
      const item = await service.getPublicEmployer(req.params.id);
      if (!item) return res.status(404).json(fail("NOT_FOUND", "Organization not found."));
      return res.json(ok(item));
    } catch (error) { return next(error); }
  });

  app.get("/opportunities", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_VIEW), async (req: any, res: any, next: any) => {
    try {
      const actor = actorFromRequest(req);
      const items = await service.listOpportunitiesForActor(actor);
      const shaped = isStudentOnly(actor.roles) ? items.map(toStudentFacingOpportunity) : items;
      return res.json(ok({ items: shaped }));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.get("/opportunities/:id", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_VIEW), async (req: any, res: any, next: any) => {
    try {
      const actor = actorFromRequest(req);
      const opportunity = await service.getOpportunityForActor(req.params.id, actor);
      if (!opportunity) return res.status(404).json(fail("NOT_FOUND", "Opportunity not found."));
      return res.json(ok(isStudentOnly(actor.roles) ? toStudentFacingOpportunity(opportunity) : opportunity));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.post("/opportunities", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const created = await service.createOpportunity(actorFromRequest(req), req.body || {});
      return res.status(201).json(ok(created));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.patch("/opportunities/:id/status", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const updated = await service.transitionOpportunityStatus(req.params.id, actorFromRequest(req), String(req.body?.status || ""));
      return res.json(ok(updated));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.patch("/opportunities/:id/public-visibility", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const updated = await service.setOpportunityPublicVisibility(req.params.id, actorFromRequest(req), String(req.body?.visibility || ""));
      return res.json(ok(updated));
    } catch (error) { return sendDomainError(error, res, next); }
  });
}
