// AFCC-2A.2 — Agent Fabric Command Center read bridge routes (SHS API).
//
//   GET /agent-fabric/command/agents/health
//   GET /agent-fabric/command/agents/readiness
//   GET /agent-fabric/command/gate/status
//   GET /agent-fabric/command/runs/recent
//   GET /agent-fabric/command/watchtower        (AFCC-2A.3)
//   GET /agent-fabric/command/infrastructure    (AFCC-2A.3)
//   GET /agent-fabric/command/observability     (AFCC-2A.3)
//
// Browser path: /api/agent-fabric/command/... (the /api gateway prefix is SHS-owned).
// Authorization: SHS session + active org context + SHS `bos.governance.read`
// (granted to platform operator roles only; see auth/security-permissions.ts).
// Every other method on this prefix is 405 and never reaches Fabric.
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { BRIDGED_SOURCES, readFabricSource, type BridgedSource } from "../fabric-read-bridge.js";

export const AGENT_FABRIC_COMMAND_PREFIX = "/agent-fabric/command";

export function registerAgentFabricCommandRoutes(app: any, deps: { read?: typeof readFabricSource } = {}) {
  const read = deps.read || readFabricSource;
  for (const source of Object.keys(BRIDGED_SOURCES) as BridgedSource[]) {
    app.get(
      `${AGENT_FABRIC_COMMAND_PREFIX}/${source}`,
      requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_FABRIC_COMMAND_READ),
      async (_req: any, res: any) => {
        const result = await read(source);
        res.set("Cache-Control", "no-store");
        return res.status(result.status).json(result.body);
      },
    );
  }
  // Read-only bridge: every mutating method on this prefix is refused before
  // authentication or any Fabric call.
  const refuse = (_req: any, res: any) => {
    res.set("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "The Agent Fabric Command Center bridge is read-only." } });
  };
  for (const method of ["post", "put", "patch", "delete"]) app[method](`${AGENT_FABRIC_COMMAND_PREFIX}/*`, refuse);
}
