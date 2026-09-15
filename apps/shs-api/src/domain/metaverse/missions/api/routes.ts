// MET-7 — City Mission HTTP routes (build brief §24).
//
// Reuses assignment.view (the same permission apps/shs-api/src/domain/
// assignments/api/routes.ts already gates on) rather than declaring a
// new metaverse.mission permission — a City Mission is a projection of
// Assignment data, not a new authority, so it is gated the same way.
import { ok, fail } from "../../../../api/response-envelope.js";
import { requirePermission } from "../../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../../auth/security-permissions.js";
import {
  listMissionsForActor,
  getMissionForActor,
  enterMission,
  recordMissionViewed,
  recordMissionActivityCompleted,
  submitMission,
  statusForMissionError,
} from "../mission-projection-service.js";

function sendMissionError(error: any, res: any, next: any) {
  const status = statusForMissionError(error);
  if (status >= 500) return next(error);
  return res.status(status).json(fail(error?.code || "MISSION_REQUEST_DENIED", error?.message || "Mission request denied."));
}

export function registerMetaverseMissionRoutes(app: any) {
  app.get("/metaverse/missions", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const missions = await listMissionsForActor(req.user);
      return res.json(ok({ items: missions }));
    } catch (error) {
      return sendMissionError(error, res, next);
    }
  });

  app.get("/metaverse/missions/:missionId", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const mission = await getMissionForActor(req.user, req.params.missionId);
      if (!mission) return res.status(404).json(fail("MISSION_NOT_FOUND", "Mission not found."));
      return res.json(ok(mission));
    } catch (error) {
      return sendMissionError(error, res, next);
    }
  });

  app.post("/metaverse/missions/:missionId/enter", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const result = await enterMission(req.user, req.params.missionId, {
        cameraContext: req.body?.camera_context || req.body?.cameraContext || null,
        clientBody: req.body || {},
        exit: Boolean(req.body?.exit),
      });
      return res.status(result.can_enter ? 200 : 403).json(ok(result));
    } catch (error) {
      return sendMissionError(error, res, next);
    }
  });

  app.post("/metaverse/missions/:missionId/events", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const eventName = String(req.body?.event || req.body?.event_name || "").trim();
      const mission = eventName === "activity_completed"
        ? await recordMissionActivityCompleted(req.user, req.params.missionId)
        : await recordMissionViewed(req.user, req.params.missionId);
      return res.json(ok({ mission, recorded_event: eventName === "activity_completed" ? "metaverse.mission.activity_completed" : "metaverse.mission.viewed" }));
    } catch (error) {
      return sendMissionError(error, res, next);
    }
  });

  app.post("/metaverse/missions/:missionId/submit", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const result = await submitMission(req.user, req.params.missionId);
      return res.json(ok(result));
    } catch (error) {
      return sendMissionError(error, res, next);
    }
  });
}
