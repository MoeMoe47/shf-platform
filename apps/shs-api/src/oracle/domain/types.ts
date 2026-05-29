// ========================================
// SHS ORACLE — SHARED TRUTH MODEL (LOCKED)
// ========================================

// ---------- TRUTH STATUS ----------
export type TruthStatus =
  | "unknown"
  | "candidate"
  | "certified"
  | "disputed"
  | "blocked"
  | "stale";

// ---------- VERIFICATION STATUS ----------
export type VerificationStatus =
  | "unreviewed"
  | "in_review"
  | "verified"
  | "insufficient_evidence"
  | "rejected";

// ---------- CONTRADICTION STATUS ----------
export type ContradictionStatus =
  | "none"
  | "minor_conflict"
  | "unresolved_conflict"
  | "escalated"
  | "resolved";

// ---------- READINESS STATUS ----------
export type ReadinessStatus =
  | "not_ready"
  | "internally_ready"
  | "leadership_ready"
  | "funder_ready"
  | "public_ready"
  | "blocked";

// ---------- PUBLICATION MODE ----------
export type PublicationMode =
  | "internal"
  | "leadership"
  | "partner_scoped"
  | "deidentified_funder"
  | "public_safe";

// ---------- CONFIDENCE BAND ----------
export type ConfidenceBand =
  | "low"
  | "moderate"
  | "high"
  | "very_high";

// ---------- TRUST ENVELOPE ----------
export interface TrustEnvelope {
  traceId: string;
  oracleVersion: string;
  lastUpdatedAt: string;

  truthStatus: TruthStatus;
  confidenceScore: number;
  confidenceBand: ConfidenceBand;

  verificationStatus: VerificationStatus;
  contradictionStatus: ContradictionStatus;
  readinessStatus: ReadinessStatus;

  publicationMode: PublicationMode;

  unresolvedItemsCount: number;
  warnings?: string[];
}

// ---------- TRUTH PACKAGE ----------
export interface TruthPackage {
  entityId: string;
  entityType: string;

  truthStatus: TruthStatus;
  confidenceScore: number;
  confidenceBand: ConfidenceBand;

  verificationStatus: VerificationStatus;
  contradictionStatus: ContradictionStatus;
  readinessStatus: ReadinessStatus;

  sourceSummary: string[];
  unresolvedItems: string[];

  recommendedNextAction?: string;

  lastTruthRefresh: string;
  traceId: string;

  trustEnvelope: TrustEnvelope;
}

// ---------- BACKWARD-COMPAT REPOSITORY ALIAS ----------
// Older repository code imports OracleTruthRecord.
// V1 contract uses TruthPackage as the official Oracle truth object.
export type OracleTruthRecord = TruthPackage;
