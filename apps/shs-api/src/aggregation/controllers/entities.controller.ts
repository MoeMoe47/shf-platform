import { resolveEntityStage } from "./aggregation.controller";

export async function getAggregatedEntity(req: any, res: any) {
  try {
    const { entityId } = req.params;
    const entity = await resolveEntityStage(entityId);
    res.json(entity);
  } catch (err: any) {
    console.error("[aggregation.entities] failed", err);
    res.status(500).json({
      error: "aggregation_entities_failed",
      message: err?.message || "Unknown entity resolution failure",
    });
  }
}
