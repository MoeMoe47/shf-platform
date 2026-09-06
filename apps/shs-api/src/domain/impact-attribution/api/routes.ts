import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { ImpactAttributionError, ImpactAttributionService } from "../service/impact-attribution-service.js";
import { toImpactAttributionResponse } from "../model/impact-attribution.js";

const service = new ImpactAttributionService();

function handleError(error: any, res: any, next: any) {
  if (error instanceof ImpactAttributionError) {
    return res.status(error.statusCode).json(fail(error.code, error.message));
  }
  return next(error);
}

export function registerImpactAttributionRoutes(app: any) {
  app.get("/impact/attribution", requirePermission("impact.aggregate.view"), async (req: any, res: any, next: any) => {
    try {
      const result = await service.getAttribution(req.query || {}, req.user);
      return res.json(ok(toImpactAttributionResponse(result)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });
}
