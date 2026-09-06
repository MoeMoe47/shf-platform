import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { AgentSimulationError, AgentSimulationService } from "../service/agent-simulation-service.js";

const service = new AgentSimulationService();

function reject(res: any, error: any, next: any) {
  if (error instanceof AgentSimulationError) return res.status(error.statusCode).json(fail(error.code, error.message));
  return next(error);
}

export function registerAgentSimulationRoutes(app: any) {
  app.post("/agent-simulations", requirePermission(SHS_SECURITY_PERMISSIONS.AI_SIMULATION_CREATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.createSimulation(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });

  app.get("/agent-simulations", requirePermission(SHS_SECURITY_PERMISSIONS.AI_SIMULATION_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listSimulations(req.user) })); } catch (error) { return reject(res, error, next); }
  });

  app.get("/agent-simulations/:simulationId", requirePermission(SHS_SECURITY_PERMISSIONS.AI_SIMULATION_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getSimulation(req.user, req.params.simulationId))); } catch (error) { return reject(res, error, next); }
  });

  app.get("/agent-simulations/:simulationId/plan", requirePermission(SHS_SECURITY_PERMISSIONS.AI_SIMULATION_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.getPlan(req.user, req.params.simulationId) })); } catch (error) { return reject(res, error, next); }
  });

  app.get("/agent-simulations/:simulationId/actions", requirePermission(SHS_SECURITY_PERMISSIONS.AI_SIMULATION_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.getActions(req.user, req.params.simulationId) })); } catch (error) { return reject(res, error, next); }
  });

  app.get("/agent-activity", requirePermission(SHS_SECURITY_PERMISSIONS.AI_ACTIVITY_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listActivity(req.user) })); } catch (error) { return reject(res, error, next); }
  });
}
