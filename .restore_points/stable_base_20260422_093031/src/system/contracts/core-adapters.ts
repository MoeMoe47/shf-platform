import type {
  OutcomeState,
  OutcomeRecommendation,
} from "./outcomes";
import type {
  ReadinessStatus,
  TrustEnvelope,
  VerificationCoverage,
  PublicationSafetyStatus,
} from "./watchtower";

export interface BridgeWorkflowLike {
  caseId: string;
  toOrganizationId?: string;
  verificationState?: "pending" | "verified";
  sourceToReportTraceCoverage?: boolean;
  publicationMode?: "admin_internal" | "leadership" | "partner_scoped" | "public_safe";
}

export interface BridgeTrustLike {
  trustId?: string;
  entityId: string;
  verificationState?: "pending" | "verified" | "blocked";
  confidenceScore?: number;
  confidenceLabel?: "low" | "medium" | "high";
  sourceCount?: number;
  lastVerifiedAt?: string;
  publicationMode?: "admin_internal" | "leadership" | "partner_scoped" | "public_safe";
}

export interface VerificationQueueRowLike {
  id: string;
  verificationState?: "pending" | "verified" | "blocked";
  missingFields?: string | string[];
}

export interface ReportingExportLike {
  entityId: string;
  publicationMode?: "admin_internal" | "leadership" | "partner_scoped" | "public_safe";
  readiness?: {
    aggregationReady?: boolean;
    verificationReady?: boolean;
    reportingReady?: boolean;
    missingFields?: string[];
  };
}

export interface LiveCaseLike {
  caseId: string;
  entityId?: string;
  status?: "stable" | "improving" | "at_risk" | "critical";
  confidenceScore?: number;
  likelyNextState?: string;
  lastUpdatedAt?: string;
}

export interface RecommendationReadyLike {
  outcomeId: string;
  priority?: "low" | "medium" | "high";
  action?: string;
  rationale?: string;
  expectedImpact?: string;
  confidenceScore?: number;
}

function normalizeMissingFields(input?: string | string[]): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (input === "—") return [];
  return String(input)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function mapBridgeWorkflowToReadinessStatus(
  input: BridgeWorkflowLike
): ReadinessStatus {
  const missingFields: string[] = [];
  if (!input.toOrganizationId) missingFields.push("toOrganizationId");

  const aggregationReady = missingFields.length === 0;
  const verificationReady =
    aggregationReady && input.verificationState === "verified";
  const reportingReady =
    verificationReady && Boolean(input.sourceToReportTraceCoverage);

  return {
    entityId: input.caseId,
    aggregationReady,
    verificationReady,
    reportingReady,
    missingFields,
  };
}

export function mapBridgeTrustToTrustEnvelope(
  input: BridgeTrustLike
): TrustEnvelope {
  return {
    trustId: input.trustId || `trust_${input.entityId}`,
    entityId: input.entityId,
    verificationState: input.verificationState || "pending",
    confidenceScore: input.confidenceScore ?? 84,
    confidenceLabel: input.confidenceLabel || "medium",
    sourceCount: input.sourceCount ?? 1,
    lastVerifiedAt: input.lastVerifiedAt || new Date().toISOString(),
    publicationMode: input.publicationMode || "admin_internal",
  };
}

export function mapVerificationRowToVerificationCoverage(
  input: VerificationQueueRowLike
): VerificationCoverage {
  const missingEvidence = normalizeMissingFields(input.missingFields);
  const requiredEvidenceCount = Math.max(1, missingEvidence.length + 1);
  const verifiedEvidenceCount =
    input.verificationState === "verified"
      ? requiredEvidenceCount
      : Math.max(0, requiredEvidenceCount - missingEvidence.length);
  const coveragePercent = Math.round(
    (verifiedEvidenceCount / requiredEvidenceCount) * 100
  );

  return {
    entityId: input.id,
    requiredEvidenceCount,
    verifiedEvidenceCount,
    coveragePercent,
    missingEvidence,
  };
}

export function mapReportingExportToPublicationSafetyStatus(
  input: ReportingExportLike
): PublicationSafetyStatus {
  const blockedReasons: string[] = [];

  if (!input.readiness?.aggregationReady) blockedReasons.push("aggregation_not_ready");
  if (!input.readiness?.verificationReady) blockedReasons.push("verification_not_ready");
  if (!input.readiness?.reportingReady) blockedReasons.push("reporting_not_ready");

  if (input.readiness?.missingFields?.length) {
    blockedReasons.push(...input.readiness.missingFields.map((field) => `missing_${field}`));
  }

  return {
    entityId: input.entityId,
    safeToPublish: blockedReasons.length === 0,
    publicationMode: input.publicationMode || "admin_internal",
    blockedReasons,
  };
}

export function mapLiveCaseToOutcomeState(
  input: LiveCaseLike
): OutcomeState {
  return {
    outcomeId: `outcome_${input.caseId}`,
    entityId: input.entityId || input.caseId,
    caseId: input.caseId,
    currentState: input.status || "at_risk",
    confidenceScore: input.confidenceScore ?? 78,
    likelyNextState: input.likelyNextState || "stabilize_after_intervention",
    lastUpdatedAt: input.lastUpdatedAt || new Date().toISOString(),
  };
}

export function mapRecommendationReadyToOutcomeRecommendation(
  input: RecommendationReadyLike
): OutcomeRecommendation {
  return {
    recommendationId: `rec_${input.outcomeId}`,
    outcomeId: input.outcomeId,
    priority: input.priority || "medium",
    action: input.action || "Review and assign next intervention step.",
    rationale:
      input.rationale ||
      "Recommendation generated from current verified workflow and outcome state.",
    expectedImpact:
      input.expectedImpact || "Improved workflow readiness and stronger reporting confidence.",
    confidenceScore: input.confidenceScore ?? 82,
  };
}
