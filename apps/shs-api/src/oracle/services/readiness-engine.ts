import type {
  ReadinessStatus,
  VerificationStatus,
  ContradictionStatus,
  ConfidenceBand,
  TruthStatus,
  PublicationMode,
} from "../domain/types.js";

interface ComputeReadinessInput {
  verificationStatus: VerificationStatus;
  contradictionStatus: ContradictionStatus;
  confidenceBand?: ConfidenceBand;
  unresolvedItemsCount?: number;
  publicationMode?: string;
}

interface DeriveReadinessInput {
  truthStatus?: TruthStatus;
  verificationStatus: VerificationStatus;
  contradictionStatus: ContradictionStatus;
  confidenceScore?: number;
  publicationMode?: PublicationMode;
}

export function computeReadinessStatus(
  input: ComputeReadinessInput
): ReadinessStatus {
  const verification = String(input.verificationStatus || "").toLowerCase();
  const contradiction = String(input.contradictionStatus || "").toLowerCase();
  const confidence = String(input.confidenceBand || "").toLowerCase();
  const publicationMode = String(input.publicationMode || "internal").toLowerCase();
  const unresolvedItemsCount = Number(input.unresolvedItemsCount || 0);

  if (
    verification === "rejected" ||
    verification === "insufficient_evidence"
  ) {
    return "blocked";
  }

  if (
    contradiction === "unresolved_conflict" ||
    contradiction === "escalated"
  ) {
    return "blocked";
  }

  if (unresolvedItemsCount > 0) {
    return "not_ready";
  }

  if (verification !== "verified") {
    return "not_ready";
  }

  if (confidence === "very_high" && contradiction === "none") {
    if (publicationMode === "public_safe") return "public_ready";
    if (publicationMode === "deidentified_funder") return "funder_ready";
    if (publicationMode === "partner_scoped") return "leadership_ready";
    return "funder_ready";
  }

  if (confidence === "high") {
    return "leadership_ready";
  }

  if (confidence === "moderate") {
    return "internally_ready";
  }

  return "internally_ready";
}

export function deriveReadinessStatus(input: DeriveReadinessInput): {
  readinessStatus: ReadinessStatus;
  reasons: string[];
} {
  const truthStatus = String(input.truthStatus || "unknown").toLowerCase();
  const verification = String(input.verificationStatus || "").toLowerCase();
  const contradiction = String(input.contradictionStatus || "").toLowerCase();
  const confidenceScore = Number(input.confidenceScore || 0);
  const publicationMode = String(input.publicationMode || "internal").toLowerCase();

  const reasons: string[] = [];

  if (truthStatus !== "certified") {
    reasons.push(`truth_${truthStatus}`);
  }

  if (verification !== "verified") {
    reasons.push(`verification_${verification}`);
  }

  if (contradiction !== "none" && contradiction !== "resolved") {
    reasons.push(`contradiction_${contradiction}`);
  }

  let confidenceBand: ConfidenceBand = "low";
  if (confidenceScore >= 90) confidenceBand = "very_high";
  else if (confidenceScore >= 75) confidenceBand = "high";
  else if (confidenceScore >= 55) confidenceBand = "moderate";

  const readinessStatus = computeReadinessStatus({
    verificationStatus: input.verificationStatus,
    contradictionStatus: input.contradictionStatus,
    confidenceBand,
    unresolvedItemsCount: 0,
    publicationMode,
  });

  if (readinessStatus === "blocked") {
    reasons.push("readiness_blocked");
  } else if (readinessStatus === "not_ready") {
    reasons.push("readiness_not_ready");
  }

  return {
    readinessStatus,
    reasons,
  };
}
