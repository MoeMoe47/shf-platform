import { applyOracleAction } from "../services/action-engine.js";

export function handleOracleAction(req: any, res: any) {
  try {
    const { entityId, action } = req.body;

    if (!entityId || !action) {
      return res.status(400).json({ error: "Missing entityId or action" });
    }

    const updated = applyOracleAction(entityId, action);

    res.json({
      success: true,
      entityId,
      action,
      updated,
      message: `Action "${action}" applied to ${entityId}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Action failed" });
  }
}
