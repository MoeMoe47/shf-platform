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
import { BRIDGED_SOURCES, FABRIC_READ_BASE, readFabricProjection, readFabricSource, type BridgedSource } from "../fabric-read-bridge.js";

export const AGENT_FABRIC_COMMAND_PREFIX = "/agent-fabric/command";
const RUN_ID = /^[A-Za-z0-9_.:-]{1,128}$/;
// AFCC-3 Phase 2: action words are never run ids, so a read can never alias an action route.
const RESERVED_RUN_IDS = new Set(["execute", "validate", "dry-run", "recent", "approve", "reject", "cancel", "revoke", "retry", "timeout", "loo"]);
const isRunId = (v: string) => RUN_ID.test(v) && !RESERVED_RUN_IDS.has(v.toLowerCase());

function invalidRunId(res: any) {
  return res.status(400).json({ ok: false, error: { code: "INVALID_RUN_ID", message: "Run id is outside the Agent Fabric Command Center read contract." } });
}

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
  app.get(
    `${AGENT_FABRIC_COMMAND_PREFIX}/runs`,
    requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_FABRIC_COMMAND_READ),
    async (_req: any, res: any) => {
      const result = await readFabricProjection("runs_live", `${FABRIC_READ_BASE}/runs`);
      res.set("Cache-Control", "no-store");
      return res.status(result.status).json(result.body);
    },
  );
  const liveRunRead = (suffix: "" | "/timeline" | "/evidence" | "/dependencies", kind: "run_detail" | "run_timeline" | "run_evidence" | "run_dependencies") =>
    async (req: any, res: any) => {
      const runId = String(req.params.runId || "");
      if (!isRunId(runId)) return invalidRunId(res);
      const result = await readFabricProjection(kind, `${FABRIC_READ_BASE}/runs/${encodeURIComponent(runId)}${suffix}`);
      res.set("Cache-Control", "no-store");
      return res.status(result.status).json(result.body);
    };
  app.get(`${AGENT_FABRIC_COMMAND_PREFIX}/runs/:runId`, requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_FABRIC_COMMAND_READ), liveRunRead("", "run_detail"));
  app.get(`${AGENT_FABRIC_COMMAND_PREFIX}/runs/:runId/timeline`, requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_FABRIC_COMMAND_READ), liveRunRead("/timeline", "run_timeline"));
  app.get(`${AGENT_FABRIC_COMMAND_PREFIX}/runs/:runId/evidence`, requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_FABRIC_COMMAND_READ), liveRunRead("/evidence", "run_evidence"));
  app.get(`${AGENT_FABRIC_COMMAND_PREFIX}/runs/:runId/dependencies`, requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_FABRIC_COMMAND_READ), liveRunRead("/dependencies", "run_dependencies"));
  // Read-only bridge: every mutating method on this prefix is refused before
  // authentication or any Fabric call.
  const refuse = (_req: any, res: any) => {
    res.set("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "The Agent Fabric Command Center bridge is read-only." } });
  };
  for (const method of ["post", "put", "patch", "delete"]) app[method](`${AGENT_FABRIC_COMMAND_PREFIX}/*`, refuse);
}
