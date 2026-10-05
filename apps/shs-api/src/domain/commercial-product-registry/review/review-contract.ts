import {
  REVIEW_GATE_STATUSES,
  REVIEW_GATE_TYPES,
  type ReviewGateStatus,
  type ReviewGateType,
} from "../model/commercial-product-registry-contract.js";

export const SOURCE_RESOLUTION_STATUSES = ["UNRESOLVED", "RESOLVED", "REJECTED_SOURCE", "STALE", "NEEDS_REVIEW"] as const;
export type SourceResolutionStatus = typeof SOURCE_RESOLUTION_STATUSES[number];

export const REVIEW_GATE_POLICY: Readonly<Record<ReviewGateType, {
  capability: string;
  authorityTypes: readonly string[];
  externalAuthority: boolean;
}>> = {
  COMMERCIAL_READINESS: { capability: "commercial_product.review_readiness", authorityTypes: ["COMMERCIAL_GOVERNANCE_AUTHORITY"], externalAuthority: false },
  LEGAL: { capability: "commercial_product.review_legal", authorityTypes: ["LEGAL_COUNSEL", "LEGAL_AUTHORITY"], externalAuthority: true },
  TAX: { capability: "commercial_product.review_tax", authorityTypes: ["TAX_AUTHORITY"], externalAuthority: true },
  REGULATORY: { capability: "commercial_product.review_regulatory", authorityTypes: ["EXTERNAL_REGULATOR", "APPROVED_TRAINING_AUTHORITY", "AUTHORIZED_PARTNER"], externalAuthority: true },
  PROCUREMENT: { capability: "commercial_product.review_procurement", authorityTypes: ["PROCUREMENT_AUTHORITY", "BUYER_PROCUREMENT_RECORD"], externalAuthority: true },
  FUNDING: { capability: "commercial_product.review_funding", authorityTypes: ["FUNDING_PROGRAM_AUTHORITY", "FUNDING_COMPATIBILITY_AUTHORITY"], externalAuthority: true },
  DELIVERY_CAPACITY: { capability: "commercial_product.review_delivery_capacity", authorityTypes: ["DELIVERY_OPERATIONS_AUTHORITY", "AUTHORIZED_PARTNER"], externalAuthority: false },
  EVIDENCE: { capability: "commercial_product.review_evidence", authorityTypes: ["EVIDENCE_AUTHORITY", "TRUTH_SPINE_AUTHORITY"], externalAuthority: true },
  SUPPORT: { capability: "commercial_product.review_support", authorityTypes: ["SUPPORT_SERVICE_OWNER"], externalAuthority: false },
  PRICING: { capability: "commercial_product.review_pricing", authorityTypes: ["APPROVED_PRICING_AUTHORITY"], externalAuthority: true },
  MARGIN: { capability: "commercial_product.review_margin", authorityTypes: ["FINANCE_COST_AUTHORITY"], externalAuthority: true },
  COMMISSION: { capability: "commercial_product.review_commission", authorityTypes: ["COMMISSION_POLICY_AUTHORITY"], externalAuthority: true },
  ENTITLEMENT: { capability: "commercial_product.review_entitlement", authorityTypes: ["SERVICE_CATALOG_AUTHORITY", "ENTITLEMENT_AUTHORITY"], externalAuthority: true },
  PARTNER: { capability: "commercial_product.review_partner", authorityTypes: ["PARTNER_RELATIONSHIP_AUTHORITY", "LEGAL_AUTHORITY"], externalAuthority: true },
};

export type ReviewPacket = {
  candidate_id: string;
  commercial_product_id: string;
  candidate_name: string;
  family: string;
  current_lifecycle: string;
  current_readiness: string;
  current_sellability: string;
  source_resolution_status: "SOURCE_RESOLVED" | "SOURCE_UNRESOLVED";
  resolved_source_authorities: readonly unknown[];
  unresolved_source_requirements: readonly unknown[];
  selling_entity: string;
  delivery_entity: string;
  regulated_metadata: Record<string, unknown>;
  current_review_gates: readonly Record<string, unknown>[];
  required_reviewers: readonly Record<string, unknown>[];
  required_evidence: readonly Record<string, unknown>[];
  existing_evidence_references: readonly string[];
  unresolved_blockers: readonly string[];
  review_notes: readonly string[];
  decision_history_references: readonly string[];
  production_onboarding_eligibility: boolean;
  contract_valid: boolean;
  packet_version: number;
  generated_at: string;
};

export function resolveCandidateIdentity(candidateId: string, commercialProductId: string, identities: ReadonlyMap<string, string>) {
  const expected = identities.get(candidateId);
  if (!expected || expected !== commercialProductId) throw new Error("REVIEW_CANDIDATE_IDENTITY_MISMATCH");
  return { candidateId, commercialProductId };
}

export function validateDecisionInput(input: any, authorityTypes: readonly string[]) {
  if (!input || !(REVIEW_GATE_TYPES as readonly string[]).includes(input.gateType)) throw new Error("REVIEW_GATE_TYPE_INVALID");
  if (!(REVIEW_GATE_STATUSES as readonly string[]).includes(input.decisionStatus)) throw new Error("REVIEW_DECISION_STATUS_INVALID");
  const reason = typeof input.decisionReason === "string" ? input.decisionReason.trim() : "";
  const authorityType = typeof input.authorityType === "string" ? input.authorityType.trim() : "";
  const authorityReference = typeof input.authorityReference === "string" ? input.authorityReference.trim() : "";
  const evidenceReferences = input.evidenceReferences;
  if (evidenceReferences !== undefined && (!Array.isArray(evidenceReferences) || evidenceReferences.some((ref: unknown) => typeof ref !== "string" || !ref.trim() || ref.length > 1000))) throw new Error("REVIEW_EVIDENCE_REFERENCE_INVALID");
  if (input.decisionStatus === "APPROVED" || input.decisionStatus === "NOT_REQUIRED") {
    if (!authorityType || !authorityReference || !Array.isArray(evidenceReferences) || evidenceReferences.length === 0) throw new Error("REVIEW_APPROVAL_AUTHORITY_REQUIRED");
    if (!authorityTypes.includes(authorityType)) throw new Error("REVIEW_AUTHORITY_TYPE_INVALID");
  }
  if (["BLOCKED", "STALE"].includes(input.decisionStatus) && !reason) throw new Error("REVIEW_DECISION_REASON_REQUIRED");
  if (authorityType && !authorityTypes.includes(authorityType)) throw new Error("REVIEW_AUTHORITY_TYPE_INVALID");
  if (authorityReference && authorityReference.length > 1000) throw new Error("REVIEW_AUTHORITY_REFERENCE_INVALID");
  if (!input.reviewedAt || Number.isNaN(Date.parse(input.reviewedAt))) throw new Error("REVIEW_TIMESTAMP_INVALID");
  for (const timestamp of [input.effectiveAt, input.expiresAt, input.staleAt]) if (timestamp && Number.isNaN(Date.parse(timestamp))) throw new Error("REVIEW_TIMESTAMP_INVALID");
  if (input.expiresAt && (Number.isNaN(Date.parse(input.expiresAt)) || Date.parse(input.expiresAt) < Date.parse(input.reviewedAt))) throw new Error("REVIEW_EXPIRY_INVALID");
  if (input.reviewDecisionId && (typeof input.reviewDecisionId !== "string" || input.reviewDecisionId.length > 160)) throw new Error("REVIEW_DECISION_ID_INVALID");
  if (reason.length > 4000) throw new Error("REVIEW_DECISION_REASON_INVALID");
  return { ...input, decisionReason: reason || null, authorityType: authorityType || null, authorityReference: authorityReference || null, evidenceReferences: evidenceReferences || [] };
}

export function validateSourceResolutionInput(input: any) {
  if (!input || !(SOURCE_RESOLUTION_STATUSES as readonly string[]).includes(input.resolutionStatus)) throw new Error("SOURCE_RESOLUTION_STATUS_INVALID");
  const authorityDomain = typeof input.authorityDomain === "string" ? input.authorityDomain.trim() : "";
  const authorityReference = typeof input.authorityReference === "string" ? input.authorityReference.trim() : "";
  const evidenceReference = typeof input.evidenceReference === "string" ? input.evidenceReference.trim() : "";
  const reason = typeof input.resolutionReason === "string" ? input.resolutionReason.trim() : "";
  const remainingRequirements = input.remainingRequirements || [];
  if (!Array.isArray(remainingRequirements) || remainingRequirements.some((item: unknown) => typeof item !== "string" || !item.trim())) throw new Error("SOURCE_RESOLUTION_REQUIREMENTS_INVALID");
  if (input.resolutionStatus === "RESOLVED" && (!authorityDomain || !authorityReference || !evidenceReference)) throw new Error("SOURCE_RESOLUTION_AUTHORITY_REQUIRED");
  if (input.resolutionStatus === "RESOLVED" && remainingRequirements.length) throw new Error("SOURCE_RESOLUTION_REQUIREMENTS_REMAIN");
  if (["REJECTED_SOURCE", "STALE"].includes(input.resolutionStatus) && !reason) throw new Error("SOURCE_RESOLUTION_REASON_REQUIRED");
  if (!input.resolvedAt || Number.isNaN(Date.parse(input.resolvedAt))) throw new Error("SOURCE_RESOLUTION_TIMESTAMP_INVALID");
  return { ...input, authorityDomain: authorityDomain || null, authorityReference: authorityReference || null, evidenceReference: evidenceReference || null, resolutionReason: reason || null, remainingRequirements };
}

export function reassessReviewPacket(packet: ReviewPacket, latestDecisions: readonly any[], latestSourceResolution?: any | null, asOf = new Date().toISOString()) {
  const decisionByGate = new Map(latestDecisions.map((decision) => [decision.gate_type, decision]));
  const asOfTime = Date.parse(asOf);
  const sourceResolved = latestSourceResolution
    ? latestSourceResolution.resolution_status === "RESOLVED" && !(latestSourceResolution.remaining_requirements || []).length
    : packet.source_resolution_status === "SOURCE_RESOLVED" && packet.unresolved_source_requirements.length === 0;
  const sourceStatus = latestSourceResolution?.resolution_status === "STALE"
    ? "SOURCE_STALE"
    : latestSourceResolution?.resolution_status === "REJECTED_SOURCE"
      ? "SOURCE_REJECTED"
      : latestSourceResolution?.resolution_status === "NEEDS_REVIEW"
        ? "SOURCE_REVIEW_REQUIRED"
        : sourceResolved ? "SOURCE_RESOLVED" : "SOURCE_UNRESOLVED";
  const requiredGates = packet.current_review_gates.filter((gate: any) => gate.status !== "NOT_REQUIRED");
  const remainingRequiredGates: string[] = [];
  const blockingGates: string[] = [];
  const staleGates: string[] = [];
  let completed = 0;
  for (const gate of requiredGates as any[]) {
    const decision = decisionByGate.get(gate.gate_type);
    const dateExpired = decision && [decision.expires_at, decision.stale_at].some((date) => date && Date.parse(date) <= asOfTime);
    const status = dateExpired ? "STALE" : decision?.decision_status || gate.status;
    if (status === "APPROVED" || status === "NOT_REQUIRED") completed++;
    else remainingRequiredGates.push(gate.gate_type);
    if (status === "BLOCKED") blockingGates.push(gate.gate_type);
    if (status === "STALE") staleGates.push(gate.gate_type);
  }
  const reviewStatus = completed === requiredGates.length ? "REVIEW_RESOLVED" : completed > 0 ? "REVIEW_PARTIALLY_RESOLVED" : "REVIEW_PENDING";
  const reasons: string[] = [];
  if (!sourceResolved) reasons.push("credible_source_authority_unresolved");
  if (remainingRequiredGates.length) reasons.push("required_review_gates_unresolved");
  if (blockingGates.length) reasons.push("blocking_review_gates_present");
  if (staleGates.length) reasons.push("stale_review_gates_present");
  if (packet.selling_entity === "UNKNOWN" || packet.selling_entity === "JOINT_STRUCTURE_REVIEW_REQUIRED") reasons.push("selling_entity_unresolved");
  if (packet.delivery_entity === "UNKNOWN" || packet.delivery_entity === "JOINT_STRUCTURE_REVIEW_REQUIRED") reasons.push("delivery_entity_unresolved");
  if (!packet.contract_valid) reasons.push("product_contract_invalid_or_unverified");
  const eligible = reasons.length === 0;
  if (!eligible && !reasons.length) reasons.push("separate_production_onboarding_authorization_required");
  return { source_status: sourceStatus, review_status: reviewStatus, remaining_required_gates: remainingRequiredGates, blocking_gates: blockingGates, stale_gates: staleGates, production_onboarding_eligibility: eligible, eligibility_reason: reasons };
}

export function summarizeReviewAssessments(assessments: readonly any[]) {
  return assessments.reduce((counts, assessment) => {
    counts.total++;
    if (assessment.source_status === "SOURCE_RESOLVED") counts.source_resolved++;
    else counts.source_unresolved++;
    if (assessment.review_status === "REVIEW_PENDING") counts.review_pending++;
    if (assessment.review_status === "REVIEW_PARTIALLY_RESOLVED") counts.review_partially_resolved++;
    if (assessment.review_status === "REVIEW_RESOLVED") counts.review_resolved++;
    if ((assessment.blocking_gates || []).length) counts.blocked++;
    if ((assessment.stale_gates || []).length || assessment.source_status === "SOURCE_STALE") counts.stale++;
    if (assessment.production_onboarding_eligibility) counts.production_onboarding_eligible++;
    return counts;
  }, { total: 0, source_resolved: 0, source_unresolved: 0, review_pending: 0, review_partially_resolved: 0, review_resolved: 0, blocked: 0, stale: 0, production_onboarding_eligible: 0 });
}
