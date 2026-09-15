import { ok, fail } from "../../../../api/response-envelope.js";
import { requirePermission } from "../../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../../auth/security-permissions.js";
import { SimulationSessionService, statusForSimulationError } from "../service/simulation-session-service.js";
import { validateSimulationRegistry } from "../registry/simulation-registry.js";
import { getSimulationOrchestrationSurface } from "../service/simulation-orchestration-adapter.js";

const service = new SimulationSessionService();

function sendError(error: any, res: any, next: any) {
  const status = statusForSimulationError(error);
  if (status >= 500) return next(error);
  return res.status(status).json(fail(error?.code || "SIMULATION_REQUEST_DENIED", error?.message || "Simulation request denied."));
}

// MET-13 §21 — every simulation route reuses ASSIGNMENT_VIEW, the same
// permission MET-7's mission routes reuse (missions/api/routes.ts),
// rather than inventing a new permission key across every organization
// role. Protected entry (unlock + org isolation) is enforced again, per
// request, inside SimulationSessionService via MetaverseEntryService —
// this permission check alone never grants access to a specific
// simulation.
export function registerMetaverseSimulationRoutes(app: any) {
  app.get("/metaverse/simulations", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const items = await service.listCatalog(req.user);
      return res.json(ok({ items }));
    } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/simulations/orchestration", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const result = await getSimulationOrchestrationSurface(req.user);
      return res.json(ok(result));
    } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/simulations/registry/validate", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const errors = validateSimulationRegistry();
      return res.json(ok({ ok: errors.length === 0, errors }));
    } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/simulations/:simulationId", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const result = await service.getSimulationView(req.user, req.params.simulationId);
      return res.json(ok(result));
    } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/simulations/:simulationId/session/start", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const result = await service.startSession(req.user, req.params.simulationId, req.body || {});
      return res.status(200).json(ok(result));
    } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/simulations/:simulationId/session/:sessionId/step", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const result = await service.recordStep(req.user, req.params.simulationId, req.params.sessionId, req.body || {});
      return res.status(200).json(ok(result));
    } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/simulations/:simulationId/session/:sessionId/retry", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const result = await service.retrySession(req.user, req.params.simulationId, req.params.sessionId);
      return res.status(200).json(ok(result));
    } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/simulations/:simulationId/session/:sessionId/artifact", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const result = await service.submitArtifact(req.user, req.params.simulationId, req.params.sessionId, req.body || {});
      return res.status(201).json(ok(result));
    } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/simulations/:simulationId/session/:sessionId/complete", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const result = await service.completeSession(req.user, req.params.simulationId, req.params.sessionId);
      return res.status(200).json(ok(result));
    } catch (error) { return sendError(error, res, next); }
  });
}
