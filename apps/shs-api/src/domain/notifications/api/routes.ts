import { fail, ok } from "../../../api/response-envelope.js";
import * as service from "../service/notification-service.js";

function requireNotificationContext(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
  if (req.user.org_context_error || !req.user.active_organization_id || !req.user.tenant_id) return res.status(403).json(fail("ORG_CONTEXT_REQUIRED", "Valid active organization context is required."));
  return next();
}

export function registerNotificationRoutes(app: any) {
  app.get("/notifications", requireNotificationContext, async (req: any, res: any) => {
    try { return res.json(ok({ items: await service.listNotifications(req.user) })); } catch (error: any) { return res.status(403).json(fail(error.message, error.message)); }
  });
  app.get("/notifications/unread-count", requireNotificationContext, async (req: any, res: any) => {
    try { return res.json(ok(await service.unreadCount(req.user))); } catch (error: any) { return res.status(403).json(fail(error.message, error.message)); }
  });
  app.post("/notifications/:id/read", requireNotificationContext, async (req: any, res: any) => {
    try { return res.json(ok(await service.markRead(req.user, req.params.id))); } catch (error: any) { return res.status(error.message === "NOTIFICATION_NOT_FOUND" ? 404 : 403).json(fail(error.message, error.message)); }
  });
  app.post("/notifications/read-all", requireNotificationContext, async (req: any, res: any) => {
    try { return res.json(ok(await service.markAllRead(req.user))); } catch (error: any) { return res.status(403).json(fail(error.message, error.message)); }
  });
}
