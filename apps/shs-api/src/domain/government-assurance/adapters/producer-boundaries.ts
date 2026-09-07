/**
 * Producer boundaries deliberately return non-authoritative candidates or
 * references. None of these helpers writes Claim, Evidence, Verification, or
 * Truth state; a canonical service must still accept and govern the result.
 */
export type GovernmentAssuranceProducerReference = {
  producerDomain: "workforce-outcome" | "verified-evidence" | "funding-grants" | "source-ingestion";
  producerReference: string;
  authorityState: "SOURCE_CANDIDATE" | "EVIDENCE_REFERENCE" | "FUNDING_REFERENCE";
};

export function workforceOutcomeClaimCandidate(reference: string): GovernmentAssuranceProducerReference {
  return { producerDomain: "workforce-outcome", producerReference: reference, authorityState: "SOURCE_CANDIDATE" };
}

export function verifiedEvidenceReference(reference: string): GovernmentAssuranceProducerReference {
  return { producerDomain: "verified-evidence", producerReference: reference, authorityState: "EVIDENCE_REFERENCE" };
}

export function fundingGrantReference(reference: string): GovernmentAssuranceProducerReference {
  return { producerDomain: "funding-grants", producerReference: reference, authorityState: "FUNDING_REFERENCE" };
}

export function sourceIngestionReference(reference: string): GovernmentAssuranceProducerReference {
  return { producerDomain: "source-ingestion", producerReference: reference, authorityState: "SOURCE_CANDIDATE" };
}
