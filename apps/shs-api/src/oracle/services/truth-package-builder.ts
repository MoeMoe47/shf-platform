import type {
  TruthPackage,
  TruthStatus,
  VerificationStatus,
  PublicationMode,
} from "../domain/types";
import { deriveContradictionStatus } from "./contradiction-engine";
import { computeConfidenceScore } from "./confidence-engine";
import { deriveReadinessStatus } from "./readiness-engine";
import { buildTrustEnvelope } from "./trust-envelope-builder";

export function buildTruthPackage(input: {
  entityId: string;
  entityType?: string;
  sourceSummary?: string[];
  unresolvedItems?: string[];
  sourceCount?: number;
  verificationStatus?: VerificationStatus;
  truthStatus?: TruthStatus;
  publicationMode?: PublicationMode;
  conflictCount?: number;
  escalated?: boolean;
  resolved?: boolean;
  completeness?: number;
  freshnessBonus?: number;
  recommendedNextAction?: string;
}): TruthPackage {
  const truthStatus: TruthStatus = input.truthStatus || "certified";
  const verificationStatus: VerificationStatus =
    input.verificationStatus || "verified";
  const publicationMode: PublicationMode =
    input.publicationMode || "internal";
  const unresolvedItems = input.unresolvedItems || [];
  const sourceSummary = input.sourceSummary || ["aggregation_layer"];

  const contradictionStatus = deriveContradictionStatus({
    conflictCount: input.conflictCount || unresolvedItems.length,
    escalated: input.escalated,
    resolved: input.resolved,
  });

  const { confidenceScore, confidenceBand } = computeConfidenceScore({
    sourceCount: input.sourceCount || sourceSummary.length,
    verificationStatus,
    contradictionStatus,
    completeness: input.completeness ?? 18,
    freshnessBonus: input.freshnessBonus ?? 6,
  });

  const { readinessStatus, reasons } = deriveReadinessStatus({
    truthStatus,
    verificationStatus,
    contradictionStatus,
    confidenceScore,
    publicationMode,
  });

  const traceId = `trace_${input.entityId}`;

  const trustEnvelope = buildTrustEnvelope({
    traceId,
    truthStatus,
    confidenceScore,
    confidenceBand,
    verificationStatus,
    contradictionStatus,
    readinessStatus,
    publicationMode,
    unresolvedItemsCount: unresolvedItems.length,
    warnings: reasons,
  });

  return {
    entityId: input.entityId,
    entityType: input.entityType || "case",
    truthStatus,
    confidenceScore,
    confidenceBand,
    verificationStatus,
    contradictionStatus,
    readinessStatus,
    sourceSummary,
    unresolvedItems,
    recommendedNextAction:
      input.recommendedNextAction ||
      (reasons.length
        ? "Review unresolved blockers before action or publication."
        : "Proceed with downstream reporting or operator action."),
    lastTruthRefresh: new Date().toISOString(),
    traceId,
    trustEnvelope,
  };
}
