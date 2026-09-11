/**
 * Compatibility boundary between GPA determinations and the platform Truth
 * Spine. GPA owns the assurance determination; Truth Spine owns institutional
 * truth. This module deliberately contains no Truth persistence.
 */
export const TRUTH_SPINE_AUTHORITY = "shs-truth-spine-v1";
export const TRUTH_SPINE_HANDOFF_EVENT = "government_assurance.truth_determination.accepted";

export function createTruthSpineHandoff(input: any) {
  const truthFactId = String(input?.truthFactId || "").trim();
  const determinationId = String(input?.determinationId || "").trim();
  const organizationId = String(input?.organizationId || "").trim();
  const tenantId = String(input?.tenantId || "").trim();
  if (!truthFactId || !determinationId || !organizationId || tenantId !== `tenant:${organizationId}`) {
    throw new Error("GPA_TRUTH_SPINE_HANDOFF_SCOPE_REQUIRED");
  }
  if (input?.decision !== "ACCEPTED" || input?.verificationStatus !== "PASSED") {
    throw new Error("GPA_TRUTH_SPINE_HANDOFF_VERIFICATION_REQUIRED");
  }
  return {
    authority: TRUTH_SPINE_AUTHORITY,
    eventType: TRUTH_SPINE_HANDOFF_EVENT,
    status: "PENDING_TRUTH_SPINE_INGESTION",
    truthFactId,
    determinationId,
    organizationId,
    tenantId,
    claimReference: input.claimReference || null,
    verificationReference: input.verificationReference || null,
    provenanceReference: input.provenanceReference || null,
  };
}

