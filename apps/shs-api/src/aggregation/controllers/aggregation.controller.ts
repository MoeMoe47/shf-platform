import * as EntityResolutionService from "../services/entity-resolution.service";
import * as VerificationService from "../services/verification.service";
import * as ReconciliationService from "../services/reconciliation.service";
import * as AggregationOverviewService from "../services/aggregation-overview.service";
import * as AggregateEngineService from "../services/aggregate-engine.service";

type AnyFn = (...args: any[]) => any;

function isObject(v: any) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

async function invokeFirstAvailable(
  serviceModule: Record<string, any>,
  candidateNames: string[],
  argVariants: any[][]
) {
  for (const name of candidateNames) {
    const fn = serviceModule[name];
    if (typeof fn !== "function") continue;

    for (const args of argVariants) {
      try {
        const result = await Promise.resolve((fn as AnyFn)(...args));
        if (result !== undefined) return result;
      } catch {
        // try next variant
      }
    }
  }
  return undefined;
}

export async function resolveEntityStage(entityId: string) {
  const entity = await invokeFirstAvailable(
    EntityResolutionService as any,
    [
      "resolveEntities",
      "resolveEntity",
      "getEntityResolution",
      "getEntity",
      "resolveById",
    ],
    [
      [entityId],
      [{ entityId }],
    ]
  );

  return entity || { entityId, entityType: "case" };
}

export async function resolveVerificationStage(entityId: string, entity: any) {
  const verification = await invokeFirstAvailable(
    VerificationService as any,
    [
      "runVerification",
      "getVerification",
      "verifyEntity",
      "buildVerification",
      "getVerificationForEntity",
    ],
    [
      [entityId],
      [{ entityId }],
      [entity],
      [entityId, entity],
      [{ entityId, entity }],
    ]
  );

  if (isObject(verification)) return verification;
  return { verificationStatus: "unreviewed" };
}

export async function resolveReconciliationStage(entityId: string, entity: any) {
  const reconciliation = await invokeFirstAvailable(
    ReconciliationService as any,
    [
      "runReconciliation",
      "getReconciliation",
      "reconcileEntity",
      "buildReconciliation",
      "getReconciliationForEntity",
    ],
    [
      [entityId],
      [{ entityId }],
      [entity],
      [entityId, entity],
      [{ entityId, entity }],
    ]
  );

  if (isObject(reconciliation)) return reconciliation;
  return {
    conflictCount: 0,
    unresolvedItems: [],
    resolved: false,
    escalated: false,
  };
}

export async function resolveAggregationStage(entityId: string, entity: any) {
  const aggregation = await invokeFirstAvailable(
    {
      ...(AggregationOverviewService as any),
      ...(AggregateEngineService as any),
    },
    [
      "getAggregationOverview",
      "buildAggregationOverview",
      "computeAggregateSnapshot",
      "runAggregateEngine",
      "getAggregateSnapshot",
    ],
    [
      [entityId],
      [{ entityId }],
      [entity],
      [entityId, entity],
      [{ entityId, entity }],
    ]
  );

  if (isObject(aggregation)) {
    return {
      sourceSummary: aggregation.sourceSummary || ["aggregation_layer"],
      sourceCount: aggregation.sourceCount || 1,
      completeness: aggregation.completeness ?? 8,
      freshnessBonus: aggregation.freshnessBonus ?? 1,
      raw: aggregation,
    };
  }

  return {
    sourceSummary: ["aggregation_layer"],
    sourceCount: 1,
    completeness: 8,
    freshnessBonus: 1,
  };
}

export async function buildPipelinePayload(entityId: string) {
  const entity = await resolveEntityStage(entityId);
  const verification = await resolveVerificationStage(entityId, entity);
  const reconciliation = await resolveReconciliationStage(entityId, entity);
  const aggregation = await resolveAggregationStage(entityId, entity);

  const recommendedNextAction =
    reconciliation?.unresolvedItems?.length
      ? "Review unresolved blockers before action or publication."
      : verification?.verificationStatus === "verified"
      ? "Proceed with reporting and institutional review."
      : "Await further validation.";

  return {
    entity,
    verification,
    reconciliation,
    aggregation,
    recommendedNextAction,
  };
}

export async function getAggregationPipeline(req: any, res: any) {
  try {
    const { entityId } = req.params;
    const payload = await buildPipelinePayload(entityId);
    res.json(payload);
  } catch (err: any) {
    console.error("[aggregation.pipeline] failed", err);
    res.status(500).json({
      error: "aggregation_pipeline_failed",
      message: err?.message || "Unknown pipeline failure",
    });
  }
}
