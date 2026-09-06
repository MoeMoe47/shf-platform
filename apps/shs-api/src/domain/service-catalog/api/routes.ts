import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { ServiceCatalogService, ServiceEntitlementError } from "../service/service-catalog-service.js";
import { toEntitlementResponse, toServiceCatalogResponse } from "../model/service-catalog.js";

const service = new ServiceCatalogService();

function handleError(error: any, res: any, next: any) {
  if (error instanceof ServiceEntitlementError) {
    return res.status(error.statusCode).json(fail(error.code, error.message));
  }
  return next(error);
}

export function registerServiceCatalogRoutes(app: any) {
  app.get("/service-catalog", requirePermission("organization.service_entitlement.view"), async (req: any, res: any, next: any) => {
    try {
      const includeInactive = req.query?.include_inactive === "1" || req.query?.includeInactive === "true";
      const items = await service.listServices(req.user, includeInactive);
      return res.json(ok({ items: items.map(toServiceCatalogResponse) }));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.get("/organizations/:organizationId/service-entitlements", requirePermission("organization.service_entitlement.view"), async (req: any, res: any, next: any) => {
    try {
      const items = await service.listEntitlements(req.params.organizationId, req.user);
      return res.json(ok({ items: items.map(toEntitlementResponse) }));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/organizations/:organizationId/service-entitlements", requirePermission("organization.service_entitlement.manage"), async (req: any, res: any, next: any) => {
    try {
      const result = await service.grantEntitlement(req.params.organizationId, req.body || {}, req.user);
      return res.status(result.replayed ? 200 : 201).json(ok(toEntitlementResponse(result.entitlement)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.patch("/organizations/:organizationId/service-entitlements/:entitlementId", requirePermission("organization.service_entitlement.manage"), async (req: any, res: any, next: any) => {
    try {
      const result = await service.transitionEntitlement(req.params.organizationId, req.params.entitlementId, req.body || {}, req.user);
      if (!result) return res.status(404).json(fail("NOT_FOUND", "Entitlement not found"));
      return res.json(ok(toEntitlementResponse(result.entitlement)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });
}
