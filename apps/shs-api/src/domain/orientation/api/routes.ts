import { fail, ok } from "../../../api/response-envelope.js";
import { ContextualGuidanceService } from "../../documentation/service/contextual-guidance-service.js";
import { OrientationContextService, SERVER_ORIENTATION_CATALOG } from "../service/orientation-context-service.js";
import type { OrientationActor, OrientationResolverHints } from "../model/orientation-resolver.js";
import { ExperienceStateService } from "../service/experience-state-service.js";
import type { ExperienceAction } from "../model/experience-state.js";

const resolver = new OrientationContextService(SERVER_ORIENTATION_CATALOG);
const guidance = new ContextualGuidanceService();
const experience = new ExperienceStateService();
function actorFromRequest(req: any): OrientationActor { const organizationId = String(req.user.active_organization_id || req.user.organization_id || ""); return { user_id: String(req.user.user_id || req.user.id || ""), organization_id: organizationId, active_organization_id: organizationId, tenant_id: String(req.user.tenant_id || ""), roles: Array.isArray(req.user.roles) ? req.user.roles : [], permissions: Array.isArray(req.user.permissions) ? req.user.permissions : [], organization_type: req.user.organization_type || null }; }
function experienceScope(req: any) { const actor = actorFromRequest(req); if (!actor.user_id || !actor.organization_id || actor.tenant_id !== `tenant:${actor.organization_id}`) throw new Error("ORG_CONTEXT_REQUIRED"); return { userId: actor.user_id, organizationId: actor.organization_id, tenantId: actor.tenant_id }; }
function boundedHints(query: any): OrientationResolverHints { const level = String(query.experienceLevel || "").toUpperCase(); return { destinationId: String(query.destinationId || "").trim() || undefined, routeId: String(query.routeId || "").trim() || undefined, serviceKey: String(query.serviceKey || "").trim() || undefined, workflowType: String(query.workflowType || "").trim() || undefined, workflowStage: String(query.workflowStage || "").trim() || undefined, resourceType: String(query.resourceType || "").trim() || undefined, resourceId: String(query.resourceId || "").trim() || undefined, requestedHelpTopic: String(query.requestedHelpTopic || "").trim() || undefined, experienceLevel: ["NEW", "EARLY", "EXPERIENCED", "RETURNING"].includes(level) ? level as OrientationResolverHints["experienceLevel"] : undefined, priorOrientationVersion: /^\d+$/.test(String(query.priorOrientationVersion || "")) ? Number(query.priorOrientationVersion) : undefined }; }
export function registerOrientationRoutes(app: any) {
  app.get("/orientation/context", async (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
    try { const actor = actorFromRequest(req); if (!actor.user_id || !actor.organization_id || !actor.tenant_id || actor.tenant_id !== `tenant:${actor.organization_id}`) return res.status(403).json(fail("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.")); const result = await resolver.resolve(actor, boundedHints(req.query || {}), { resolveDgal: (resolvedActor, context) => guidance.compose(resolvedActor as any, context as any) }); if (result.status === "FORBIDDEN") return res.status(403).json(fail("FORBIDDEN", "Orientation is not available for this actor.")); if (result.status === "NOT_FOUND") return res.status(404).json(fail("ORIENTATION_NOT_FOUND", "No active orientation is available for this destination.")); return res.json(ok(result)); } catch (error) { return next(error); }
  });
  app.get("/orientation/experience", async (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
    try {
      const orientationVersion = Number(req.query.orientationVersion);
      if (!Number.isInteger(orientationVersion) || orientationVersion < 1) return res.status(400).json(fail("EXPERIENCE_VERSION_INVALID", "A valid orientation version is required."));
      const state = await experience.get(experienceScope(req), { orientationId: String(req.query.orientationId || ""), orientationVersion, tourId: req.query.tourId ? String(req.query.tourId) : null, tourVersion: req.query.tourVersion ? Number(req.query.tourVersion) : null });
      return res.json(ok({ state }));
    } catch (error: any) { return next(error); }
  });
  app.post("/orientation/experience", async (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
    try {
      const body = req.body || {};
      const scope = experienceScope(req);
      const action = String(body.action || "") as ExperienceAction;
      const allowed = ["OFFER", "START", "PROGRESS", "PAUSE", "RESUME", "SKIP", "DISMISS", "COMPLETE", "RESTART", "WHATS_CHANGED_SEEN"];
      if (!allowed.includes(action)) return res.status(400).json(fail("EXPERIENCE_ACTION_INVALID", "Unsupported orientation experience action."));
      const orientationVersion = Number(body.orientationVersion);
      if (!Number.isInteger(orientationVersion) || orientationVersion < 1) return res.status(400).json(fail("EXPERIENCE_VERSION_INVALID", "A valid orientation version is required."));
      const state = await experience.apply(scope, action, { orientationId: String(body.orientationId || ""), orientationVersion, tourId: body.tourId == null ? null : String(body.tourId), tourVersion: body.tourVersion == null ? null : Number(body.tourVersion), currentStepId: body.currentStepId == null ? null : String(body.currentStepId), lastRoute: body.lastRoute == null ? null : String(body.lastRoute), lastDestinationId: body.lastDestinationId == null ? null : String(body.lastDestinationId) });
      return res.json(ok({ state }));
    } catch (error: any) { return next(error); }
  });
}
