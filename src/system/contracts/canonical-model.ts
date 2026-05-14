export type PublicationMode =
  | "operator"
  | "leadership"
  | "partner_scoped"
  | "public_safe"
  | "admin_internal";

export type VerificationState =
  | "verified"
  | "pending"
  | "self_reported"
  | "inferred"
  | "disputed"
  | "rejected";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface TrustEnvelope {
  verificationState: VerificationState;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number; // 0-100
  freshnessLabel: string; // e.g. "live", "24h", "7d"
  sourceCount: number;
  sourceIds: string[];
  lineageId?: string;
  lastUpdatedAt?: string;
  publicationMode: PublicationMode;
}

export interface OrganizationEntity {
  id: string;
  name: string;
  type:
    | "nonprofit"
    | "government"
    | "school"
    | "provider"
    | "funder"
    | "employer"
    | "internal";
  region?: string;
  county?: string;
  status?: "active" | "inactive" | "pending";
  trust?: TrustEnvelope;
}

export interface PartnerEntity {
  id: string;
  organizationId: string;
  partnershipType:
    | "referral"
    | "funding"
    | "service_delivery"
    | "data_sharing"
    | "hub_member";
  slaStatus?: "healthy" | "watch" | "breach";
  trust?: TrustEnvelope;
}

export interface ReferralEntity {
  id: string;
  fromOrganizationId: string;
  toOrganizationId: string;
  county?: string;
  programId?: string;
  unmetNeedId?: string;
  status:
    | "intake"
    | "queued"
    | "accepted"
    | "in_progress"
    | "blocked"
    | "completed"
    | "closed";
  priority: "high" | "medium" | "low";
  createdAt: string;
  updatedAt?: string;
  trust?: TrustEnvelope;
}

export interface UnmetNeedEntity {
  id: string;
  category:
    | "housing"
    | "education"
    | "employment"
    | "health"
    | "transportation"
    | "documentation"
    | "other";
  county?: string;
  status: "open" | "queued" | "matched" | "resolved" | "unresolved";
  severity: "critical" | "high" | "medium" | "low";
  linkedReferralIds?: string[];
  trust?: TrustEnvelope;
}

export interface EventEntity {
  id: string;
  eventType:
    | "referral_created"
    | "referral_updated"
    | "verification_completed"
    | "report_generated"
    | "simulation_run"
    | "outcome_recorded"
    | "partner_action"
    | "manual_review";
  relatedEntityType:
    | "organization"
    | "partner"
    | "referral"
    | "unmet_need"
    | "outcome"
    | "report";
  relatedEntityId: string;
  createdAt: string;
  actorId?: string;
  county?: string;
  trust?: TrustEnvelope;
}

export interface OutcomeEntity {
  id: string;
  programId?: string;
  county?: string;
  outcomeType:
    | "placement"
    | "retention"
    | "completion"
    | "stabilization"
    | "enrollment"
    | "credential"
    | "other";
  status: "positive" | "mixed" | "negative" | "pending";
  measuredAt?: string;
  trust?: TrustEnvelope;
}

export interface VerificationRecordEntity {
  id: string;
  targetEntityType:
    | "organization"
    | "partner"
    | "referral"
    | "unmet_need"
    | "outcome"
    | "report";
  targetEntityId: string;
  verificationState: VerificationState;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface GeographySignalEntity {
  id: string;
  county: string;
  region?: string;
  signalType:
    | "risk"
    | "funding"
    | "outcome"
    | "program_health"
    | "verification"
    | "activity";
  signalStatus: "normal" | "watch" | "processing" | "critical";
  valueLabel?: string;
  trust?: TrustEnvelope;
}

export interface ReportArtifactEntity {
  id: string;
  title: string;
  reportType: "briefing" | "institutional_report" | "audit_pack" | "memo";
  publicationMode: PublicationMode;
  createdAt: string;
  relatedEntityIds?: string[];
  trust?: TrustEnvelope;
}

export interface CertifiedContext {
  activeSurface:
    | "exchange"
    | "shf_command"
    | "aggregation"
    | "hub"
    | "reporting";
  selectedCounty?: string;
  selectedRegion?: string;
  selectedOrganizationId?: string;
  selectedPartnerId?: string;
  selectedReferralId?: string;
  selectedUnmetNeedId?: string;
  selectedOutcomeId?: string;
  selectedReportId?: string;
  selectedProgramId?: string;
  publicationMode: PublicationMode;
  analystAudience?: "operator" | "leader" | "funder" | "public";
  simulationMode?: "off" | "preview" | "active";
  trust?: TrustEnvelope;
}
