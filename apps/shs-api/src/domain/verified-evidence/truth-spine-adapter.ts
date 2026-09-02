/**
 * Canonical bridge from SHS learner-domain Truth projections to the existing
 * Agent Fabric Truth Spine governance envelope. This adapter normalizes and
 * exposes durable SHS facts; it does not create a second Truth ledger or use
 * Agent Fabric's development-only JSONL stores as production persistence.
 */
export function toTruthSpineFact(fact: any) {
  return {
    fact_id: String(fact.truth_fact_id),
    claim_type: "fact",
    subject_id: String(fact.learner_user_id),
    predicate: String(fact.fact_type),
    organization_id: String(fact.organization_id),
    assignment_id: fact.assignment_id || null,
    curriculum_release_id: fact.curriculum_release_id || null,
    release_version: fact.release_version ?? null,
    competency_id: fact.competency_id || null,
    source_type: String(fact.source_type),
    source_record_id: String(fact.source_record_id),
    evidence_rule_id: fact.evidence_rule_id || null,
    evidence_rule_version: fact.evidence_rule_version ?? null,
    occurred_at: fact.occurred_at,
    provenance: fact.provenance_json || {},
  };
}
