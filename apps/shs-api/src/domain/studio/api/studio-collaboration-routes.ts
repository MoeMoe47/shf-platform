import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { StudioProjectService } from "../service/studio-project-service.js";
import { StudioCollaborationService } from "../service/studio-collaboration-service.js";

const projects = new StudioProjectService();
const collaboration = new StudioCollaborationService();

function actor(req: any) { return req.user; }
function statusFor(error: any) { return String(error?.message || "").includes("NOT_FOUND") ? 404 : String(error?.message || "").includes("REQUIRED") || String(error?.message || "").includes("FORBIDDEN") ? 403 : 400; }

export function registerStudioCollaborationRoutes(app: any) {
  app.get("/studio/projects/:projectId/collaboration/stream", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try {
      // Authorize before opening the stream so denied callers receive a real HTTP error.
      await projects.getCollaborationAccess(actor(req), req.params.projectId);
      res.status(200).set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
      res.flushHeaders?.();
      const disconnect = await collaboration.connect(actor(req), req.params.projectId, res, (user, projectId) => projects.getCollaborationAccess(user, projectId));
      const heartbeat = setInterval(async () => {
        await collaboration.revalidate(req.params.projectId, (user, projectId) => projects.getCollaborationAccess(user, projectId));
        if (!res.writableEnded) res.write(": heartbeat\n\n");
      }, 15000);
      req.on("close", () => { clearInterval(heartbeat); disconnect(); });
    } catch (error: any) {
      if (!res.headersSent) res.status(statusFor(error)).json(fail(String(error?.message || "COLLABORATION_REJECTED"), "COLLABORATION_REJECTED"));
      else res.end();
    }
  });

  app.post("/studio/projects/:projectId/collaboration/updates", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE), async (req: any, res: any) => {
    try { return res.json(ok(await collaboration.publish(actor(req), req.params.projectId, req.body || {}, (user, projectId) => projects.getCollaborationAccess(user, projectId)))); }
    catch (error: any) { return res.status(statusFor(error)).json(fail(String(error?.message || "COLLABORATION_REJECTED"), "COLLABORATION_REJECTED")); }
  });
}
