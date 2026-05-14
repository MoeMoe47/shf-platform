export interface TrustEnvelope {
  trustId: string;
  entityId: string;
  verificationState: "pending" | "verified" | "blocked";
  confidenceScore: number;
  confidenceLabel: "low" | "medium" | "high";
  sourceCount: number;
  lastVerifiedAt: string;
  publicationMode: "admin_internal" | "leadership" | "partner_scoped" | "public_safe";
}

export interface ReadinessStatus {
  entityId: string;
  aggregationReady: boolean;
  verificationReady: boolean;
  reportingReady: boolean;
  missingFields: string[];
}

export interface VerificationCoverage {
  entityId: string;
  requiredEvidenceCount: number;
  verifiedEvidenceCount: number;
  coveragePercent: number;
  missingEvidence: string[];
}

export interface WorkflowHealth {
  workflowId: string;
  status: "healthy" | "warning" | "degraded" | "blocked";
  issueCount: number;
  lastUpdatedAt: string;
  summary: string;
}

export interface AnomalyRecord {
  anomalyId: string;
  entityId: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  summary: string;
  detectedAt: string;
}

export interface AnalystGroundingStatus {
  analystContextId: string;
  grounded: boolean;
  trustCoveragePercent: number;
  blockedReasons: string[];
}

export interface PublicationSafetyStatus {
  entityId: string;
  safeToPublish: boolean;
  publicationMode: "admin_internal" | "leadership" | "partner_scoped" | "public_safe";
  blockedReasons: string[];
}
