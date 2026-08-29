import { resolveTruth } from "../services/oracle.service.js";
import { runOracleCompare } from "../services/compare.service.js";
import { runOraclePriority } from "../services/priority.service.js";
import { writeSecurityAuditEvent } from "../../auth/security-audit.js";

export type OracleActionRecord = {
  entityId: string;
  action: string;
  payload: any;
  createdAt: string;
};

const oracleActions: OracleActionRecord[] = [];

export function getOracleActionLog(entityId?: string) {
  if (!entityId) return oracleActions;
  return oracleActions.filter((item) => item.entityId === entityId);
}

export function getLatestOracleAction(entityId: string) {
  return oracleActions.find((item) => item.entityId === entityId) || null;
}

export async function getOracleTruth(req: any, res: any) {
  try {
    const { entityId } = req.params;
    if (!entityId) {
      return res.status(400).json({ error: "Missing entityId" });
    }

    const truth = await resolveTruth(String(entityId));
    return res.json(truth);
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Oracle truth failed",
    });
  }
}

export async function compareOracleEntities(req: any, res: any) {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ error: "Missing ids query param" });
    }

    const entityIds = String(ids)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const result = await runOracleCompare(entityIds);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Oracle compare failed",
    });
  }
}

export async function getOraclePriorityQueue(req: any, res: any) {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ error: "Missing ids query param" });
    }

    const entityIds = String(ids)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const result = await runOraclePriority(entityIds);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Oracle priority failed",
    });
  }
}

export async function postOracleAction(req: any, res: any) {
  try {
    const { entityId, action, payload } = req.body || {};

    if (!entityId || !action) {
      return res.status(400).json({ error: "Missing entityId or action" });
    }

    const record: OracleActionRecord = {
      entityId: String(entityId),
      action: String(action),
      payload: payload ?? null,
      createdAt: new Date().toISOString(),
    };

    oracleActions.unshift(record);

    await writeSecurityAuditEvent(req, {
      action_type: "oracle.action",
      target_object_type: "oracle_entity",
      target_object_id: String(entityId),
      new_state_json: record,
      reason_code: String(action),
      reason_text: `Oracle action recorded: ${action}`,
    });

    return res.json({
      success: true,
      message: `Oracle action recorded: ${action} for ${entityId}`,
      action: record,
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Oracle action failed",
    });
  }
}

export async function getOracleActions(req: any, res: any) {
  try {
    const entityId = req.query?.entityId ? String(req.query.entityId) : undefined;
    return res.json({ actions: getOracleActionLog(entityId) });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Oracle actions fetch failed",
    });
  }
}
