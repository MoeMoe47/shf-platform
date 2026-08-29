import { resolveEntityStage, resolveVerificationStage } from "./aggregation.controller.js";

export async function getVerificationForEntity(req: any, res: any) {
  try {
    const { entityId } = req.params;
    const entity = await resolveEntityStage(entityId);
    const verification = await resolveVerificationStage(entityId, entity);
    res.json(verification);
  } catch (err: any) {
    console.error("[aggregation.verification] failed", err);
    res.status(500).json({
      error: "aggregation_verification_failed",
      message: err?.message || "Unknown verification failure",
    });
  }
}
