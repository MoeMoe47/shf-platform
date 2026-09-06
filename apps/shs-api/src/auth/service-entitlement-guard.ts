import { fail } from "../api/response-envelope.js";
import { ServiceCatalogService } from "../domain/service-catalog/service/service-catalog-service.js";

const serviceCatalogService = new ServiceCatalogService();

export function requireOrganizationServiceEntitlement(serviceKey: string) {
  return async (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
    }
    const organizationId = String(user.active_organization_id || user.organization_id || "").trim();
    if (!organizationId) {
      return res.status(403).json(fail("ORG_CONTEXT_REQUIRED", "Valid active organization context is required."));
    }
    try {
      const result = await serviceCatalogService.evaluateOrganizationServiceEntitlement({ organizationId, serviceKey });
      if (!result.allowed) {
        return res.status(403).json(fail("SERVICE_ENTITLEMENT_REQUIRED", "This organization is not enabled for this service.", "corr_service_entitlement_required", { reason: result.result }));
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
