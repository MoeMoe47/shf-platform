import { fail, ok } from "../../../api/response-envelope.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { providerSelfService } from "../../government-assurance/service/provider-self-service-service.js";
import { ContextualGuidanceService, civicSureProviderSources } from "../service/contextual-guidance-service.js";

const guidanceService = new ContextualGuidanceService();

function actorFromRequest(req: any) {
  const organizationId = req.user.active_organization_id || req.user.organization_id;
  return { user_id: req.user.user_id, organization_id: organizationId, active_organization_id: organizationId, tenant_id: req.user.tenant_id, roles: req.user.roles || [], permissions: req.user.permissions || [] };
}

function requireGuidanceRead(req: any, res: any, next: any) {
  const user = req.user;
  if (!user) return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
  const permissions = user.permissions || [];
  const allowed = ["enrollment.view", SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_PROVIDER_SELF_SERVICE_VIEW].some((permission) => permissions.includes(permission));
  if (!allowed) return res.status(403).json(fail("FORBIDDEN", "Guidance context permission is required."));
  return next();
}

export function registerDocumentationRoutes(app: any) {
  app.get("/documentation/context/me", requireGuidanceRead, async (req: any, res: any, next: any) => {
    try {
      const actor = actorFromRequest(req);
      const serviceKey = String(req.query?.serviceKey || "").trim() || undefined;
      const context = { serviceKey, workflowType: String(req.query?.workflowType || "").trim() || undefined, workflowStage: String(req.query?.workflowStage || "").trim() || undefined, resourceType: String(req.query?.resourceType || "").trim() || undefined, resourceId: String(req.query?.resourceId || "").trim() || undefined, returnTarget: { route: "/index.html#/civicsure/provider" } };
      if (serviceKey === "civicsure" && actor.permissions?.includes(SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_PROVIDER_SELF_SERVICE_VIEW)) {
        const workspace = await providerSelfService.workspace(actor);
        return res.json(ok(await guidanceService.compose(actor, context, civicSureProviderSources(workspace))));
      }
      return res.json(ok(await guidanceService.compose(actor, context)));
    } catch (error: any) {
      if (error?.message === "GPA_PROVIDER_PERMISSION_REQUIRED") return res.status(403).json(fail("FORBIDDEN", "Provider guidance is not available for this actor."));
      return next(error);
    }
  });
}
