import { fail, ok } from "../../../api/response-envelope.js";
import * as service from "../service/accessibility-content-service.js";

function errorResponse(res: any, error: any) {
  const status = Number(error?.statusCode) || 500;
  return res.status(status).json(fail(error?.code || "ACCESSIBILITY_CONTENT_FAILED", error?.message || "Accessibility representation unavailable."));
}

export function registerAccessibilityContentRoutes(app: any) {
  app.get("/accessibility/content/representations", async (req: any, res: any) => {
    try { return res.json(ok({ items: await service.listRepresentations(req.user || null, req.query || {}) })); } catch (error) { return errorResponse(res, error); }
  });
  app.post("/accessibility/content/representations", async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.requestRepresentation(req.user || null, req.body || {}))); } catch (error) { return errorResponse(res, error); }
  });
  app.get("/accessibility/content/representations/:representationId", async (req: any, res: any) => {
    try { return res.json(ok(await service.getRepresentation(req.user || null, req.params.representationId))); } catch (error) { return errorResponse(res, error); }
  });
  app.get("/accessibility/content/representations/:representationId/content", async (req: any, res: any) => {
    try { const result = await service.readRepresentation(req.user || null, req.params.representationId); res.type(result.item.mimeType); return res.send(result.bytes); } catch (error) { return errorResponse(res, error); }
  });
}
