import { buildTruthPackage } from "./truth-package-builder";
import { setTruth } from "../repositories/truth.repo";
import type { TruthPackage, VerificationStatus } from "../domain/types";
import { getLatestOracleAction } from "../controllers/oracle.controller";

type PipelineResponse = {
  entity?: {
    entityId?: string;
    entityType?: string;
  };
  verification?: {
    verificationStatus?: VerificationStatus;
  };
  reconciliation?: {
    conflictCount?: number;
    unresolvedItems?: string[];
    resolved?: boolean;
    escalated?: boolean;
  };
  aggregation?: {
    sourceSummary?: string[];
    sourceCount?: number;
    completeness?: number;
    freshnessBonus?: number;
  };
  recommendedNextAction?: string;
};

export async function resolveTruth(entityId: string): Promise<TruthPackage> {
  const resp = await fetch(
    `http://127.0.0.1:8091/aggregation/pipeline/${encodeURIComponent(entityId)}`
  );

  if (!resp.ok) {
    throw new Error(`Aggregation pipeline request failed: ${resp.status}`);
  }

  const pipeline = (await resp.json()) as PipelineResponse;
  const latestAction = getLatestOracleAction(entityId);

  const verificationStatus =
    pipeline?.verification?.verificationStatus || "unreviewed";

  const unresolvedItems =
    pipeline?.reconciliation?.unresolvedItems || [];

  const conflictCount =
    pipeline?.reconciliation?.conflictCount ?? unresolvedItems.length;

  const resolved =
    pipeline?.reconciliation?.resolved ?? false;

  const escalated =
    pipeline?.reconciliation?.escalated ?? false;

  const completeness =
    pipeline?.aggregation?.completeness ?? 8;

  const freshnessBonus =
    pipeline?.aggregation?.freshnessBonus ?? 1;

  const sourceSummary =
    pipeline?.aggregation?.sourceSummary || ["aggregation_layer"];

  const sourceCount =
    pipeline?.aggregation?.sourceCount || sourceSummary.length;

  let truthStatus =
    verificationStatus === "verified" && conflictCount === 0
      ? "certified"
      : verificationStatus === "in_review"
      ? "candidate"
      : "candidate";

  let readinessStatus =
    verificationStatus === "verified" && conflictCount === 0
      ? "internally_ready"
      : conflictCount > 0
      ? "blocked"
      : "needs_review";

  let recommendedNextAction =
    pipeline?.recommendedNextAction || "Await further validation.";

  if (latestAction?.action === "promote_case") {
    readinessStatus = "execution_mode";
    truthStatus = "certified";
    recommendedNextAction = "Proceed with reporting and institutional review.";
  }

  if (latestAction?.action === "hold_for_verification") {
    readinessStatus = "verification_hold";
    recommendedNextAction = "Resolve verification gaps before execution.";
  }

  const truthPackage = buildTruthPackage({
    entityId,
    entityType: pipeline?.entity?.entityType || "case",
    publicationMode: "internal",
    sourceSummary,
    sourceCount,
    completeness,
    freshnessBonus,
    verificationStatus,
    truthStatus,
    conflictCount,
    unresolvedItems,
    resolved,
    escalated,
    recommendedNextAction,
  });

  const mergedTruth: TruthPackage & {
    latestOracleAction?: string | null;
    lastActionAt?: string | null;
  } = {
    ...truthPackage,
    readinessStatus,
    latestOracleAction: latestAction?.action || null,
    lastActionAt: latestAction?.createdAt || null,
    trustEnvelope: {
      ...truthPackage.trustEnvelope,
      truthStatus,
      verificationStatus,
      readinessStatus,
      lastUpdatedAt: new Date().toISOString(),
    },
  };

  return setTruth(mergedTruth as TruthPackage);
}

export async function getTruthWithRefresh(entityId: string): Promise<TruthPackage> {
  return resolveTruth(entityId);
}
