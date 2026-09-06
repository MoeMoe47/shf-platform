import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { McpError, McpService } from "../service/mcp-service.js";

const service = new McpService();
function reject(res: any, error: any, next: any) { if (error instanceof McpError) return res.status(error.statusCode).json(fail(error.code, error.message)); return next(error); }

export function registerMcpRoutes(app: any) {
  app.post("/mcp/servers", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_ADMIN), async (req: any, res: any, next: any) => { try { return res.status(201).json(ok(await service.registerServer(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); } });
  app.get("/mcp/servers", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_READ), async (req: any, res: any, next: any) => { try { return res.json(ok({ items: await service.listServers(req.user) })); } catch (error) { return reject(res, error, next); } });
  app.get("/mcp/servers/:serverId", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_READ), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.getServer(req.user, req.params.serverId))); } catch (error) { return reject(res, error, next); } });
  app.post("/mcp/servers/:serverId/approve", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_ADMIN), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.setServerLifecycle(req.user, req.params.serverId, "ACTIVE"))); } catch (error) { return reject(res, error, next); } });
  app.post("/mcp/servers/:serverId/disable", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_ADMIN), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.setServerLifecycle(req.user, req.params.serverId, "DISABLED"))); } catch (error) { return reject(res, error, next); } });
  app.post("/mcp/servers/:serverId/revoke", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_ADMIN), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.setServerLifecycle(req.user, req.params.serverId, "REVOKED"))); } catch (error) { return reject(res, error, next); } });
  app.post("/mcp/servers/:serverId/discover", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_DISCOVER), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.discover(req.user, req.params.serverId, req.body || {}))); } catch (error) { return reject(res, error, next); } });
  app.get("/mcp/servers/:serverId/tools", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_READ), async (req: any, res: any, next: any) => { try { return res.json(ok({ items: await service.listTools(req.user, req.params.serverId) })); } catch (error) { return reject(res, error, next); } });
  app.get("/mcp/servers/:serverId/resources", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_READ), async (req: any, res: any, next: any) => { try { return res.json(ok({ items: await service.listResources(req.user, req.params.serverId) })); } catch (error) { return reject(res, error, next); } });
  app.post("/mcp/tool-policies", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_ADMIN), async (req: any, res: any, next: any) => { try { return res.status(201).json(ok(await service.setToolPolicy(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); } });
  app.post("/mcp/evaluate", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_SIMULATE), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.evaluateMcpAccess(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); } });
  app.post("/mcp/simulations", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_SIMULATE), async (req: any, res: any, next: any) => { try { return res.status(201).json(ok(await service.simulateInvocation(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); } });
  app.post("/mcp/read", requirePermission(SHS_SECURITY_PERMISSIONS.AI_MCP_READ_RESOURCE), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.readResource(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); } });
}
