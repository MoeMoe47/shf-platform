import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { FundingGrantError, toGrantResponse } from "../model/funding-grant.js";
import { FundingGrantService } from "../service/funding-grant-service.js";

const service = new FundingGrantService();

function handleError(error: any, res: any, next: any) {
  if (error instanceof FundingGrantError) {
    return res.status(error.statusCode).json(fail(error.code, error.message));
  }
  if (String(error?.message || "").includes("duplicate key")) {
    return res.status(409).json(fail("DUPLICATE_ALLOCATION", "This grant already has an allocation for that program."));
  }
  return next(error);
}

export function registerFundingGrantRoutes(app: any) {
  app.get("/funding/grants", requirePermission("funding.grant.view"), async (req: any, res: any, next: any) => {
    try {
      const items = await service.listGrants(req.user);
      return res.json(ok({ items: items.map(toGrantResponse) }));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.get("/funding/grants/:grantId", requirePermission("funding.grant.view"), async (req: any, res: any, next: any) => {
    try {
      const grant = await service.getGrant(req.params.grantId, req.user);
      if (!grant) return res.status(404).json(fail("NOT_FOUND", "Grant not found"));
      return res.json(ok(toGrantResponse(grant)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/funding/grants", requirePermission("funding.grant.manage"), async (req: any, res: any, next: any) => {
    try {
      const grant = await service.createGrant(req.body || {}, req.user);
      return res.status(201).json(ok(toGrantResponse(grant)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.patch("/funding/grants/:grantId/status", requirePermission("funding.grant.manage"), async (req: any, res: any, next: any) => {
    try {
      const grant = await service.transitionGrant(req.params.grantId, req.body || {}, req.user);
      return res.json(ok(toGrantResponse(grant)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/funding/grants/:grantId/allocations", requirePermission("funding.grant.manage"), async (req: any, res: any, next: any) => {
    try {
      const grant = await service.createAllocation(req.params.grantId, req.body || {}, req.user);
      return res.status(201).json(ok(toGrantResponse(grant)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/funding/grants/:grantId/authorize-use", requirePermission("funding.grant.view"), async (req: any, res: any, next: any) => {
    try {
      const result = await service.authorizeFundedUse({ ...(req.body || {}), grantId: req.params.grantId }, req.user);
      return res.json(ok(result));
    } catch (error) {
      return handleError(error, res, next);
    }
  });
}
