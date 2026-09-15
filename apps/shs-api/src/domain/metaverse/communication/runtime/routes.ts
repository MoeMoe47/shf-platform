import { fail, ok } from "../../../../api/response-envelope.js";
import { METAVERSE_COMMUNICATION_AUTHORITY_BOUNDARY, METAVERSE_NOTIFICATION_INTEGRATION } from "../communication-policy.js";
import { MetaverseMessageService } from "./message-service.js";
import { MetaversePresenceService, MetaverseCommunicationError } from "./presence-service.js";
import { MetaverseRoomService } from "./room-service.js";

const presence = new MetaversePresenceService();
const rooms = new MetaverseRoomService();
const messages = new MetaverseMessageService();

function statusFor(error: any) {
  if (error instanceof MetaverseCommunicationError) return error.statusCode;
  const text = String(error?.message || "");
  if (text.includes("required")) return 400;
  return 500;
}

function send(error: any, res: any, next: any) {
  const status = statusFor(error);
  if (status >= 500) return next(error);
  return res.status(status).json(fail(error?.code || String(error?.message || "METAVERSE_COMMUNICATION_DENIED"), error?.message || "Metaverse communication denied."));
}

export function registerMetaverseCommunicationRoutes(app: any) {
  app.post("/metaverse/presence", (req: any, res: any, next: any) => {
    try { return res.json(ok({ presence: presence.start(req.user, req.body || {}) })); } catch (error) { return send(error, res, next); }
  });

  app.post("/metaverse/presence/heartbeat", (req: any, res: any, next: any) => {
    try { return res.json(ok({ presence: presence.heartbeat(req.user, req.body || {}) })); } catch (error) { return send(error, res, next); }
  });

  app.post("/metaverse/presence/revoke", (req: any, res: any, next: any) => {
    try { return res.json(ok(presence.revoke(req.user, String(req.body?.presence_session_id || "")))); } catch (error) { return send(error, res, next); }
  });

  app.get("/metaverse/presence/city", (req: any, res: any, next: any) => {
    try { return res.json(ok({ counts: presence.city(req.user) })); } catch (error) { return send(error, res, next); }
  });

  app.get("/metaverse/presence/participants", (req: any, res: any, next: any) => {
    try {
      return res.json(ok(presence.participants(req.user, {
        district_id: String(req.query?.district_id || req.query?.districtId || "").trim() || null,
        facility_id: String(req.query?.facility_id || req.query?.facilityId || "").trim() || null,
      })));
    } catch (error) { return send(error, res, next); }
  });

  app.get("/metaverse/rooms/policy", (_req: any, res: any) => res.json(ok({
    direct_messaging: rooms.directMessagingPolicy(),
    notification_integration: METAVERSE_NOTIFICATION_INTEGRATION,
    authority_boundary: METAVERSE_COMMUNICATION_AUTHORITY_BOUNDARY,
  })));

  app.post("/metaverse/rooms", (req: any, res: any, next: any) => {
    try { return res.json(ok({ room: rooms.getOrCreate(req.user, req.body || {}) })); } catch (error) { return send(error, res, next); }
  });

  app.get("/metaverse/rooms/:roomId/messages", (req: any, res: any, next: any) => {
    try { return res.json(ok({ messages: messages.list(req.user, req.params.roomId) })); } catch (error) { return send(error, res, next); }
  });

  app.post("/metaverse/rooms/:roomId/messages", (req: any, res: any, next: any) => {
    try { return res.json(ok({ message: messages.send(req.user, req.params.roomId, req.body || {}) })); } catch (error) { return send(error, res, next); }
  });

  app.delete("/metaverse/rooms/:roomId/messages/:messageId", (req: any, res: any, next: any) => {
    try { return res.json(ok({ message: messages.delete(req.user, req.params.roomId, req.params.messageId) })); } catch (error) { return send(error, res, next); }
  });

  app.get("/metaverse/rooms/:roomId/participants", (req: any, res: any, next: any) => {
    try {
      const room = rooms.getAuthorized(req.user, req.params.roomId);
      return res.json(ok(presence.participants(req.user, { district_id: room.district_id, facility_id: room.facility_id })));
    } catch (error) { return send(error, res, next); }
  });

  app.post("/metaverse/rooms/:roomId/mute", (req: any, res: any, next: any) => {
    try { return res.json(ok({ preference: messages.mute(req.user, String(req.body?.target_user_id || req.body?.targetUserId || ""), req.params.roomId) })); } catch (error) { return send(error, res, next); }
  });

  app.post("/metaverse/rooms/:roomId/block", (req: any, res: any, next: any) => {
    try { return res.json(ok({ preference: messages.block(req.user, String(req.body?.target_user_id || req.body?.targetUserId || ""), req.params.roomId) })); } catch (error) { return send(error, res, next); }
  });

  app.post("/metaverse/rooms/:roomId/reports", (req: any, res: any, next: any) => {
    try { return res.json(ok({ report: messages.report(req.user, req.params.roomId, req.body || {}) })); } catch (error) { return send(error, res, next); }
  });

  app.post("/metaverse/moderation/actions", (req: any, res: any, next: any) => {
    try { return res.json(ok({ action: messages.moderate(req.user, req.body || {}) })); } catch (error) { return send(error, res, next); }
  });
}
