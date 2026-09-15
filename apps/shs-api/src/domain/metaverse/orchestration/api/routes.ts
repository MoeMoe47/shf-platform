import { ok, fail } from "../../../../api/response-envelope.js";
import { requirePermission } from "../../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../../auth/security-permissions.js";
import {
  fastTravel,
  getCityOrchestration,
  statusForCityOrchestrationError,
} from "../service/city-orchestration-service.js";

function sendError(error: any, res: any, next: any) {
  const status = statusForCityOrchestrationError(error);
  if (status >= 500) return next(error);
  return res.status(status).json(fail(error?.code || "CITY_ORCHESTRATION_DENIED", error?.message || "City orchestration request denied."));
}

export function registerMetaverseOrchestrationRoutes(app: any) {
  app.get("/metaverse/orchestration", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await getCityOrchestration(req.user))); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/orchestration/briefing", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok((await getCityOrchestration(req.user)).briefing)); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/orchestration/next-action", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok((await getCityOrchestration(req.user)).next_action)); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/orchestration/district-pulse", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: (await getCityOrchestration(req.user)).district_pulses })); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/orchestration/events", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: (await getCityOrchestration(req.user)).city_events })); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/orchestration/building/:facilityId", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const preview = (await getCityOrchestration(req.user)).building_previews.find((item) => item.facility_id === req.params.facilityId);
      if (!preview) return res.status(404).json(fail("BUILDING_NOT_FOUND", "Building preview not found."));
      return res.json(ok(preview));
    } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/orchestration/fast-travel", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try {
      return res.status(200).json(ok(await fastTravel(req.user, String(req.body?.destination_id || req.body?.destinationId || ""), req.body || {})));
    } catch (error) { return sendError(error, res, next); }
  });
}
