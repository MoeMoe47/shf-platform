export function calculateDirectSourceProofMetrics(proofs = [], approvedCategories = [], deferredCategories = []) {
  const safeProofs = Array.isArray(proofs) ? proofs : [];
  return {
    proof_count: safeProofs.length,
    approved_source_categories: approvedCategories.length,
    deferred_source_categories: deferredCategories.length,
    shs_reporting_ready: safeProofs.filter((proof) => proof.safe_for_shs_reporting).length,
    blocked: safeProofs.filter((proof) => proof.blockers?.length || proof.verification_status === "blocked").length,
    needs_review: safeProofs.filter((proof) => proof.privacy_status !== "clear" || proof.ownership_status !== "clear" || proof.approval_status !== "approved_internal").length,
    average_readiness_score: safeProofs.length
      ? Math.round(safeProofs.reduce((sum, proof) => sum + Number(proof.readiness_score || 0), 0) / safeProofs.length)
      : 0,
    public_surface_ready: 0,
    live_connection_enabled_count: safeProofs.filter((proof) => proof.live_connection_enabled).length,
    credential_required_count: safeProofs.filter((proof) => proof.credential_required).length,
    external_api_called_count: safeProofs.filter((proof) => proof.external_api_called).length,
  };
}
