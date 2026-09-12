import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { DgalService } from "../service/dgal-service.js";

const service = new DgalService();
const write = requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_REGISTRY_MANAGE);
function actor(req: any) { return req.user; }
function handle(handler: (req: any) => Promise<any>) { return async (req: any, res: any) => { try { return res.json(ok(await handler(req))); } catch (error: any) { return res.status(error.statusCode || 400).json(fail(error.code || error.message, error.message)); } }; }

export function registerDocumentationRegistryRoutes(app: any) {
  app.get("/documentation/registry/overview", write, handle((req) => service.registryOverview(actor(req))));
  app.post("/documentation/registry/document-types", write, handle((req) => service.createDocumentType(actor(req), req.body || {})));
  app.post("/documentation/registry/guidance-items", write, handle((req) => service.createGuidanceItem(actor(req), req.body || {})));
  app.post("/documentation/registry/guidance-collections", write, handle((req) => service.createGuidanceCollection(actor(req), req.body || {})));
  app.post("/documentation/registry/templates", write, handle((req) => service.createTemplate(actor(req), req.body || {})));
  app.post("/documentation/registry/template-versions", write, handle((req) => service.createTemplateVersion(actor(req), req.body || {})));
  app.post("/documentation/registry/requirement-rules", write, handle((req) => service.createRequirementRule(actor(req), req.body || {})));
  app.post("/documentation/registry/template-versions/:id/activate", write, handle((req) => service.activateTemplateVersion(actor(req), req.params.id, new Date(), req.body?.expectedStatus)));
  app.post("/documentation/registry/template-versions/:id/archive", write, handle((req) => service.archiveTemplateVersion(actor(req), req.params.id, req.body?.expectedStatus)));
}
