import * as EntityResolutionService from "../services/entity-resolution.service.js";
import * as VerificationService from "../services/verification.service.js";
import * as ReconciliationService from "../services/reconciliation.service.js";
import * as AggregationOverviewService from "../services/aggregation-overview.service.js";
import * as AggregateEngineService from "../services/aggregate-engine.service.js";
import type { VerificationStatus } from "../../oracle/domain/types.js";

type AnyFn = (...args: any[]) => any;

type PipelineEntity = {
  entityId: string;
  entityType: string;
  county?: string;
  programId?: string;
  [key: string]: any;
};

type PipelineVerification = {
  verificationStatus: VerificationStatus;
  evidenceCount: number;
  missingEvidence: string[];
  reviewedAt?: string | null;
  [key: string]: any;
};

type PipelineReconciliation = {
  conflictCount: number;
  unresolvedItems: string[];
  resolved: boolean;
  escalated: boolean;
  [key: string]: any;
};

type PipelineAggregation = {
  sourceSummary: string[];
  sourceCount: number;
  completeness: number;
  freshnessBonus: number;
  raw?: any;
};

function isObject(v: any) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function toArray(value: any): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function clampNumber(value: any, fallback: number, min = 0, max = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeVerificationStatus(value: any): VerificationStatus {
  const next = String(value || "").toLowerCase();

  if (
    next === "unreviewed" ||
    next === "in_review" ||
    next === "verified" ||
    next === "insufficient_evidence" ||
    next === "rejected"
  ) {
    return next;
  }

  // Legacy compatibility.
  if (next === "pending") return "unreviewed";
  if (next === "review_required") return "in_review";
  if (next === "needs_review") return "in_review";

  return "unreviewed";
}

function normalizeEntity(entityId: string, entity: any): PipelineEntity {
  if (!isObject(entity)) {
    return {
      entityId,
      entityType: "case",
    };
  }

  return {
    ...entity,
    entityId: String(entity.entityId || entity.id || entityId),
    entityType: String(entity.entityType || entity.type || "case"),
  };
}

function normalizeVerification(input: any): PipelineVerification {
  const verificationStatus = normalizeVerificationStatus(input?.verificationStatus);
  const evidenceCount = clampNumber(input?.evidenceCount, 0, 0, 999);
  const missingEvidence = toArray(input?.missingEvidence);

  return {
    ...(isObject(input) ? input : {}),
    verificationStatus,
    evidenceCount,
    missingEvidence,
    reviewedAt: input?.reviewedAt ?? null,
  };
}

function normalizeReconciliation(input: any): PipelineReconciliation {
  const unresolvedItems = toArray(input?.unresolvedItems);
  const conflictCount = clampNumber(
    input?.conflictCount ?? unresolvedItems.length,
    unresolvedItems.length,
    0,
    999
  );

  return {
    ...(isObject(input) ? input : {}),
    conflictCount,
    unresolvedItems,
    resolved: Boolean(input?.resolved),
    escalated: Boolean(input?.escalated),
  };
}

function normalizeAggregation(input: any): PipelineAggregation {
  const sourceSummary = toArray(input?.sourceSummary);
  const safeSourceSummary = sourceSummary.length ? sourceSummary : ["aggregation_layer"];
  const sourceCount = clampNumber(input?.sourceCount ?? safeSourceSummary.length, safeSourceSummary.length, 1, 999);

  return {
    sourceSummary: safeSourceSummary,
    sourceCount,
    completeness: clampNumber(input?.completeness, 8, 0, 25),
    freshnessBonus: clampNumber(input?.freshnessBonus, 1, 0, 10),
    raw: input?.raw || input || null,
  };
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

export async function resolveEntityStage(entityId: string): Promise<PipelineEntity> {
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

  return normalizeEntity(entityId, entity);
}

export async function resolveVerificationStage(
  entityId: string,
  entity: PipelineEntity
): Promise<PipelineVerification> {
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

  return normalizeVerification(verification);
}

export async function resolveReconciliationStage(
  entityId: string,
  entity: PipelineEntity
): Promise<PipelineReconciliation> {
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

  return normalizeReconciliation(reconciliation);
}

export async function resolveAggregationStage(
  entityId: string,
  entity: PipelineEntity
): Promise<PipelineAggregation> {
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

  if (isObject(aggregation) && isObject(aggregation.aggregation)) {
    return normalizeAggregation(aggregation.aggregation);
  }

  return normalizeAggregation(aggregation);
}

function buildRecommendedNextAction(input: {
  verification: PipelineVerification;
  reconciliation: PipelineReconciliation;
}) {
  if (input.reconciliation.escalated) {
    return "Escalated conflict requires review before action or publication.";
  }

  if (input.reconciliation.unresolvedItems.length || input.reconciliation.conflictCount > 0) {
    return "Review unresolved blockers before action or publication.";
  }

  if (input.verification.verificationStatus === "verified") {
    return "Proceed with reporting and institutional review.";
  }

  if (input.verification.verificationStatus === "insufficient_evidence") {
    return "Attach missing evidence before reporting.";
  }

  if (input.verification.verificationStatus === "in_review") {
    return "Complete verification review before reporting.";
  }

  if (input.verification.verificationStatus === "rejected") {
    return "Record is rejected and blocked from reporting.";
  }

  return "Await further validation.";
}

export async function buildPipelinePayload(entityId: string) {
  const entity = await resolveEntityStage(entityId);
  const verification = await resolveVerificationStage(entityId, entity);
  const reconciliation = await resolveReconciliationStage(entityId, entity);
  const aggregation = await resolveAggregationStage(entityId, entity);

  return {
    entity,
    verification,
    reconciliation,
    aggregation,
    recommendedNextAction: buildRecommendedNextAction({
      verification,
      reconciliation,
    }),
  };
}

export async function getAggregationPipeline(req: any, res: any) {
  try {
    const { entityId } = req.params;
    const payload = await buildPipelinePayload(entityId);
    return res.json(payload);
  } catch (err: any) {
    console.error("[aggregation.pipeline] failed", err);
    return res.status(500).json({
      error: "aggregation_pipeline_failed",
      message: err?.message || "Unknown pipeline failure",
    });
  }
}
