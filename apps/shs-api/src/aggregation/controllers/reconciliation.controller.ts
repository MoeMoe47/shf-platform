import { resolveEntityStage, resolveReconciliationStage } from "./aggregation.controller.js";

export async function getReconciliationForEntity(req: any, res: any) {
  try {
    const { entityId } = req.params;
    const entity = await resolveEntityStage(entityId);
    const reconciliation = await resolveReconciliationStage(entityId, entity);
    res.json(reconciliation);
  } catch (err: any) {
    console.error("[aggregation.reconciliation] failed", err);
    res.status(500).json({
      error: "aggregation_reconciliation_failed",
      message: err?.message || "Unknown reconciliation failure",
    });
  }
}
