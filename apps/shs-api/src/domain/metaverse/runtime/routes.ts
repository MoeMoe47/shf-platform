import { fail, ok } from "../../../api/response-envelope.js";
import { MetaverseEntryService, statusForMetaverseError } from "./metaverse-entry-service.js";

const service = new MetaverseEntryService();

function resourceFromBody(body: any) {
  return body?.resource || body || {};
}

function eventName(body: any) {
  const value = String(body?.event || body?.event_name || "").trim();
  if (["view", "enter", "activity_start", "activity_exit", "next_action"].includes(value)) return value as any;
  return "view";
}

function sendMetaverseError(error: any, res: any, next: any) {
  const status = statusForMetaverseError(error);
  if (status >= 500) return next(error);
  const message = error?.message || "Metaverse entry denied.";
  return res.status(status).json(fail(error?.code || "METAVERSE_ENTRY_DENIED", message));
}

export function registerMetaverseRuntimeRoutes(app: any) {
  app.post("/metaverse/entry", async (req: any, res: any, next: any) => {
    try {
      const result = await service.decide({
        user: req.user,
        resource: resourceFromBody(req.body),
        clientBody: req.body || {},
        cameraContext: req.body?.camera_context || req.body?.cameraContext || null,
        emitEvent: true,
        eventName: eventName(req.body),
      });
      return res.status(result.can_enter ? 200 : 403).json(ok(result));
    } catch (error) {
      return sendMetaverseError(error, res, next);
    }
  });

  app.get("/metaverse/entry/:scope/:resourceId", async (req: any, res: any, next: any) => {
    try {
      const result = await service.decide({
        user: req.user,
        resource: {
          scope: req.params.scope,
          resource_id: req.params.resourceId,
          city_id: req.query.city_id,
          district_id: req.query.district_id,
          facility_id: req.query.facility_id,
          activity_id: req.query.activity_id,
        },
        emitEvent: true,
        eventName: "view",
      });
      return res.status(result.can_enter ? 200 : 403).json(ok(result));
    } catch (error) {
      return sendMetaverseError(error, res, next);
    }
  });
}
