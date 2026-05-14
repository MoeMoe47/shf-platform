import type {
  EventEntity,
  OrganizationEntity,
  ReferralEntity,
  ReportArtifactEntity,
  TrustEnvelope,
  UnmetNeedEntity,
  VerificationRecordEntity,
} from "./canonical-model";

export type HubSourceKind =
  | "hub_referral"
  | "hub_unmet_need_inference"
  | "hub_assignment"
  | "hub_transition"
  | "hub_resolution"
  | "hub_closure";

export interface HubReferralSource {
  case_id: string;
  organization_id?: string;
  receiving_organization_id?: string;
  need_category?: string;
  urgency_level?: string;
  priority?: string;
  status?: string;
  assigned_user_id?: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HubUnmetNeedInferenceSource {
  inference_id: string;
  source_case_ids: string[];
  trigger_rule: string;
  county?: string;
  region?: string;
  severity?: "critical" | "high" | "medium" | "low";
  inferred_category?: string;
  confidence_score?: number;
  notes?: string;
  created_at?: string;
}

export interface BridgeReadiness {
  aggregationReady: boolean;
  verificationReady: boolean;
  reportingReady: boolean;
  missingFields: string[];
}

export interface HubBridgeTrace {
  bridgeId: string;
  sourceKind: HubSourceKind;
  sourceId: string;
  aggregationEntityIds: string[];
  verificationRecordIds: string[];
  eventIds: string[];
  reportArtifactIds: string[];
  trust: TrustEnvelope;
  readiness: BridgeReadiness;
}

export interface BridgedHubReferral {
  source: HubReferralSource;
  referral: ReferralEntity;
  event: EventEntity;
  trust: TrustEnvelope;
  readiness: BridgeReadiness;
}

export interface BridgedHubUnmetNeed {
  source: HubUnmetNeedInferenceSource;
  unmetNeed: UnmetNeedEntity;
  event: EventEntity;
  trust: TrustEnvelope;
  readiness: BridgeReadiness;
}

export interface VerificationBridgePackage {
  sourceKind: HubSourceKind;
  sourceId: string;
  verification: VerificationRecordEntity;
  trust: TrustEnvelope;
  readiness: BridgeReadiness;
}

export interface ReportingBridgePackage {
  sourceKind: HubSourceKind;
  sourceId: string;
  report: ReportArtifactEntity;
  trust: TrustEnvelope;
  readiness: BridgeReadiness;
}

export interface HubAggregationBridgeBundle {
  organizations?: OrganizationEntity[];
  bridgedReferrals?: BridgedHubReferral[];
  bridgedUnmetNeeds?: BridgedHubUnmetNeed[];
  verificationPackages?: VerificationBridgePackage[];
  reportingPackages?: ReportingBridgePackage[];
  traces: HubBridgeTrace[];
}

export function createBridgeReadiness(partial: Partial<BridgeReadiness> = {}): BridgeReadiness {
  return {
    aggregationReady: partial.aggregationReady ?? false,
    verificationReady: partial.verificationReady ?? false,
    reportingReady: partial.reportingReady ?? false,
    missingFields: partial.missingFields ?? [],
  };
}

export function createBridgeTrustEnvelope(
  partial: Partial<TrustEnvelope> = {}
): TrustEnvelope {
  return {
    verificationState: partial.verificationState ?? "pending",
    confidenceLevel: partial.confidenceLevel ?? "medium",
    confidenceScore: partial.confidenceScore ?? 50,
    freshnessLabel: partial.freshnessLabel ?? "unknown",
    sourceCount: partial.sourceCount ?? 1,
    sourceIds: partial.sourceIds ?? [],
    lineageId: partial.lineageId,
    lastUpdatedAt: partial.lastUpdatedAt,
    publicationMode: partial.publicationMode ?? "admin_internal",
  };
}

export function mapHubReferralToCanonicalReferral(
  source: HubReferralSource,
  trust: TrustEnvelope = createBridgeTrustEnvelope()
): ReferralEntity {
  const normalizedPriority = String(source.priority || source.urgency_level || "medium").toLowerCase();
  const normalizedStatus = String(source.status || "queued").toLowerCase();

  const mappedStatus: ReferralEntity["status"] =
    normalizedStatus === "open"
      ? "queued"
      : normalizedStatus === "assigned"
      ? "accepted"
      : normalizedStatus === "in_review"
      ? "in_progress"
      : normalizedStatus === "on_hold"
      ? "blocked"
      : normalizedStatus === "resolved"
      ? "completed"
      : normalizedStatus === "closed"
      ? "closed"
      : "queued";

  const mappedPriority: ReferralEntity["priority"] =
    normalizedPriority === "high"
      ? "high"
      : normalizedPriority === "low"
      ? "low"
      : "medium";

  return {
    id: source.case_id,
    fromOrganizationId: source.organization_id || "unknown_sender",
    toOrganizationId: source.receiving_organization_id || "unknown_receiver",
    county: undefined,
    programId: undefined,
    unmetNeedId: undefined,
    status: mappedStatus,
    priority: mappedPriority,
    createdAt: source.created_at || new Date().toISOString(),
    updatedAt: source.updated_at || source.created_at || new Date().toISOString(),
    trust,
  };
}

export function mapHubInferenceToUnmetNeed(
  source: HubUnmetNeedInferenceSource,
  trust: TrustEnvelope = createBridgeTrustEnvelope()
): UnmetNeedEntity {
  return {
    id: source.inference_id,
    category:
      source.inferred_category === "housing" ||
      source.inferred_category === "education" ||
      source.inferred_category === "employment" ||
      source.inferred_category === "health" ||
      source.inferred_category === "transportation" ||
      source.inferred_category === "documentation"
        ? source.inferred_category
        : "other",
    county: source.county,
    status: "open",
    severity: source.severity || "medium",
    linkedReferralIds: source.source_case_ids,
    trust,
  };
}

export function createHubBridgeEvent(params: {
  sourceKind: HubSourceKind;
  sourceId: string;
  relatedEntityType: EventEntity["relatedEntityType"];
  relatedEntityId: string;
  county?: string;
  actorId?: string;
  trust?: TrustEnvelope;
}): EventEntity {
  const eventTypeMap: Record<HubSourceKind, EventEntity["eventType"]> = {
    hub_referral: "referral_created",
    hub_unmet_need_inference: "manual_review",
    hub_assignment: "partner_action",
    hub_transition: "referral_updated",
    hub_resolution: "outcome_recorded",
    hub_closure: "report_generated",
  };

  return {
    id: `evt_${params.sourceKind}_${params.sourceId}`,
    eventType: eventTypeMap[params.sourceKind],
    relatedEntityType: params.relatedEntityType,
    relatedEntityId: params.relatedEntityId,
    createdAt: new Date().toISOString(),
    actorId: params.actorId,
    county: params.county,
    trust: params.trust,
  };
}

function evaluateReferralBridgeReadiness(referral: ReferralEntity): BridgeReadiness {
  const missingFields: string[] = [];

  if (!referral.fromOrganizationId || referral.fromOrganizationId === "unknown_sender") {
    missingFields.push("fromOrganizationId");
  }

  if (!referral.toOrganizationId || referral.toOrganizationId === "unknown_receiver") {
    missingFields.push("toOrganizationId");
  }

  if (!referral.createdAt) {
    missingFields.push("createdAt");
  }

  const lifecycleReady = referral.status === "completed" || referral.status === "closed";
  if (!lifecycleReady) {
    missingFields.push("completed_or_closed_status");
  }

  const aggregationReady = !missingFields.includes("fromOrganizationId") &&
    !missingFields.includes("toOrganizationId") &&
    !missingFields.includes("createdAt");

  const verificationReady = aggregationReady && lifecycleReady;
  const reportingReady = verificationReady;

  return createBridgeReadiness({
    aggregationReady,
    verificationReady,
    reportingReady,
    missingFields,
  });
}

export function createVerificationPackageFromReferral(
  referral: ReferralEntity,
  sourceKind: HubSourceKind,
  sourceId: string,
  trust: TrustEnvelope = createBridgeTrustEnvelope()
): VerificationBridgePackage {
  const readiness = evaluateReferralBridgeReadiness(referral);

  return {
    sourceKind,
    sourceId,
    verification: {
      id: `ver_${referral.id}`,
      targetEntityType: "referral",
      targetEntityId: referral.id,
      verificationState: "pending",
      verifiedBy: "",
      verifiedAt: "",
      notes: readiness.verificationReady
        ? "Referral is ready for verification review."
        : `Referral is not verification-ready. Missing: ${readiness.missingFields.join(", ") || "none"}.`,
    },
    trust,
    readiness,
  };
}

export function createReportPackageFromReferral(
  referral: ReferralEntity,
  sourceKind: HubSourceKind,
  sourceId: string,
  trust: TrustEnvelope = createBridgeTrustEnvelope()
): ReportingBridgePackage {
  const readiness = evaluateReferralBridgeReadiness(referral);

  return {
    sourceKind,
    sourceId,
    report: {
      id: `rep_${referral.id}`,
      title: `Referral Summary ${referral.id}`,
      reportType: readiness.reportingReady ? "briefing" : "memo",
      publicationMode: "admin_internal",
      createdAt: new Date().toISOString(),
      relatedEntityIds: [referral.id],
      trust,
    },
    trust,
    readiness,
  };
}
