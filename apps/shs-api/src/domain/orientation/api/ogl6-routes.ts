import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { analytics, createDraft, listAuthoring, publish, recordTelemetry } from "../service/ogl6-service.js";
const view = requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_REGISTRY_MANAGE);
function handle(fn: (req: any) => Promise<any>) { return async (req: any, res: any) => { try { return res.json(ok(await fn(req))); } catch (error: any) { return res.status(error.statusCode || 400).json(fail(error.code || error.message, error.message)); } }; }
export function registerOgl6Routes(app: any) { app.get("/orientation/admin", view, handle(listAuthoring)); app.post("/orientation/admin/drafts", view, handle(createDraft)); app.post("/orientation/admin/publish", view, handle(publish)); app.get("/orientation/analytics", view, handle(analytics)); app.post("/orientation/telemetry", handle(recordTelemetry)); }
