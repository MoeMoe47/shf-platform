import { REVIEW_GATE_POLICY, type ReviewPacket } from "./review-contract.js";

export function buildReviewPackets(reviewManifest: any, onboardingManifest: any, generatedAt: string): ReviewPacket[] {
  if (!reviewManifest || !Array.isArray(reviewManifest.candidates) || reviewManifest.candidates.length !== 32) throw new Error("REVIEW_MANIFEST_MUST_HAVE_32_CANDIDATES");
  const onboarding = new Map(onboardingManifest.candidates.map((candidate: any) => [candidate.candidate_id, candidate]));
  return reviewManifest.candidates.map((candidate: any) => {
    const sourceCandidate: any = onboarding.get(candidate.candidate_id);
    if (!sourceCandidate || sourceCandidate.proposed_commercial_product_id !== candidate.commercial_product_id) throw new Error("REVIEW_PACKET_CANDIDATE_IDENTITY_MISMATCH");
    const gates = candidate.review_gates.map((gate: any) => ({
      gate_type: gate.gate_type,
      current_status: gate.status,
      required_capability: REVIEW_GATE_POLICY[gate.gate_type as keyof typeof REVIEW_GATE_POLICY].capability,
      authority_types: REVIEW_GATE_POLICY[gate.gate_type as keyof typeof REVIEW_GATE_POLICY].authorityTypes,
      authority_reference: gate.reference || null,
      reference_meaning: "Manifest review-state provenance only; not evidence of approval.",
    }));
    const sourceEvidence: string[] = candidate.resolved_source_authorities.flatMap((source: any): string[] => [String(source.source_record_id), ...((source.source_provenance || []) as string[])]);
    const unresolvedBlockers = [...new Set([
      ...candidate.remaining_blockers,
      ...(candidate.unresolved_source_requirements || []).map((item: any) => item.required_evidence),
    ])];
    const notes = [
      "Packet generation records no human decision.",
      "Decision status must be entered through the governed review decision service with gate-specific capability and evidence.",
      "Readiness and sellability are unchanged by review decisions.",
    ];
    return {
      candidate_id: candidate.candidate_id,
      commercial_product_id: candidate.commercial_product_id,
      candidate_name: candidate.candidate_name,
      family: candidate.family,
      current_lifecycle: sourceCandidate.lifecycle,
      current_readiness: candidate.readiness,
      current_sellability: candidate.sellability,
      source_resolution_status: candidate.source_resolution_status,
      resolved_source_authorities: candidate.resolved_source_authorities,
      unresolved_source_requirements: candidate.unresolved_source_requirements,
      selling_entity: candidate.selling_entity_review.entity,
      delivery_entity: candidate.delivery_entity_review.entity,
      regulated_metadata: candidate.regulated_review,
      current_review_gates: gates,
      required_reviewers: gates.map((gate: any) => ({ gate_type: gate.gate_type, capability: gate.required_capability, authority_types: gate.authority_types })),
      required_evidence: gates.map((gate: any) => ({ gate_type: gate.gate_type, requirement: `Provide evidence accepted by ${gate.authority_types.join(" or ")} and linked to the exact scope under review.` })),
      existing_evidence_references: [...new Set(sourceEvidence)],
      unresolved_blockers: unresolvedBlockers,
      review_notes: notes,
      decision_history_references: [],
      production_onboarding_eligibility: candidate.production_onboarding_eligibility,
      contract_valid: (sourceCandidate.contract_validation_issues || []).length === 0,
      packet_version: 1,
      generated_at: generatedAt,
    } satisfies ReviewPacket;
  });
}
